-- backend/migrations/002_seed_interests.sql
-- Improved, language-immersion-friendly interest catalog
-- Safe to re-run (uses ON CONFLICT DO NOTHING)

-- =========================
-- Base categories
-- =========================
INSERT INTO interests (key, label, parent_key, is_custom) VALUES
('Entertainment', 'Entertainment', NULL, false),
('Music', 'Music', NULL, false),
('Gaming', 'Gaming', NULL, false),
('Culture', 'Culture & Society', NULL, false),
('Podcasts', 'Podcasts & Long Talks', NULL, false),
('Food', 'Food & Lifestyle', NULL, false),
('Travel', 'Travel', NULL, false),
('Relationships', 'Relationships & Social Life', NULL, false),
('Self-development', 'Self-development', NULL, false)
ON CONFLICT (key) DO NOTHING;

-- =========================
-- Sub-interests
-- =========================
INSERT INTO interests (key, label, parent_key, is_custom) VALUES
-- Entertainment
('Entertainment:Series', 'Series / TV Shows', 'Entertainment', false),
('Entertainment:Movies', 'Movies', 'Entertainment', false),
('Entertainment:Anime', 'Anime', 'Entertainment', false),
('Entertainment:Reality shows', 'Reality shows', 'Entertainment', false),
('Entertainment:Drama clips', 'Drama clips', 'Entertainment', false),
('Entertainment:Interviews', 'Celebrity interviews', 'Entertainment', false),
('Entertainment:Late night', 'Late night shows', 'Entertainment', false),
('Entertainment:Stand-up', 'Stand-up comedy', 'Entertainment', false),
('Entertainment:Sketches', 'Comedy sketches', 'Entertainment', false),

-- Music
('Music:Pop', 'Pop', 'Music', false),
('Music:Rap', 'Rap / Hip-hop', 'Music', false),
('Music:Rock', 'Rock', 'Music', false),
('Music:Electronic', 'Electronic', 'Music', false),
('Music:Indie', 'Indie', 'Music', false),
('Music:Live', 'Live performances', 'Music', false),

-- Gaming
('Gaming:Story games', 'Story-based games', 'Gaming', false),
('Gaming:Walkthroughs', 'Walkthroughs', 'Gaming', false),
('Gaming:Streams', 'Live streams', 'Gaming', false),
('Gaming:FPS', 'FPS', 'Gaming', false),
('Gaming:RPG', 'RPG', 'Gaming', false),
('Gaming:Minecraft', 'Minecraft', 'Gaming', false),
('Gaming:Esports', 'Esports', 'Gaming', false),

-- Culture & Society
('Culture:Street interviews', 'Street interviews', 'Culture', false),
('Culture:Daily life', 'Daily life vlogs', 'Culture', false),
('Culture:Traditions', 'Traditions & culture', 'Culture', false),
('Culture:History', 'History', 'Culture', false),
('Culture:Documentaries', 'Documentaries', 'Culture', false),
('Culture:News commentary', 'News commentary', 'Culture', false),
('Culture:Social topics', 'Social topics', 'Culture', false),

-- Podcasts & Long Talks
('Podcasts:General', 'General podcasts', 'Podcasts', false),
('Podcasts:Interviews', 'Interview podcasts', 'Podcasts', false),
('Podcasts:Debates', 'Debates', 'Podcasts', false),
('Podcasts:Storytelling', 'Storytelling', 'Podcasts', false),

-- Food & Lifestyle
('Food:Food reviews', 'Food reviews', 'Food', false),
('Food:Street food', 'Street food', 'Food', false),
('Food:Restaurant vlogs', 'Restaurant vlogs', 'Food', false),
('Food:Cooking shows', 'Cooking shows', 'Food', false),

-- Travel
('Travel:City trips', 'City trips', 'Travel', false),
('Travel:Nature', 'Nature', 'Travel', false),
('Travel:Food travel', 'Food travel', 'Travel', false),
('Travel:Budget travel', 'Budget travel', 'Travel', false),
('Travel:Relocation', 'Living abroad / relocation', 'Travel', false),

-- Relationships & Social Life
('Relationships:Dating', 'Dating', 'Relationships', false),
('Relationships:Friendship', 'Friendship', 'Relationships', false),
('Relationships:Family', 'Family', 'Relationships', false),
('Relationships:Advice', 'Advice', 'Relationships', false),

-- Self-development
('Self-development:Motivation', 'Motivation', 'Self-development', false),
('Self-development:Psychology', 'Psychology', 'Self-development', false),
('Self-development:Productivity', 'Productivity', 'Self-development', false),
('Self-development:Philosophy', 'Philosophy', 'Self-development', false)

ON CONFLICT (key) DO NOTHING;