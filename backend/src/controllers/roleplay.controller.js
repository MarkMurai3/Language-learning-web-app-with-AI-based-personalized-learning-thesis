const { listRoleplayScenarios, prepareRoleplayScenario } = require("../services/roleplay.service");

async function list(req, res) {
  const items = await listRoleplayScenarios();
  return res.json({ items });
}

async function prepare(req, res) {
  try {
    const scenarioId = String(req.params.id || "").trim();
    if (!scenarioId) return res.status(400).json({ error: "Missing scenario id" });

    const userId = req.user.userId;
    const data = await prepareRoleplayScenario({ userId, scenarioId });
    return res.json(data);
  } catch (e) {
    if (e.code === "NOT_FOUND") return res.status(404).json({ error: "Scenario not found" });
    return res.status(500).json({ error: e.message || "Failed to prepare scenario" });
  }
}

module.exports = { list, prepare };