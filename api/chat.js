export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.OPENROUTER_KEY;
  if (!key) return res.status(500).json({ error: 'OPENROUTER_KEY missing' });

  const systemPrompt = `أنت مولد ألعاب "خارج الموضوع" بالعربية. أنشئ JSON فقط بدون أي نص إضافي.

المطلوب:
1. موضوع غريب وممتع (مثلاً: "حفلة عيد ميلاد قطة في الفضاء", "سرقة الكعكة من المريخ")
2. 4 مجموعات تفاصيل:
   - 3 صحيحة (متشابهة لكن بكلمات مختلفة قليلاً)
   - 1 خاطئة (قريبة من الصحيحة لكن فيها تفصيل مختلف يكشف الجاسوس)
3. 3 تحديات متدرجة

التنسيق:
{
  "topic": "الموضوع",
  "details": [
    {"player": 1, "text": "تفصيل اللاعب 1", "isSpy": false},
    {"player": 2, "text": "تفصيل اللاعب 2", "isSpy": false},
    {"player": 3, "text": "تفصيل اللاعب 3", "isSpy": false},
    {"player": 4, "text": "تفصيل اللاعب 4", "isSpy": true}
  ],
  "challenges": [
    "تحدي 1: اختر لاعباً واسأله سؤالاً محدداً عن التفاصيل",
    "تحدي 2: اكتب جملة واحدة تصف ما يحدث بدون ذكر الكلمات المفتاحية",
    "تحدي 3: اختر من يجب أن يكشف دوره — إذا أخطأت، تفقد 20 نقطة!"
  ]
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-site.vercel.app',
        'X-Title': 'AI Game'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: 'أنشئ لعبة جديدة بالعربية'}
        ],
        temperature: 0.9,
        max_tokens: 800
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let gameData;
    try {
      gameData = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      gameData = match ? JSON.parse(match[0]) : {};
    }

    if (!gameData.details || !Array.isArray(gameData.details) || gameData.details.length !== 4) {
      gameData = {
        topic: "سرقة الكعكة من المريخ",
        details: [
          {player: 1, text: "الكعكة سرقت من مخبز المريخ الأحمر", isSpy: false},
          {player: 2, text: "المخبز المريخي فقد كعكته الليلة", isSpy: false},
          {player: 3, text: "الكعكة الحمراء اختفت من المريخ", isSpy: false},
          {player: 4, text: "الكعكة سرقت من مخبز القمر الأبيض", isSpy: true}
        ],
        challenges: [
          "اختر لاعباً واسأله: ما لون الكعكة؟",
          "اكتب جملة واحدة بدون كلمة 'مريخ'",
          "من يجب أن يكشف دوره؟"
        ]
      };
    }

    res.status(200).json(gameData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
