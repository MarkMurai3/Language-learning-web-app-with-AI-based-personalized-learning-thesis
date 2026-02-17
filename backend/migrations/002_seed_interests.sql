-- Base categories
INSERT INTO interests (key, label, parent_key, is_custom) VALUES
('Movies', 'Movies', NULL, false),
('Music', 'Music', NULL, false),
('Gaming', 'Gaming', NULL, false),
('Travel', 'Travel', NULL, false),
('Fitness', 'Fitness', NULL, false),
('Cooking', 'Cooking', NULL, false),
('Technology', 'Technology', NULL, false)
ON CONFLICT (key) DO NOTHING;

-- Sub-interests
INSERT INTO interests (key, label, parent_key, is_custom) VALUES
('Movies:Comedy', 'Comedy', 'Movies', false),
('Movies:Drama', 'Drama', 'Movies', false),
('Movies:Action', 'Action', 'Movies', false),
('Movies:Horror', 'Horror', 'Movies', false),
('Movies:Sci-Fi', 'Sci-Fi', 'Movies', false),
('Movies:Anime', 'Anime', 'Movies', false),
('Movies:Documentary', 'Documentary', 'Movies', false),

('Music:Pop', 'Pop', 'Music', false),
('Music:Rock', 'Rock', 'Music', false),
('Music:Hip-hop', 'Hip-hop', 'Music', false),
('Music:Electronic', 'Electronic', 'Music', false),
('Music:Jazz', 'Jazz', 'Music', false),
('Music:Classical', 'Classical', 'Music', false),

('Gaming:FPS', 'FPS', 'Gaming', false),
('Gaming:RPG', 'RPG', 'Gaming', false),
('Gaming:Strategy', 'Strategy', 'Gaming', false),
('Gaming:Minecraft', 'Minecraft', 'Gaming', false),
('Gaming:Esports', 'Esports', 'Gaming', false),
('Gaming:Indie', 'Indie', 'Gaming', false),

('Travel:City trips', 'City trips', 'Travel', false),
('Travel:Nature', 'Nature', 'Travel', false),
('Travel:Food travel', 'Food travel', 'Travel', false),
('Travel:Budget travel', 'Budget travel', 'Travel', false),

('Fitness:Gym', 'Gym', 'Fitness', false),
('Fitness:Running', 'Running', 'Fitness', false),
('Fitness:Calisthenics', 'Calisthenics', 'Fitness', false),
('Fitness:Yoga', 'Yoga', 'Fitness', false),
('Fitness:Nutrition', 'Nutrition', 'Fitness', false),

('Cooking:Easy recipes', 'Easy recipes', 'Cooking', false),
('Cooking:Baking', 'Baking', 'Cooking', false),
('Cooking:Healthy', 'Healthy', 'Cooking', false),
('Cooking:Street food', 'Street food', 'Cooking', false),

('Technology:Programming', 'Programming', 'Technology', false),
('Technology:AI', 'AI', 'Technology', false),
('Technology:Gadgets', 'Gadgets', 'Technology', false),
('Technology:Cybersecurity', 'Cybersecurity', 'Technology', false),
('Technology:Web dev', 'Web dev', 'Technology', false)
ON CONFLICT (key) DO NOTHING;
