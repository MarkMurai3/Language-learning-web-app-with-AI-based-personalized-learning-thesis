const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateOpenAIReply(messages) {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  // Responses API (recommended for new projects)
  const resp = await client.responses.create({
    model,
    input: messages.map((m) => ({
      role: m.role,
      content: [{ type: "input_text", text: m.content }],
    })),
  });

  // Extract text output
  const text = resp.output_text || "";
  return text.trim();
}

module.exports = { generateOpenAIReply };


// const OpenAI = require("openai").default;
// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// async function generateOpenAIReply({ targetLanguage, nativeLanguage, level, message }) {
//   const response = await client.responses.create({
//     model: "gpt-5-mini",
//     input: [
//       {
//         role: "system",
//         content: `
// You are a helpful language-learning tutor.
// Reply in the target language unless the user asks for an explanation in the native language.
// Correct mistakes gently and give short explanations when needed.
// Target language: ${targetLanguage}
// Native language: ${nativeLanguage}
// Level: ${level}
//         `.trim(),
//       },
//       {
//         role: "user",
//         content: message,
//       },
//     ],
//   });

//   return response.output_text || "Sorry—no reply generated.";
// }

// module.exports = { generateOpenAIReply };
