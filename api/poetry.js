const KEY = process.env.DEEPSEEK_KEY || 'sk-9fbfac460067441e8c58f68c88f4d0f9';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { keyword, typeFilter } = req.body;
  const f = typeFilter && typeFilter !== 'all' ? `只搜${typeFilter}` : '搜诗词名言歌词';
  const p = `搜索"${keyword}"。${f}。3-5条。格式：【类型】「内容」——作者《出处》。`;
  try {
    const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: p }], max_tokens: 300 })
    });
    const d = await r.json();
    const lines = d.choices[0].message.content.trim().split('\n').filter(l => l.trim());
    const items = lines.map(l => { const m = l.match(/【(.+?)】[「「](.+?)[」」]\s*[——\-]\s*(.+)/); return m ? { type: m[1], text: m[2], author: m[3] } : null; }).filter(Boolean);
    res.json({ success: true, items });
  } catch (e) { res.json({ success: false, error: e.message }); }
}
