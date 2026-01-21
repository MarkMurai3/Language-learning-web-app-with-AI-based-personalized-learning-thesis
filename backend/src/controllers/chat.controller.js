const { generateChatReply } = require("../services/chat/chat.service");

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return "messages must be a non-empty array";
  for (const m of messages) {
    if (!m?.role || !m?.content) return "each message needs role and content";
  }
  return null;
}

async function chat(req, res) {
  try {
    const { provider = "openai", messages } = req.body;
    const err = validateMessages(messages);
    if (err) return res.status(400).json({ error: err });

    const reply = await generateChatReply({ provider, messages });
    return res.json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Chat failed" });
  }
}

module.exports = { chat };
