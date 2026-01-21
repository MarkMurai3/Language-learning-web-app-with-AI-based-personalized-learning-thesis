async function generateLlamaReply(messages) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_LLAMA_MODEL || "llama3";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false, // easier to handle
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Ollama chat request failed");
  }

  // Ollama returns: { message: { role, content }, ... }
  return (data?.message?.content || "").trim();
}

module.exports = { generateLlamaReply };
