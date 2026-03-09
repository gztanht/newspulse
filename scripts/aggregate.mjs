#!/usr/bin/env node

/**
 * 📰 NewsPulse - News Aggregator
 * 新闻聚合 - 从多个来源获取新闻
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = join(__dirname, '..', 'data', 'news-cache.json');

/**
 * 新闻源配置
 */
const NEWS_SOURCES = [
  {
    id: 'coindesk',
    name: 'CoinDesk',
    url: 'https://www.coindesk.com',
    category: 'mainstream',
    reliability: 5
  },
  {
    id: 'cointelegraph',
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com',
    category: 'mainstream',
    reliability: 4
  },
  {
    id: 'theblock',
    name: 'The Block',
    url: 'https://www.theblock.co',
    category: 'mainstream',
    reliability: 5
  },
  {
    id: 'decrypt',
    name: 'Decrypt',
    url: 'https://decrypt.co',
    category: 'mainstream',
    reliability: 4
  },
  {
    id: 'bitcoin-magazine',
    name: 'Bitcoin Magazine',
    url: 'https://bitcoinmagazine.com',
    category: 'bitcoin',
    reliability: 4
  }
];

/**
 * 模拟新闻数据 (实际项目需要调用真实 API 或 RSS)
 */
function generateMockNews() {
  const headlines = [
    {
      title: '比特币突破$71,000，分析师预测将继续上涨',
      source: 'coindesk',
      category: 'price',
      tags: ['btc', 'price'],
      importance: 'high',
      sentiment: 'positive',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      url: 'https://coindesk.com/example1',
      summary: '比特币今日突破$71,000 大关，交易量显著增加...'
    },
    {
      title: '以太坊基金会宣布新路线图，重点关注可扩展性',
      source: 'cointelegraph',
      category: 'technology',
      tags: ['eth', 'technology'],
      importance: 'high',
      sentiment: 'positive',
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      url: 'https://cointelegraph.com/example2',
      summary: 'V 神发布新博客，详细介绍以太坊未来发展方向...'
    },
    {
      title: 'SEC 推迟现货以太坊 ETF 决定',
      source: 'theblock',
      category: 'regulation',
      tags: ['eth', 'regulation', 'sec', 'etf'],
      importance: 'high',
      sentiment: 'neutral',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      url: 'https://theblock.co/example3',
      summary: '美国 SEC 再次推迟 ETF 审批决定，市场反应平淡...'
    },
    {
      title: '某大型交易所报告$1 亿被盗，疑似内部作案',
      source: 'coindesk',
      category: 'security',
      tags: ['hack', 'security', 'exchange'],
      importance: 'high',
      sentiment: 'negative',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      url: 'https://coindesk.com/example4',
      summary: '交易平台确认安全漏洞，已暂停提现进行调查...'
    },
    {
      title: 'Solana DeFi TVL 突破$50 亿，创历史新高',
      source: 'decrypt',
      category: 'defi',
      tags: ['sol', 'defi', 'tvl'],
      importance: 'medium',
      sentiment: 'positive',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      url: 'https://decrypt.co/example5',
      summary: 'Solana 生态系统持续增长，多个协议表现亮眼...'
    },
    {
      title: 'Aave 通过新提案，将支持更多现实世界资产',
      source: 'theblock',
      category: 'defi',
      tags: ['defi', 'aave', 'rwa'],
      importance: 'medium',
      sentiment: 'positive',
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      url: 'https://theblock.co/example6',
      summary: '社区投票通过，Aave 将逐步接入国债等 RWA 资产...'
    },
    {
      title: '币安宣布新币上线，XX 代币上涨 50%',
      source: 'cointelegraph',
      category: 'exchange',
      tags: ['binance', 'listing'],
      importance: 'low',
      sentiment: 'positive',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      url: 'https://cointelegraph.com/example7',
      summary: '币安第 XXX 次新币上线，市场反应热烈...'
    },
    {
      title: 'Bitcoin Magazine: 机构采用率持续上升',
      source: 'bitcoin-magazine',
      category: 'adoption',
      tags: ['btc', 'adoption', 'institutional'],
      importance: 'medium',
      sentiment: 'positive',
      publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
      url: 'https://bitcoinmagazine.com/example8',
      summary: '最新调查显示，超过 30% 的机构投资者已持有比特币...'
    }
  ];

  return headlines;
}

/**
 * 加载缓存
 */
async function loadCache() {
  try {
    if (!existsSync(CACHE_FILE)) {
      return { news: [], lastUpdate: null };
    }
    const data = await readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('⚠️  加载缓存失败');
    return { news: [], lastUpdate: null };
  }
}

/**
 * 保存缓存
 */
