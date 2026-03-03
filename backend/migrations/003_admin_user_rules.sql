-- User-specific blocked videos
CREATE TABLE IF NOT EXISTS user_blocked_videos (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocked_videos_user
ON user_blocked_videos(user_id);

-- User-specific seed channels
CREATE TABLE IF NOT EXISTS user_seed_channels (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, language, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_user_seed_channels_user_lang
ON user_seed_channels(user_id, language);