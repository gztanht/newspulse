#!/usr/bin/env node

/**
 * 📰 NewsPulse - Sentiment Analyzer
 * 新闻情绪分析 - 分析新闻/社交媒体情绪
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SENTIMENT_FILE = join(__dirname, '..', 'data', 'sentiment.json');

/**
 * 情绪关键词库
 */
const SENTIMENT_KEYWORDS = {
  positive: [
    '上涨', '突破', '新高', '暴涨', '利好', '成功', '升级', '合作',
    'adopt', 'adoption', 'bullish', 'breakthrough', 'success', 'growth',
    'partnership', 'upgrade', 'innovation', 'record', 'milestone',
    'surge', 'rally', 'gain', 'profit', 'bull market', 'moon'
  ],
  negative: [
    '下跌', '暴跌', '崩盘', '黑客', '被盗', '监管', '禁令', '失败',
    'crash', 'hack', 'stolen', 'ban', 'regulation', 'lawsuit', 'fraud',
    'scam', 'bear market', 'loss', 'fail', 'exploit', 'vulnerability',
    'dump', 'liquidation', 'bankruptcy', 'collapse'
  ],
  neutral: [
    '宣布', '发布', '更新', '报告', '分析', '观点',
    'announce', 'release', 'update', 'report', 'analysis', 'opinion'
  ]
};

/**
 * 分析文本情绪
 */
function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();
  
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  // 计算正面词汇
  SENTIMENT_KEYWORDS.positive.forEach(word => {
    if (lowerText.includes(word.toLowerCase())) {
      positive++;
    }
  });

  // 计算负面词汇
  SENTIMENT_KEYWORDS.negative.forEach(word => {
    if (lowerText.includes(word.toLowerCase())) {
      negative++;
    }
  });

  // 计算中性词汇
  SENTIMENT_KEYWORDS.neutral.forEach(word => {
    if (lowerText.includes(word.toLowerCase())) {
      neutral++;
    }
  });

  const total = positive + negative + neutral;
  
  if (total === 0) {
    return {
      score: 0,
      sentiment: 'neutral',
      positive: 0,
      negative: 0,
      neutral: 0,
      confidence: 0
    };
  }

  const score = (positive - negative) / total;
  const confidence = Math.min((total / 10) * 100, 100);

  let sentiment;
  if (score > 0.3) sentiment = 'positive';
  else if (score < -0.3) sentiment = 'negative';
  else sentiment = 'neutral';

  return {
    score: parseFloat(score.toFixed(2)),
    sentiment,
    positive,
    negative,
    neutral,
    confidence: parseFloat(confidence.toFixed(1))
  };
}

/**
 * 情绪指数 (0-100)
 */
function calculateSentimentIndex(result) {
  // 将 -1 到 1 的分数转换为 0-100
  return Math.round((result.score + 1) * 50);
}

/**
 * 显示情绪分析结果
 */
function printAnalysis(text, result) {
  const index = calculateSentimentIndex(result);
  const gauge = createGauge(index);

  console.log('\n📊 NewsPulse - 情绪分析\n');
  console.log('═'.repeat(70));
  
  console.log('分析文本:');
  console.log('─'.repeat(70));
  const preview = text.length > 200 ? text.slice(0, 200) + '...' : text;
  console.log(`"${preview}"\n`);
  console.log('─'.repeat(70));

  console.log('\n分析结果:\n');
  console.log(`情绪指数：${index}/100 ${gauge}`);
  console.log(`情绪倾向：${getSentimentEmoji(result.sentiment)} ${result.sentiment.toUpperCase()}`);
  console.log(`置信度：  ${result.confidence}%`);
  console.log('');

  console.log('词汇统计:');
  console.log('─'.repeat(50));
  console.log(`🟢 正面词汇：${result.positive} 个`);
  console.log(`🔴 负面词汇：${result.negative} 个`);
  console.log(`⚪ 中性词汇：${result.neutral} 个`);
  console.log(`总计：    ${result.positive + result.negative + result.neutral} 个`);
  console.log('');

  console.log('情绪解读:');
  console.log('─'.repeat(50));
  if (result.sentiment === 'positive') {
    console.log('💚 市场情绪积极，可能是好消息或价格上涨');
    if (index > 80) {
      console.log('⚠️  注意：极度乐观，警惕 FOMO 情绪');
    }
  } else if (result.sentiment === 'negative') {
    console.log('❤️  市场情绪消极，可能是坏消息或价格下跌');
    if (index < 20) {
      console.log('⚠️  注意：极度悲观，可能是买入机会');
    }
  } else {
    console.log('💛 市场情绪中性，无明显倾向');
  }
  console.log('');

  console.log('═'.repeat(70));
  console.log('\n💡 使用建议:');
  console.log('   • 结合多个新闻源进行综合判断');
  console.log('   • 关注情绪变化趋势而非单点数据');
  console.log('   • 高置信度 (>80%) 结果更可靠');
  console.log('');
}

