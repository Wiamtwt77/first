module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.OPENROUTER_KEY;
  if (!key) return res.status(500).json({ error: 'OPENROUTER_KEY missing' });

  const systemPrompt = `You are a game generator for "Out of Context" (خارج الموضوع) in Arabic. Output ONLY valid JSON, no markdown, no extra text.

Requirements:
1. A funny, weird topic (e.g., "A cat's birthday party in space", "Stealing a cake from Mars")
2. 4 detail sets:
   - 3 correct (similar but with slightly different wording)
   - 1 wrong (close to correct but has a different detail that reveals the spy)
3. 3 escalating challenges

Output format (Arabic text inside JSON):
{
  "topic": "الموضوع",
  "details": [
    {"player": 1, "text": "تفصيل اللاعب 1", "isSpy": false},
    {"player": 2, "text": "تفصيل اللاعب 2", "isSpy": false},
    {"player": 3, "text": "تفصيل اللاعب 3", "isSpy": false},
    {"player": 4, "text": "تفصيل اللاعب 4 (خاطئ)", "isSpy": true}
  ],
  "challenges": [
    "تحدي 1",
    "تحدي 2",
    "تحدي 3"
  ]
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://spy-game.vercel.app',
        'X-Title': 'Spy Game'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: 'Generate a new game in Arabic'}
        ],
        temperature: 0.9,
        max_tokens: 900
      })
    });

    const data = await response.json();
    const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '{}';

    let gameData;
    try {
      gameData = JSON.parse(content);
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      gameData = match ? JSON.parse(match[0]) : null;
    }

    if (!gameData || !gameData.details || !Array.isArray(gameData.details) || gameData.details.length !== 4) {
      gameData = {
        topic: "سرقة الكعكة من المريخ",
        details: [
          {player: 1, text: "الكعكة سرقت من مخبز المريخ الأحمر في الليل", isSpy: false},
          {player: 2, text: "المخبز المريخي فقد كعكته الحمراء ليلاً", isSpy: false},
          {player: 3, text: "الكعكة الحمراء اختفت من مخبز المريخ", isSpy: false},
          {player: 4, text: "الكعكة سرقت من مخبز القمر الأبيض في الصباح", isSpy: true}
        ],
        challenges: [
          "اختر لاعباً واسأله: ما لون الكعكة؟",
          "اكتب جملة واحدة تصف الموقف بدون كلمة 'مريخ'",
          "من يجب أن يكشف دوره؟ إذا أخطأت تخسر 20 نقطة!"
        ]
      };
    }

    res.status(200).json(gameData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
