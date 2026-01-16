const jwt = require("jsonwebtoken");
const { registerUser, verifyUser } = require("../services/auth.service");

function requireFields(body, fields) {
  for (const f of fields) {
    if (!body[f] || String(body[f]).trim() === "") return f;
  }
  return null;
}

async function register(req, res) {
  try {
    // Required fields for registration
    const missing = requireFields(req.body, ["email", "password", "username", "nativeLanguage", "targetLanguage", "targetLevel"]);
    if (missing) return res.status(400).json({ error: `Missing field: ${missing}` });

    const { email, password, username, nativeLanguage, targetLanguage, targetLevel } = req.body;

    const user = await registerUser({
      email,
      password,
      username,
      nativeLanguage,
      targetLanguage,
      targetLevel,
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === "USER_EXISTS") {
      return res.status(409).json({ error: "User already exists" });
    }
    return res.status(500).json({ error: "Server error" });
  }
}

async function login(req, res) {
  try {
    const missing = requireFields(req.body, ["email", "password"]);
    if (missing) return res.status(400).json({ error: `Missing field: ${missing}` });

    const { email, password } = req.body;
    const user = await verifyUser(email, password);

    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ user, token });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { register, login };
