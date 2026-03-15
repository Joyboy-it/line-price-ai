-- Create announcement_reads table to track which announcements users have read
CREATE TABLE IF NOT EXISTS announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_read_at ON announcement_reads(read_at DESC);
