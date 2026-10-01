-- Shoppable videos: homepage video section where each video is mapped to a
-- product. Managed from Admin > Video Section. Idempotent, additive only.

CREATE TABLE IF NOT EXISTS shoppable_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  video_url TEXT NOT NULL,
  poster_url TEXT,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shoppable_videos_order ON shoppable_videos(display_order);

DROP TRIGGER IF EXISTS update_shoppable_videos_updated_at ON shoppable_videos;
CREATE TRIGGER update_shoppable_videos_updated_at BEFORE UPDATE ON shoppable_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE shoppable_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active shoppable videos" ON shoppable_videos;
CREATE POLICY "Public can view active shoppable videos" ON shoppable_videos
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage shoppable videos" ON shoppable_videos;
CREATE POLICY "Admins can manage shoppable videos" ON shoppable_videos
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
