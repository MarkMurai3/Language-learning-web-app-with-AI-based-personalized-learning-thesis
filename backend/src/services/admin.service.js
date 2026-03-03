const { pool } = require("../db");

/* ---------------- BLOCKED VIDEOS ---------------- */

async function listBlockedVideos({ userId } = {}) {
  if (userId) {
    const res = await pool.query(
      `SELECT video_id AS "videoId", reason, created_at AS "createdAt"
       FROM user_blocked_videos
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  const res = await pool.query(
    `SELECT video_id AS "videoId", reason, created_at AS "createdAt"
     FROM blocked_videos
     ORDER BY created_at DESC`
  );
  return res.rows;
}

async function addBlockedVideo({ videoId, reason, userId }) {
  const id = String(videoId || "").trim();
  if (!id) throw new Error("Missing videoId");

  if (userId) {
    await pool.query(
      `INSERT INTO user_blocked_videos (user_id, video_id, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, video_id) DO UPDATE SET reason = EXCLUDED.reason`,
      [userId, id, String(reason || "")]
    );
    return;
  }

  await pool.query(
    `INSERT INTO blocked_videos (video_id, reason)
     VALUES ($1, $2)
     ON CONFLICT (video_id) DO UPDATE SET reason = EXCLUDED.reason`,
    [id, String(reason || "")]
  );
}

async function removeBlockedVideo({ videoId, userId }) {
  const id = String(videoId || "").trim();
  if (!id) return;

  if (userId) {
    await pool.query(
      `DELETE FROM user_blocked_videos WHERE user_id = $1 AND video_id = $2`,
      [userId, id]
    );
    return;
  }

  await pool.query(`DELETE FROM blocked_videos WHERE video_id = $1`, [id]);
}

async function isBlocked({ videoId, userId }) {
  const id = String(videoId || "").trim();
  if (!id) return false;

  // global block always applies
  const g = await pool.query(
    `SELECT 1 FROM blocked_videos WHERE video_id = $1 LIMIT 1`,
    [id]
  );
  if (g.rows.length) return true;

  if (!userId) return false;

  const u = await pool.query(
    `SELECT 1 FROM user_blocked_videos WHERE user_id = $1 AND video_id = $2 LIMIT 1`,
    [userId, id]
  );
  return !!u.rows.length;
}

/* ---------------- SEED CHANNELS ---------------- */

async function listSeedChannels({ userId } = {}) {
  if (userId) {
    const res = await pool.query(
      `SELECT language, channel_id AS "channelId", label, created_at AS "createdAt"
       FROM user_seed_channels
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  const res = await pool.query(
    `SELECT language, channel_id AS "channelId", label, created_at AS "createdAt"
     FROM seed_channels
     ORDER BY created_at DESC`
  );
  return res.rows;
}

async function addSeedChannel({ language, channelId, label, userId }) {
  const lang = String(language || "").trim();
  const ch = String(channelId || "").trim();
  if (!lang) throw new Error("Missing language");
  if (!ch) throw new Error("Missing channelId");

  if (userId) {
    await pool.query(
      `INSERT INTO user_seed_channels (user_id, language, channel_id, label)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, language, channel_id) DO UPDATE SET label = EXCLUDED.label`,
      [userId, lang, ch, String(label || "")]
    );
    return;
  }

  await pool.query(
    `INSERT INTO seed_channels (language, channel_id, label)
     VALUES ($1, $2, $3)
     ON CONFLICT (language, channel_id) DO UPDATE SET label = EXCLUDED.label`,
    [lang, ch, String(label || "")]
  );
}

async function removeSeedChannel({ language, channelId, userId }) {
  const lang = String(language || "").trim();
  const ch = String(channelId || "").trim();
  if (!lang || !ch) return;

  if (userId) {
    await pool.query(
      `DELETE FROM user_seed_channels
       WHERE user_id = $1 AND language = $2 AND channel_id = $3`,
      [userId, lang, ch]
    );
    return;
  }

  await pool.query(
    `DELETE FROM seed_channels WHERE language = $1 AND channel_id = $2`,
    [lang, ch]
  );
}

async function getSeedChannelsForLanguage({ language, userId }) {
  const lang = String(language || "").trim();

  // combine global + user-specific
  const globalRes = await pool.query(
    `SELECT language, channel_id AS "channelId", label
     FROM seed_channels
     WHERE language = $1`,
    [lang]
  );

  if (!userId) return globalRes.rows;

  const userRes = await pool.query(
    `SELECT language, channel_id AS "channelId", label
     FROM user_seed_channels
     WHERE user_id = $1 AND language = $2`,
    [userId, lang]
  );

  return [...userRes.rows, ...globalRes.rows];
}

module.exports = {
  listBlockedVideos,
  addBlockedVideo,
  removeBlockedVideo,
  isBlocked,

  listSeedChannels,
  addSeedChannel,
  removeSeedChannel,
  getSeedChannelsForLanguage,
};