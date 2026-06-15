// api/refine.js — Função serverless da Vercel (Google Gemini · tier GRATUITO)
// Recebe { title, category, desc } e devolve { text } com a descrição refinada pela IA.
// Requer a variável de ambiente GEMINI_API_KEY (pegue grátis em https://aistudio.google.com/apikey).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "missing_api_key" });
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const title = (body.title || "").toString().slice(0, 120);
    const category = (body.category || "").toString().slice(0, 60);
    const desc = (body.desc || "").toString().slice(0, 500);

    if (desc.trim().length < 4) {
      res.status(400).json({ error: "too_short" });
      return;
    }

    const prompt =
      "Você é um editor especialista em design. Reescreva a descrição de uma tendência " +
      "de design de forma clara, concisa e inspiradora, em português do Brasil. No máximo " +
      "2 frases curtas, até 175 caracteres no total. Não use aspas, emojis nem títulos. " +
      "Mantenha o sentido da ideia original.\n\n" +
      `Título: ${title || "(sem título)"}\n` +
      `Categoria: ${category || "(sem categoria)"}\n` +
      `Ideia básica do autor: ${desc}\n\n` +
      "Responda apenas com a descrição melhorada, sem comentários.";

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      res.status(502).json({ error: "ai_error", detail: detail.slice(0, 300) });
      return;
    }

    const data = await r.json();
    const text =
      (data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text) ||
      "";
    res.status(200).json({ text: text.trim() });
  } catch (e) {
    res.status(500).json({ error: "failed", detail: String(e).slice(0, 200) });
  }
}
