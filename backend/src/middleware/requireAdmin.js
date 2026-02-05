const { getUserById } = require("../services/auth.service");

function requireAdmin(req, res, next) {
  try {
    const user = getUserById(req.user.userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.disabled) return res.status(403).json({ error: "Account disabled" });
    if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = requireAdmin;
