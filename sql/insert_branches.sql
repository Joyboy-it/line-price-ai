-- Insert sample branches
INSERT INTO branches (name, code, sort_order, is_active) VALUES
  ('Bangkok', 'BKK', 1, true),
  ('Chiang Mai', 'CNX', 2, true),
  ('Phuket', 'HKT', 3, true),
  ('Khon Kaen', 'KKC', 4, true),
  ('Songkhla', 'SGZ', 5, true)
ON CONFLICT (code) DO NOTHING;
