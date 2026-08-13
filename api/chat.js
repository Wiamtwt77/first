export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://your-site.vercel.app',
      'X-Title': 'AI بسيط'
    },
    body: JSON.stringify(req.body)
  });
  const d = await r.json();
  res.status(200).json(d);
}