async function saveCache(data) {
  try {
    const dir = dirname(CACHE_FILE);
    if (!existsSync(dir)) {
      await writeFile(dir, '', 'utf-8');
    }
    await writeFile(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('❌ 保存缓存失败:', error.message);
    return false;
  }
}

/**
 * 获取新闻 (带缓存)
 */
async function fetchNews(options = {}) {
  const { forceRefresh = false, tag, importance, sentiment, limit = 10 } = options;
  
  const cache = await loadCache();
  const now = Date.now();
  const cacheAge = cache.lastUpdate ? now - new Date(cache.lastUpdate).getTime() : Infinity;
  
  // 使用缓存（5 分钟内）
  if (!forceRefresh && cacheAge < 5 * 60 * 1000 && cache.news.length > 0) {
    console.log('📰 使用缓存数据 (更新于 ' + new Date(cache.lastUpdate).toLocaleTimeString('zh-CN') + ')\n');
    return filterNews(cache.news, options);
  }

  console.log('📰 获取最新新闻...\n');
  
  // 生成模拟新闻
  const news = generateMockNews();
  
  // 保存缓存
  await saveCache({
    news,
    lastUpdate: new Date().toISOString()
  });

  return filterNews(news, options);
}

/**
 * 筛选新闻
 */
function filterNews(news, options = {}) {
  let filtered = news;

  if (options.tag) {
    const tag = options.tag.toLowerCase();
    filtered = filtered.filter(n => n.tags.some(t => t.toLowerCase().includes(tag)));
  }

  if (options.importance) {
    filtered = filtered.filter(n => n.importance === options.importance);
  }

  if (options.sentiment) {
    filtered = filtered.filter(n => n.sentiment === options.sentiment);
  }

  if (options.category) {
    filtered = filtered.filter(n => n.category === options.category);
  }

  return filtered.slice(0, options.limit || 10);
}

/**
 * 打印新闻列表
 */
function printNews(news) {
  if (news.length === 0) {
    console.log('📰 没有找到符合条件的新闻\n');
    return;
  }

  console.log('📰 NewsPulse - 加密货币新闻\n');
  console.log('─'.repeat(110));
  console.log(
    '时间'.padEnd(10) +
    '重要性'.padEnd(10) +
    '情绪'.padEnd(10) +
    '标题'.padEnd(50) +
    '来源'
  );
  console.log('─'.repeat(110));

  news.forEach(item => {
    const time = formatTime(item.publishedAt);
    const importance = getImportanceIcon(item.importance);
    const sentiment = getSentimentIcon(item.sentiment);
    const title = item.title.length > 48 ? item.title.slice(0, 47) + '...' : item.title;
    const source = getSourceName(item.source);

    console.log(
      `${time.padEnd(10)} ` +
      `${importance.padEnd(10)} ` +
      `${sentiment.padEnd(10)} ` +
      `${title.padEnd(50)} ` +
      `${source}`
    );
  });

  console.log('─'.repeat(110));
  console.log(`\n总计：${news.length} 条新闻\n`);

  console.log('💡 筛选选项:');
  console.log('   --tag btc|eth|defi        按标签筛选');
  console.log('   --importance high|low     按重要性筛选');
  console.log('   --sentiment positive|negative 按情绪筛选');
  console.log('   --limit 20                限制显示数量');
  console.log('   --refresh                 强制刷新缓存');
  console.log('');
}

/**
 * 格式化时间
 */
function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  }
}

/**
 * 获取重要性图标
 */
function getImportanceIcon(importance) {
  switch (importance) {
    case 'high': return '🔴 重大';
    case 'medium': return '🟡 一般';
    case 'low': return '🟢 轻微';
    default: return '⚪';
  }
}

/**
 * 获取情绪图标
 */
function getSentimentIcon(sentiment) {
  switch (sentiment) {
    case 'positive': return '🟢 正面';
    case 'neutral': return '🟡 中性';
    case 'negative': return '🔴 负面';
    default: return '⚪';
  }
}

/**
 * 获取来源名称
 */
function getSourceName(sourceId) {
  const source = NEWS_SOURCES.find(s => s.id === sourceId);
  return source ? source.name : sourceId;
}

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      options[key] = value;
      i++;
    }
  }
  return options;
}

/**
 * 显示帮助
 */
function showHelp() {
  console.log(`
📰 NewsPulse - 新闻聚合

用法:
  node scripts/aggregate.mjs [选项]

选项:
  --tag <标签>              按标签筛选 (btc/eth/defi/regulation/hack)
  --importance <级别>        按重要性筛选 (high/medium/low)
  --sentiment <情绪>         按情绪筛选 (positive/neutral/negative)
  --category <分类>          按分类筛选 (price/technology/defi/security)
  --limit <数量>             限制显示数量 (默认 10)
  --refresh                 强制刷新缓存
  --help                    显示帮助

示例:
  # 查看所有新闻
  node scripts/aggregate.mjs

  # 只看比特币新闻
  node scripts/aggregate.mjs --tag btc

  # 只看重大负面新闻
  node scripts/aggregate.mjs --importance high --sentiment negative

  # 强制刷新
  node scripts/aggregate.mjs --refresh

相关命令:
  news.mjs    快速查看 (旧版)
  sentiment.mjs 情绪分析
  summary.mjs 新闻摘要
`);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const options = parseArgs(args);
  
  if (options.refresh) {
    options.forceRefresh = true;
  }

  const news = await fetchNews(options);
  printNews(news);
}

main().catch(console.error);
