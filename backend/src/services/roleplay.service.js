// backend/src/services/roleplay.service.js
const OpenAI = require("openai");
const { getUserById } = require("./auth.service");
const { getScenarioById, listScenarios } = require("./roleplayScenarios");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Optional: cache translations so you don't translate same scenario repeatedly
const cache = new Map(); // key: `${scenarioId}::${targetLanguage}`

async function translateScenarioToTarget({ scenario, targetLanguage }) {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const input = `
Translate the following roleplay scenario into ${targetLanguage}.
Rules:
- Return ONLY valid JSON.
- Keep meaning, keep it natural, conversational.
- Do not add extra keys.
- Do not add explanations.

JSON to translate:
${JSON.stringify(
    {
      title: scenario.title,
      description: scenario.description,
      starterUser: scenario.starterUser || "",
      systemPrompt: scenario.systemPrompt || "",
    },
    null,
    2
  )}
`.trim();

  const resp = await client.responses.create({
    model,
    input,
  });

  const text = (resp.output_text || "").trim();

  // Parse JSON safely
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    // fallback: return original if parsing fails (better than crashing)
    return {
      title: scenario.title,
      description: scenario.description,
      starterUser: scenario.starterUser || "",
      systemPrompt: scenario.systemPrompt || "",
    };
  }

  return parsed;
}

async function listRoleplayScenarios() {
  return listScenarios();
}

async function prepareRoleplayScenario({ userId, scenarioId }) {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    const err = new Error("Scenario not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const user = await getUserById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.code = "UNAUTH";
    throw err;
  }

  const targetLanguage = user.targetLanguage || "English";
  const cacheKey = `${scenarioId}::${targetLanguage}`;

  if (cache.has(cacheKey)) {
    return { scenarioId, targetLanguage, scenario: cache.get(cacheKey) };
  }

  const translated = await translateScenarioToTarget({ scenario, targetLanguage });

  // Force language in system prompt too (super important)
  const enforcedSystemPrompt = `
${translated.systemPrompt || ""}

CRITICAL LANGUAGE RULE:
- Speak ONLY in ${targetLanguage}.
- If the user writes in another language, still respond ONLY in ${targetLanguage}.
- Do not translate your output into other languages unless the user explicitly asks for translation, and even then keep the main conversation in ${targetLanguage}.
`.trim();

  const out = {
    id: scenario.id,
    title: translated.title || scenario.title,
    description: translated.description || scenario.description,
    starterUser: translated.starterUser || scenario.starterUser || "",
    systemPrompt: enforcedSystemPrompt,
  };

  cache.set(cacheKey, out);

  return { scenarioId, targetLanguage, scenario: out };
}

module.exports = { listRoleplayScenarios, prepareRoleplayScenario };