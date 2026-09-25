-- Run this in the Supabase SQL Editor (dashboard -> SQL Editor -> New query).
-- Adds the position column used by the hero-slides admin page (left/right areas).

ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'right';

-- Keep existing slides on the right side
UPDATE hero_slides SET position = 'right' WHERE position IS NULL;