const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || 'sk-9fbfac460067441e8c58f68c88f4d0f9';
const MODEL = 'deepseek-chat';

async function callAI(messages, maxTokens = 300) {
  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + DEEPSEEK_KEY },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature: 0.9 })
  });
  const data = await resp.json();
  return data.choices[0].message.content.trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { keyword, platform, style, lengthType } = req.body;
  if (!keyword) return res.json({ success: false, error: '请输入关键词' });

  const pname = { pyq: '微信朋友圈', xhs: '小红书', dy: '抖音' }[platform] || '朋友圈';
  const lenRule = { 'ultra': '5-10个字', 'short': '10-20个字', 'medium': '30-50个字', 'long': '60-100个字' }[lengthType] || '50字';
  const styleRule = { '幽默': '意外反转、自嘲或荒诞对比', '文艺': '画面感和留白营造诗意', '沙雕': '夸张比喻和离谱逻辑', '励志': '有力量感，真诚不打鸡血', '种草': '朋友间的真诚推荐', '情感': '温柔有穿透力，克制不煽情' }[style] || '自然';

  const prompt = `你是顶尖文案创作者。主题："${keyword}"。${pname}。字数${lenRule}。风格：${styleRule}。不出现"${keyword}"。直接输出。`;
  try {
    const text = await callAI([{ role: 'user', content: prompt }], 300);
    res.json({ success: true, text });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
}
