// api/refine.js — Função serverless da Vercel (OpenRouter · modelos GRATUITOS)
// Tenta uma lista de modelos gratuitos e usa o primeiro que responder com texto.
// Requer a variável de ambiente OPENROUTER_API_KEY (chave sk-or-...).
// Opcional: OPENROUTER_MODEL para forçar um modelo específico (vira o primeiro da fila).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY;
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

    // Fila de modelos gratuitos (instruct, sem "raciocínio" que volta vazio).
    // O OPENROUTER_MODEL, se definido, entra na frente.
    const models = [
      process.env.OPENROUTER_MODEL,
      "meta-llama/llama-3.3-70b-instruct:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "google/gemma-2-9b-it:free",
      "mistralai/mistral-nemo:free",
      "openrouter/free",
    ].filter(Boolean);

    let lastDetail = "";
    for (const model of models) {
      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: "Bearer " + apiKey,
            "X-Title": "Trendly",
          },
          body: JSON.stringify({
            model,
            temperature: 0.7,
            max_tokens: 220,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!r.ok) {
          lastDetail = "(" + model + ") HTTP " + r.status + " " + (await r.text()).slice(0, 160);
          continue; // tenta o próximo modelo
        }

        const data = await r.json();
        const choice = data && data.choices && data.choices[0] && data.choices[0].message;
        // Usa SÓ a resposta final (content). Ignora "reasoning" (rascunho do modelo).
        const text = ((choice && choice.content) || "").trim();
        if (text) {
          res.status(200).json({ text: text });
          return;
        }
        lastDetail = "(" + model + ") resposta vazia";
      } catch (inner) {
        lastDetail = "(" + model + ") " + String(inner).slice(0, 120);
      }
    }

    res.status(502).json({ error: "ai_empty", detail: lastDetail.slice(0, 300) });
  } catch (e) {
    res.status(500).json({ error: "failed", detail: String(e).slice(0, 200) });
  }
}
