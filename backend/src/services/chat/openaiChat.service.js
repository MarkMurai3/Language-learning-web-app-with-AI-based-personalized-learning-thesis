const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateOpenAIReply(messages) {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  // Convert your {role, content} into a simple format the Responses API accepts
  // and keep only roles we support.
  const input = messages
    .filter((m) => m?.role && m?.content)
    .map((m) => ({
      role: m.role,          // "system" | "user" | "assistant"
      content: String(m.content),
    }));
    

  const resp = await client.responses.create({
    model,
    input,
  });

  return (resp.output_text || "").trim();
}

module.exports = { generateOpenAIReply };
