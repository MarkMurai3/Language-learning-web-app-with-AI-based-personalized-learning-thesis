const bcrypt = require("bcrypt");

// In-memory store (TEMP). Later replace with database.
// key: normalized email (lowercase)
const users = new Map();

let nextId = 1;

/* ================= helpers ================= */

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    targetLanguage: user.targetLanguage,
    role: user.role,
    disabled: user.disabled,
  };
}

/* ================= auth ================= */

async function registerUser({ email, password, targetLanguage }) {
  const emailNorm = normalizeEmail(email);
  const adminEmailNorm = normalizeEmail(process.env.ADMIN_EMAIL);

  console.log("[DEBUG] ADMIN_EMAIL raw:", process.env.ADMIN_EMAIL);
  console.log("[DEBUG] adminEmail normalized:", adminEmailNorm);
  console.log("[DEBUG] email normalized:", emailNorm);

  if (users.has(emailNorm)) {
    const err = new Error("User already exists");
    err.code = "USER_EXISTS";
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const role = emailNorm === adminEmailNorm ? "admin" : "user";

  const user = {
    id: nextId++,
    email: emailNorm, // store normalized
    passwordHash,
    targetLanguage: targetLanguage || "",
    role,
    disabled: false,
  };

  users.set(emailNorm, user);
  return toPublicUser(user);
}

async function verifyUser(email, password) {
  const emailNorm = normalizeEmail(email);
  const user = users.get(emailNorm);
  if (!user) return null;

  if (user.disabled) {
    throw new Error("Account disabled");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return toPublicUser(user);
}

/* ================= profile ================= */

function updateUserById(userId, patch) {
  for (const [email, user] of users.entries()) {
    if (user.id === userId) {
      const updated = { ...user, ...patch };
      users.set(email, updated);
      return toPublicUser(updated);
    }
  }
  return null;
}

function getUserById(userId) {
  for (const user of users.values()) {
    if (user.id === userId) {
      return toPublicUser(user);
    }
  }
  return null;
}

/* ================= admin ================= */

function _adminListUsers() {
  return Array.from(users.values());
}

function _adminSetUserDisabled(id, disabled) {
  for (const [email, user] of users.entries()) {
    if (user.id === id) {
      const updated = { ...user, disabled: !!disabled };
      users.set(email, updated);
      return updated;
    }
  }
  return null;
}

module.exports = {
  registerUser,
  verifyUser,
  getUserById,
  updateUserById,
  _adminListUsers,
  _adminSetUserDisabled,
};
