const { pool } = require("../db");

// Returns catalog as { Movies: ["Comedy", ...], ... }
async function listAvailableInterests() {
  const res = await pool.query(
    `
    SELECT key, label, parent_key
    FROM interests
    WHERE is_custom = false
    ORDER BY parent_key NULLS FIRST, label ASC
    `
  );

  const out = {};
  for (const row of res.rows) {
    if (!row.parent_key) {
      if (!out[row.key]) out[row.key] = [];
    } else {
      if (!out[row.parent_key]) out[row.parent_key] = [];
      out[row.parent_key].push(row.label);
    }
  }

  return out;
}

// Returns { interests: [{id, weight}], prefs: { avoidLearningContent } }
async function getInterestsForUser(userId) {
  const prefsRes = await pool.query(
    `SELECT avoid_learning_content FROM user_prefs WHERE user_id = $1`,
    [userId]
  );

  const avoidLearningContent = !!prefsRes.rows[0]?.avoid_learning_content;

  const interestsRes = await pool.query(
    `
    SELECT interest_key AS id, weight
    FROM user_interests
    WHERE user_id = $1
    ORDER BY interest_key ASC
    `,
    [userId]
  );

  return {
    interests: interestsRes.rows.map((r) => ({
      id: r.id,
      weight: r.weight === 2 ? 2 : 1,
    })),
    prefs: { avoidLearningContent },
  };
}

function normalizeId(id) {
  return String(id || "").trim();
}

async function ensureCustomInterestExists(key) {
  // key like "custom:something"
  const label = key.slice("custom:".length).trim();
  if (!label) return;

  await pool.query(
    `
    INSERT INTO interests (key, label, parent_key, is_custom)
    VALUES ($1, $2, NULL, true)
    ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label
    `,
    [key, label]
  );
}

async function setInterestsForUser(userId, payload) {
  const interests = Array.isArray(payload?.interests) ? payload.interests : [];
  const prefs = payload?.prefs || {};

  const cleaned = interests
    .map((x) => ({
      id: normalizeId(x?.id),
      weight: x?.weight === 2 ? 2 : 1,
    }))
    .filter((x) => x.id);

  // create any custom interests in catalog table
  for (const it of cleaned) {
    if (it.id.startsWith("custom:")) {
      await ensureCustomInterestExists(it.id);
    }
  }

  // transaction: replace user_interests + upsert prefs
  await pool.query("BEGIN");
  try {
    await pool.query(`DELETE FROM user_interests WHERE user_id = $1`, [userId]);

    for (const it of cleaned) {
      await pool.query(
        `
        INSERT INTO user_interests (user_id, interest_key, weight)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, interest_key) DO UPDATE SET weight = EXCLUDED.weight
        `,
        [userId, it.id, it.weight]
      );
    }

    await pool.query(
      `
      INSERT INTO user_prefs (user_id, avoid_learning_content)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET avoid_learning_content = EXCLUDED.avoid_learning_content
      `,
      [userId, !!prefs.avoidLearningContent]
    );

    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }

  return getInterestsForUser(userId);
}

module.exports = {
  listAvailableInterests,
  getInterestsForUser,
  setInterestsForUser,
};
