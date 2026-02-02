const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function translateToTarget({ text, targetLanguage }) {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const prompt = `
Translate the user's search query into ${targetLanguage}.
Rules:
- Output ONLY the translated query, nothing else.
- Keep slang and internet style if present.
- Do not add quotes.
- Do not explain.
Query: ${text}
`.trim();

  const resp = await client.responses.create({
    model,
    input: prompt,
  });

  return (resp.output_text || "").trim();
}

module.exports = { translateToTarget };
