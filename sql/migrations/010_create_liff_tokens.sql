-- One-time tokens for LIFF login flow
-- Token ใช้ได้ครั้งเดียว หมดอายุใน 5 นาที
CREATE TABLE IF NOT EXISTS liff_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_liff_tokens_token ON liff_tokens(token);
CREATE INDEX idx_liff_tokens_expires ON liff_tokens(expires_at);
