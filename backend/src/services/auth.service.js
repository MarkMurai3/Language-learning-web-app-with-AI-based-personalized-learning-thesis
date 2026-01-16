const bcrypt = require("bcrypt");

// In-memory store (TEMP). Later replace with database.
const users = new Map(); // key: email, value: user object
let nextId = 1;

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    nativeLanguage: user.nativeLanguage,
    targetLanguage: user.targetLanguage,
    targetLevel: user.targetLevel,
  };
}

async function registerUser({ email, password, username, nativeLanguage, targetLanguage, targetLevel }) {
  if (users.has(email)) {
    const err = new Error("User already exists");
    err.code = "USER_EXISTS";
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: nextId++,
    email,
    passwordHash,
    username: username || "",
    nativeLanguage: nativeLanguage || "",
    targetLanguage: targetLanguage || "",
    targetLevel: targetLevel || "",
  };

  users.set(email, user);
  return toPublicUser(user);
}

async function verifyUser(email, password) {
  const user = users.get(email);
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return toPublicUser(user);
}

// Used by profile endpoints later
function updateUserById(userId, patch) {
  // Find user in the Map (since our key is email)
  for (const [email, user] of users.entries()) {
    if (user.id === userId) {
      users.set(email, { ...user, ...patch });
      return toPublicUser(users.get(email));
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


module.exports = {
  registerUser,
  verifyUser,
  updateUserById,
  getUserById,
};
