const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || 'sk-9fbfac460067441e8c58f68c88f4d0f9';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { scene, userInput, replyStyle } = req.body;
  const sd = { 搭讪: '搭讪', 尬聊: '尬聊冷场', 被夸: '被夸奖', 约会: '约会邀请', 拒绝: '拒绝邀约', 道歉: '道歉', 职场: '职场沟通', 安慰: '安慰', 感谢: '感谢', 表白: '表白', 日常: '日常聊天' };
  const rd = { 破冰: '自然大方', 幽默: '幽默有梗', 高情商: '体贴高情商' };
  let prompt = `你在${sd[scene]||'聊天'}。`;
  if (userInput) prompt += `对方说："${userInput}"。`;
  prompt += `用${rd[replyStyle]||'自然'}语气回复。不引原话。50字内。直接回复。`;
  try {
    const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + DEEPSEEK_KEY },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 150, temperature: 0.9 })
    });
    const d = await r.json();
    res.json({ success: true, text: d.choices[0].message.content.trim() });
  } catch (e) { res.json({ success: false, error: e.message }); }
}
