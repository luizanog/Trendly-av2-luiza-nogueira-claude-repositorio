// api/refine.js — Função serverless da Vercel (OpenRouter · modelos GRATUITOS)
// Usa modelos "instruct" (sem raciocínio) e limpa qualquer rascunho que escape.
// Requer a variável de ambiente OPENROUTER_API_KEY (chave sk-or-...).
// Opcional: OPENROUTER_MODEL para forçar um modelo específico (entra na frente da fila).

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

  // Remove rascunho de modelos "pensadores" e deixa só a frase final.
  function cleanText(raw) {
    let t = (raw || "").toString();
    t = t.replace(/<think>[\s\S]*?<\/think>/gi, " ");   // blocos <think>...</think>
    t = t.replace(/[\s\S]*<\/think>/i, " ");            // <think> sem fechamento no início
    t = t.replace(/^\s*(okay|ok|alright|let'?s|we need|first,|the user)\b[\s\S]*?\n\n/i, ""); // preâmbulo
    t = t.replace(/^["'\s]+|["'\s]+$/g, "").trim();
    return t;
  }

  // Heurística: parece rascunho/eco da instrução em vez da resposta?
  function looksLikeReasoning(t) {
    const s = t.toLowerCase();
    return (
      s.length > 230 ||
      /\b(rewrite|rephrase|the user|brazilian portuguese|characters|sentences|constraints|let'?s tackle|we need to)\b/.test(s)
    );
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
      "Reescreva a descrição abaixo de forma clara, concisa e inspiradora, em português do Brasil. " +
      "Responda em no máximo 2 frases curtas (até 175 caracteres no total), sem aspas, sem emojis e sem títulos. " +
      "Responda SOMENTE com a descrição final, sem explicações.\n\n" +
      `Categoria: ${category || "(sem categoria)"}\n` +
      `Descrição: ${desc}`;

    // Modelos gratuitos "instruct" (não fazem raciocínio). OPENROUTER_MODEL entra na frente.
    const models = [
      process.env.OPENROUTER_MODEL,
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "mistralai/mistral-small-3.2-24b-instruct:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "google/gemma-2-9b-it:free",
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
            temperature: 0.6,
            max_tokens: 160,
            reasoning: { exclude: true },
            messages: [
              { role: "system", content: "Você é um editor de design objetivo. Responde apenas com o texto final pedido, em português do Brasil, sem explicar seu raciocínio." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!r.ok) {
          lastDetail = "(" + model + ") HTTP " + r.status + " " + (await r.text()).slice(0, 140);
          continue;
        }

        const data = await r.json();
        const choice = data && data.choices && data.choices[0] && data.choices[0].message;
        const text = cleanText(choice && choice.content);
        if (text && !looksLikeReasoning(text)) {
          res.status(200).json({ text: text });
          return;
        }
        lastDetail = "(" + model + ") sem resposta limpa";
      } catch (inner) {
        lastDetail = "(" + model + ") " + String(inner).slice(0, 120);
      }
    }

    res.status(502).json({ error: "ai_empty", detail: lastDetail.slice(0, 300) });
  } catch (e) {
    res.status(500).json({ error: "failed", detail: String(e).slice(0, 200) });
  }
}
