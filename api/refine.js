// api/refine.js — Função serverless da Vercel
// Recebe { title, category, desc } e devolve { text } com a descrição refinada pela IA.
// Requer a variável de ambiente ANTHROPIC_API_KEY configurada na Vercel.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
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

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      res.status(502).json({ error: "ai_error", detail: detail.slice(0, 300) });
      return;
    }

    const data = await r.json();
    const text =
      (data && data.content && data.content[0] && data.content[0].text) || "";
    res.status(200).json({ text: text.trim() });
  } catch (e) {
    res.status(500).json({ error: "failed", detail: String(e).slice(0, 200) });
  }
}
