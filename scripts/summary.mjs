#!/usr/bin/env node

/**
 * 📰 NewsPulse - News Summarizer
 * 新闻摘要 - AI 驱动的摘要生成
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUMMARY_FILE = join(__dirname, '..', 'data', 'summaries.json');

/**
 * 关键词提取
 */
function extractKeywords(text, limit = 5) {
  // 简单的关键词提取（中文分词简化版）
  const words = text
    .toLowerCase()
    .split(/[\s,.,,,!,?,"",''.,.]/)
    .filter(word => word.length > 2);

  // 停用词
  const stopwords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    '在', '是', '了', '和', '与', '及', '或', '等', '个', '的', '了'
  ]);

  const wordCount = {};
  words.forEach(word => {
    if (!stopwords.has(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * 生成摘要 (简化版)
 */
function generateSummary(text, maxLength = 200) {
  // 按句子分割
  const sentences = text.split(/[.。!?！？]/).filter(s => s.trim().length > 10);

  if (sentences.length === 0) {
    return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  // 取第一句和最后一句
  let summary = sentences[0].trim();
  
  if (sentences.length > 1) {
    summary += '。' + sentences[sentences.length - 1].trim();
  }

  if (summary.length > maxLength) {
    summary = summary.slice(0, maxLength) + '...';
  }

  return summary;
}

/**
 * 提取要点
 */
function extractKeyPoints(text, limit = 3) {
  const sentences = text.split(/[.。!?！？]/).filter(s => s.trim().length > 15);

  // 简单评分：句子长度 + 关键词数量
  const keywords = extractKeywords(text, 10);
  
  const scored = sentences.map(sentence => {
    let score = sentence.length;
    keywords.forEach(keyword => {
      if (sentence.toLowerCase().includes(keyword)) {
        score += 10;
      }
    });
    return { sentence: sentence.trim(), score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.sentence);
}

/**
 * 生成标题
 */
function generateTitle(text, maxLength = 50) {
  const firstSentence = text.split(/[.。]/)[0];
  
  if (firstSentence.length <= maxLength) {
    return firstSentence.trim();
  }

  // 提取最重要的部分
  const words = firstSentence.split(/\s+/);
  let title = '';
  
  for (const word of words) {
    if ((title + word).length > maxLength - 3) break;
    title += word + ' ';
  }

  return title.trim() + '...';
}

/**
 * 显示摘要
 */
function printSummary(text, options = {}) {
  const { type = 'full' } = options;

  const title = generateTitle(text);
  const keywords = extractKeywords(text, 5);
  const summary = generateSummary(text, options.maxLength || 200);
  const keyPoints = extractKeyPoints(text, 3);

  console.log('\n📰 NewsPulse - 新闻摘要\n');
  console.log('═'.repeat(80));

  console.log(`📌 标题：${title}\n`);

  if (type === 'brief' || type === 'short') {
    // 简短摘要
    console.log('─'.repeat(80));
    console.log(summary);
    console.log('─'.repeat(80));
  } else {
    // 完整摘要
    console.log('📝 摘要\n');
    console.log('─'.repeat(80));
    console.log(summary);
    console.log('─'.repeat(80));

    console.log('\n🔑 要点\n');
    keyPoints.forEach((point, i) => {
      console.log(`  ${i + 1}. ${point}`);
    });

    console.log('\n🏷️  关键词\n');
    console.log('  ' + keywords.map(k => `#${k}`).join('  '));
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n💡 提示:');
  console.log('   --brief  简短摘要（只显示核心内容）');
  console.log('   --full   完整摘要（包含要点和关键词）');
  console.log('   --word-limit <数量>  调整摘要长度');
  console.log('');
}

/**
 * 批量摘要
 */
function batchSummaries(texts) {
  console.log('\n📰 NewsPulse - 批量摘要\n');
  console.log('═'.repeat(90));

  texts.forEach((text, index) => {
    const title = generateTitle(text, 40);
    const summary = generateSummary(text, 100);
    
    console.log(`\n【${index + 1}】${title}\n`);
    console.log(`   ${summary}\n`);
    console.log('─'.repeat(90));
  });

  console.log(`\n总计：${texts.length} 条新闻摘要\n`);
}

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const options = {};
  let text = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      options[key] = value;
      i++;
    } else if (!args[i].startsWith('-') && key !== 'text') {
      text += args[i] + ' ';
    }
  }

  if (options.text) {
    text = options.text;
  } else if (text) {
    options.rawText = text.trim();
  }

  return options;
}

/**
 * 显示帮助
 */
function showHelp() {
  console.log(`
📰 NewsPulse - 新闻摘要

用法:
  node scripts/summary.mjs [文本]
  node scripts/summary.mjs --text "长文本内容..."

选项:
  --text <文本>       要摘要的文本
  --file <文件>       从文件读取文本
  --brief             简短摘要模式
  --full              完整摘要模式 (默认)
  --word-limit <数量> 摘要字数限制 (默认 200)
  --batch             批量处理模式
  --help              显示帮助

示例:
  node scripts/summary.mjs --text "以太坊今日宣布重大升级，将提高交易速度 10 倍..."
  node scripts/summary.mjs --brief --word-limit 100 "长文本..."
  node scripts/summary.mjs --file article.txt

摘要类型:
  • brief: 只显示核心摘要
  • full: 包含摘要、要点和关键词

字数建议:
  • 推文中：50-100 字
  • 快速浏览：100-150字
  • 详细阅读：200-300 字
`);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const options = parseArgs(args);

  if (options.rawText) {
    printSummary(options.rawText, options);
  } else if (options.text) {
    printSummary(options.text, options);
  } else if (options.file) {
    try {
      const content = await readFile(options.file, 'utf-8');
      printSummary(content, options);
    } catch (error) {
      console.error(`❌ 读取文件失败：${error.message}`);
    }
  } else {
    showHelp();
  }
}

main().catch(console.error);
