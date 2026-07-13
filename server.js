/**
 * 当代余华 — 后台代理服务
 * 代理 DeepSeek API 请求，保护 API Key 不暴露给前端
 * 启动：node server.js  端口：3000
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ===== 配置你的 API Key（只存在服务器上，用户看不到）=====
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || 'sk-9fbfac460067441e8c58f68c88f4d0f9';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

// ===== AI 代理（前端所有AI请求都走这里）=====
async function callDeepSeek(messages, maxTokens = 300, temperature = 0.9) {
  const resp = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`DeepSeek API error ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data.choices[0].message.content.trim();
}

// ===== 代理接口 =====

// 文案生成
app.post('/api/copywriting', async (req, res) => {
  try {
    const { keyword, platform, style, lengthType } = req.body;
    if (!keyword) return res.json({ success: false, error: '请输入关键词' });
    
    const pname = { pyq: '微信朋友圈', xhs: '小红书', dy: '抖音' }[platform] || '朋友圈';
    const lenRule = {
      'ultra': '5-10个字，像一句金句或诗',
      'short': '10-20个字，一个短句',
      'medium': '30-50个字，一小段完整的话',
      'long': '60-100个字，有层次有细节的段落'
    }[lengthType] || '50字左右';
    const styleRule = {
      '幽默': '用意外反转、自嘲或荒诞对比制造笑点',
      '文艺': '用画面感和留白营造诗意',
      '沙雕': '用夸张的比喻和离谱的逻辑，放飞自我',
      '励志': '有力量感和信念，真诚不打鸡血',
      '种草': '像朋友间的真诚推荐',
      '情感': '温柔但有穿透力，克制不煽情'
    }[style] || '自然流畅';

    const prompt = `你是顶尖文案创作者。主题："${keyword}"。请创作一条${pname}文案。
硬性要求：1.字数严格控制在${lenRule} 2.风格：${styleRule} 3.不要出现"${keyword}"这个词——用意象和场景表达 4.创意第一，不要套用常见句式${platform==='xhs'?' 5.末尾加2-3个#标签':''}。直接输出文案。`;
    
    const result = await callDeepSeek([{ role: 'user', content: prompt }], 300);
    res.json({ success: true, text: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 破冰回复
app.post('/api/reply', async (req, res) => {
  try {
    const { scene, userInput, replyStyle } = req.body;
    const sceneDesc = { 搭讪: '初次见面搭讪', 尬聊: '聊天冷场了', 被夸: '对方夸了我', 约会: '被邀请约会', 拒绝: '拒绝邀约', 道歉: '做错事道歉', 职场: '工作沟通', 安慰: '安慰朋友', 感谢: '表达感谢', 表白: '喜欢的人表白', 日常: '日常闲聊' };
    const styleDesc = { 破冰: '自然大方', 幽默: '轻松幽默有梗', 高情商: '体贴周到情商高' };
    
    let prompt = `你在${sceneDesc[scene] || '聊天'}。`;
    if (userInput) prompt += `对方说："${userInput}"。`;
    prompt += `请用${styleDesc[replyStyle] || '自然'}的语气回复。要求：不引用对方原话、不套模板、有创意、50字以内。直接给回复。`;
    
    const result = await callDeepSeek([{ role: 'user', content: prompt }], 150);
    res.json({ success: true, text: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// AI聊天
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const prompt = `你是"当代余华"的全能AI助手。能力：写文案（朋友圈/小红书/抖音）、推荐古诗词/歌词、回答网站使用问题、日常聊天。用户说："${message}"。请自然简洁回复。`;
    const result = await callDeepSeek([{ role: 'user', content: prompt }], 200);
    res.json({ success: true, text: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 诗词歌词搜索
app.post('/api/poetry', async (req, res) => {
  try {
    const { keyword, typeFilter } = req.body;
    const filter = typeFilter && typeFilter !== 'all' ? `只搜索【${typeFilter}】类型` : '搜索古诗词、现代诗、名言、歌词各类型';
    const prompt = `搜索关键词"${keyword}"。${filter}。找出3-5条最相关的结果。每条一行，格式：【类型】「内容」—— 作者《出处》。类型只能是古诗词、现代诗、名言、歌词。`;
    const result = await callDeepSeek([{ role: 'user', content: prompt }], 300);
    
    // 解析
    const lines = result.split('\n').filter(l => l.trim());
    const items = lines.map(line => {
      const m = line.match(/【(.+?)】[「「](.+?)[」」]\s*[——\-]\s*(.+)/);
      return m ? { type: m[1], text: m[2], author: m[3] } : null;
    }).filter(Boolean);
    
    res.json({ success: true, items });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ===== 启动 =====
app.listen(3000, () => {
  console.log(`
╔══════════════════════════════════════╗
║   ✒️ 当代余华 API 代理已启动         ║
║   http://localhost:3000              ║
║                                      ║
║   📋 接口:                           ║
║   POST /api/copywriting  - 文案生成   ║
║   POST /api/reply        - 破冰回复   ║
║   POST /api/chat         - AI聊天     ║
║   POST /api/poetry       - 诗词搜索   ║
║   GET  /api/health       - 健康检查   ║
╚══════════════════════════════════════╝
  `);
});