/**
 * 创建情绪仪表盘
 */
function createGauge(index) {
  const bars = 10;
  const filled = Math.round((index / 100) * bars);
  const empty = bars - filled;

  let gauge = '[';
  for (let i = 0; i < filled; i++) gauge += '█';
  for (let i = 0; i < empty; i++) gauge += '░';
  gauge += ']';

  return gauge;
}

/**
 * 获取情绪 Emoji
 */
function getSentimentEmoji(sentiment) {
  switch (sentiment) {
    case 'positive': return '🟢';
    case 'negative': return '🔴';
    case 'neutral': return '🟡';
    default: return '⚪';
  }
}

/**
 * 分析多个新闻
 */
async function analyzeMultiple(texts) {
  const results = texts.map((text, index) => {
    const result = analyzeSentiment(text);
    return {
      index: index + 1,
      text: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
      ...result
    };
  });

  // 计算平均情绪
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const avgIndex = calculateSentimentIndex({ score: avgScore });

  console.log('\n📊 NewsPulse - 批量情绪分析\n');
  console.log('═'.repeat(90));
  console.log(
    '序号'.padEnd(6) +
    '情绪'.padEnd(10) +
    '指数'.padEnd(8) +
    '置信度'.padEnd(10) +
    '正面'.padEnd(6) +
    '负面'.padEnd(6) +
    '文本预览'
  );
  console.log('═'.repeat(90));

  results.forEach(r => {
    const emoji = getSentimentEmoji(r.sentiment);
    const index = calculateSentimentIndex(r);
    console.log(
      `${r.index.toString().padEnd(6)} ` +
      `${emoji} ${r.sentiment.padEnd(7)} ` +
      `${index.toString().padEnd(6)} ` +
      `${r.confidence.toString().padEnd(8)} ` +
      `${r.positive.toString().padEnd(4)} ` +
      `${r.negative.toString().padEnd(4)} ` +
      `${r.text}`
    );
  });

  console.log('═'.repeat(90));
  console.log(`\n平均情绪指数：${avgIndex}/100 (${avgScore > 0 ? '偏正面' : avgScore < 0 ? '偏负面' : '中性'})`);
  console.log(`分析数量：${results.length} 条\n`);

  return results;
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
    } else if (!args[i].startsWith('-') && i > 0) {
      text += args[i] + ' ';
    }
  }

  if (text) {
    options.text = text.trim();
  }

  return options;
}

/**
 * 显示帮助
 */
function showHelp() {
  console.log(`
📰 NewsPulse - 情绪分析

用法:
  node scripts/sentiment.mjs [文本]
  node scripts/sentiment.mjs --text "比特币突破新高，市场情绪高涨"

选项:
  --text <文本>    要分析的文本
  --file <文件>    从文件读取文本
  --batch          批量分析模式
  --help           显示帮助

示例:
  node scripts/sentiment.mjs "以太坊成功升级，开发者社区活跃"
  node scripts/sentiment.mjs --text "比特币暴跌，交易所被黑"
  node scripts/sentiment.mjs --file news.txt

情绪指数说明:
  80-100: 极度乐观 🟢🟢🟢
  60-79:  偏正面 🟢🟢
  41-59:  中性 🟡
  21-40:  偏负面 🔴🔴
  0-20:   极度悲观 🔴🔴🔴

注意事项:
  • 置信度 >80% 时结果更可靠
  • 结合多个新闻源综合判断
  • 关注情绪变化趋势
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

  if (options.text) {
    const result = analyzeSentiment(options.text);
    printAnalysis(options.text, result);
  } else {
    // 无 --text 参数时，将剩余参数视为文本
    const text = args.join(' ');
    if (text.length > 0) {
      const result = analyzeSentiment(text);
      printAnalysis(text, result);
    } else {
      showHelp();
    }
  }
}

main().catch(console.error);
