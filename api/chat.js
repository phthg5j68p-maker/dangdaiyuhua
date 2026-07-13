const KEY = process.env.DEEPSEEK_KEY || 'sk-9fbfac460067441e8c58f68c88f4d0f9';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const p = `你是当代余华AI助手。帮写文案、荐诗词歌词、答使用问题、日常聊天。用户："${req.body.message}"。简洁回复。`;
  try {
    const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: p }], max_tokens: 200 })
    });
    const d = await r.json();
    res.json({ success: true, text: d.choices[0].message.content.trim() });
  } catch (e) { res.json({ success: false, error: e.message }); }
}
