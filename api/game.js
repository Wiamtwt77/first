
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.OPENROUTER_KEY;
  if (!key) {
    return res.status(500).json({ error: 'OPENROUTER_KEY missing' });
  }

  const playerCount = req.body && req.body.players ? req.body.players : 4;

  const systemPrompt = `You are a game generator for "برا السالفة" (Out of Context) in Arabic.

Generate a JSON object with:
1. "topic": A funny, weird topic in Arabic
2. "fakeTopic": A topic that is CLOSE but different
3. "spyIndex": Random number from 0 to ${playerCount - 1}
4. "details": Array of ${playerCount} strings, each giving a slightly different detail about the topic. The spy's detail should subtly hint at the fakeTopic without being obvious.

Output ONLY valid JSON, no markdown, no extra text:
{
  "topic": "...",
  "fakeTopic": "...",
  "spyIndex": 0,
  "details": ["detail 1", "detail 2", ...]
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://bra-alsalfa.vercel.app',
        'X-Title': 'Bra AlSalfa'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: 'Generate a new game in Arabic for ' + playerCount + ' players'}
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

    if (!gameData || !gameData.topic || !gameData.fakeTopic) {
      const topics = [
        {t: 'سرقة الكعكة من المريخ', f: 'سرقة الكعكة من القمر', d: ['المخبز المريخي فقد كعكته', 'الكعكة الحمراء اختفت ليلاً', 'شخص غامق سرق من المريخ', 'المخبز القمري فقد كعكته']},
        {t: 'حفلة عيد ميلاد قطة في الفضاء', f: 'حفلة زفاف كلب في المحيط', d: ['القطة ترتدي خوذة فضاء', 'البالونات تطفو في الجاذبية الصغرى', 'الكعكة على شكل كوكب', 'الكلب يرتدي زي غطاس']},
        {t: 'مدرسة السحر للبطاريق', f: 'مدرسة الرقص للفيلة', d: ['البطاريق يتعلمون تعويذات الجليد', 'العصا السحرية مصنوعة من سمك', 'الفصل الدراسي في القارة القطبية', 'الفيلة يرتدون أحذية باليه']}
      ];
      const pick = topics[Math.floor(Math.random() * topics.length)];
      gameData = {
        topic: pick.t,
        fakeTopic: pick.f,
        spyIndex: Math.floor(Math.random() * playerCount),
        details: pick.d.slice(0, playerCount)
      };
    }

    while (gameData.details.length < playerCount) {
      gameData.details.push('تفاصيل إضافية عن ' + gameData.topic);
    }
    gameData.details = gameData.details.slice(0, playerCount);

    if (gameData.spyIndex < 0 || gameData.spyIndex >= playerCount) {
      gameData.spyIndex = Math.floor(Math.random() * playerCount);
    }

    res.status(200).json(gameData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
