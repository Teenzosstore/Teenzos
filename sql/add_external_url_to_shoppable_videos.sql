-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Adds external_url for IG Reel / YouTube Short links, and makes video_url nullable
-- so a video entry can be either an uploaded file OR an external link.

ALTER TABLE shoppable_videos
  ALTER COLUMN video_url DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS external_url TEXT;

COMMENT ON COLUMN shoppable_videos.external_url IS 'Optional: Instagram Reel or YouTube Short URL shown as a tap-through on the homepage instead of an uploaded video.';
