-- USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  target_language TEXT NOT NULL DEFAULT 'English',
  role TEXT NOT NULL DEFAULT 'user',
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INTERESTS: store catalog items + custom interests
CREATE TABLE IF NOT EXISTS interests (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,         -- e.g. "Movies:Comedy" or "custom:football"
  label TEXT NOT NULL,              -- display label
  parent_key TEXT NULL,             -- e.g. "Movies"
  is_custom BOOLEAN NOT NULL DEFAULT FALSE
);

-- USER INTERESTS (weights)
CREATE TABLE IF NOT EXISTS user_interests (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_key TEXT NOT NULL,
  weight INT NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, interest_key)
);

-- USER PREFS
CREATE TABLE IF NOT EXISTS user_prefs (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avoid_learning_content BOOLEAN NOT NULL DEFAULT FALSE
);

-- FEEDBACK (like/dislike)
CREATE TABLE IF NOT EXISTS feedback (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  value TEXT NOT NULL CHECK (value IN ('like','dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

-- HISTORY
CREATE TABLE IF NOT EXISTS history (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  channel TEXT,
  language TEXT,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ADMIN: blocked videos (global)
CREATE TABLE IF NOT EXISTS blocked_videos (
  video_id TEXT PRIMARY KEY,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ADMIN: seed channels per language (global)
CREATE TABLE IF NOT EXISTS seed_channels (
  id SERIAL PRIMARY KEY,
  language TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(language, channel_id)
);

-- ROLEPLAY SCENARIOS (optional now, great later)
CREATE TABLE IF NOT EXISTS roleplay_scenarios (
  id SERIAL PRIMARY KEY,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
