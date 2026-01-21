async function generatePhi2Reply(messages) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_PHI_MODEL || "phi";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Ollama chat request failed");
  }

  // Ollama returns { message: { role, content }, ... }
  const text = data?.message?.content || "";
  return text.trim();
}

module.exports = { generatePhi2Reply };
