const bcrypt = require("bcrypt");
const { pool } = require("../db");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function toPublicUser(row) {
  return {
    id: row.id,
    email: row.email,
    targetLanguage: row.target_language,
    role: row.role,
    disabled: !!row.disabled,
  };
}

async function registerUser({ email, password, targetLanguage }) {
  const emailNorm = normalizeEmail(email);
  const adminEmailNorm = normalizeEmail(process.env.ADMIN_EMAIL);

  const role = emailNorm === adminEmailNorm ? "admin" : "user";
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `
      INSERT INTO users (email, password_hash, target_language, role, disabled)
      VALUES ($1, $2, $3, $4, false)
      RETURNING id, email, target_language, role, disabled
      `,
      [emailNorm, passwordHash, targetLanguage || "English", role]
    );

    const user = toPublicUser(result.rows[0]);

    // Ensure prefs row exists
    await pool.query(
      `
      INSERT INTO user_prefs (user_id, avoid_learning_content)
      VALUES ($1, false)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [user.id]
    );

    return user;
  } catch (e) {
    // Unique violation
    if (e.code === "23505") {
      const err = new Error("User already exists");
      err.code = "USER_EXISTS";
      throw err;
    }
    throw e;
  }
}

async function verifyUser(email, password) {
  const emailNorm = normalizeEmail(email);

  const res = await pool.query(
    `
    SELECT id, email, password_hash, target_language, role, disabled
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [emailNorm]
  );

  const row = res.rows[0];
  if (!row) return null;

  if (row.disabled) {
    throw new Error("Account disabled");
  }

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;

  return toPublicUser(row);
}

async function getUserById(userId) {
  const res = await pool.query(
    `
    SELECT id, email, target_language, role, disabled
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  if (!res.rows[0]) return null;
  return toPublicUser(res.rows[0]);
}

async function updateUserById(userId, patch) {
  // Only allow known fields
  const fields = [];
  const values = [];
  let idx = 1;

  if (patch.targetLanguage !== undefined) {
    fields.push(`target_language = $${idx++}`);
    values.push(patch.targetLanguage || "English");
  }

  if (patch.disabled !== undefined) {
    fields.push(`disabled = $${idx++}`);
    values.push(!!patch.disabled);
  }

  if (patch.role !== undefined) {
    fields.push(`role = $${idx++}`);
    values.push(patch.role);
  }

  if (!fields.length) return await getUserById(userId);

  values.push(userId);

  const res = await pool.query(
    `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING id, email, target_language, role, disabled
    `,
    values
  );

  if (!res.rows[0]) return null;
  return toPublicUser(res.rows[0]);
}

/* ================= admin ================= */

async function _adminListUsers() {
  const res = await pool.query(
    `
    SELECT id, email, target_language, role, disabled
    FROM users
    ORDER BY id ASC
    `
  );
  return res.rows; // internal rows are fine; usersAdmin.service maps safe fields
}

async function _adminSetUserDisabled(id, disabled) {
  const res = await pool.query(
    `
    UPDATE users
    SET disabled = $2
    WHERE id = $1
    RETURNING id, email, target_language, role, disabled
    `,
    [id, !!disabled]
  );
  return res.rows[0] || null;
}

module.exports = {
  registerUser,
  verifyUser,
  getUserById,
  updateUserById,
  _adminListUsers,
  _adminSetUserDisabled,
};
