-- Adds support for multiple images per size chart (e.g. back view, front view,
-- side view, measurement table) instead of a single image.
-- Run this once in the Supabase SQL editor.

-- Global / library size charts
ALTER TABLE size_charts ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
ALTER TABLE size_charts ADD COLUMN IF NOT EXISTS cloudinary_public_ids TEXT[] DEFAULT '{}';

-- Backfill: carry the existing single image into the new array column
UPDATE size_charts
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND image_url <> ''
  AND (image_urls IS NULL OR image_urls = '{}');

UPDATE size_charts
SET cloudinary_public_ids = ARRAY[cloudinary_public_id]
WHERE cloudinary_public_id IS NOT NULL
  AND cloudinary_public_id <> ''
  AND (cloudinary_public_ids IS NULL OR cloudinary_public_ids = '{}');

-- Per-product size chart override
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_chart_image_urls TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_chart_cloudinary_public_ids TEXT[] DEFAULT '{}';

UPDATE products
SET size_chart_image_urls = ARRAY[size_chart_image_url]
WHERE size_chart_image_url IS NOT NULL
  AND size_chart_image_url <> ''
  AND size_chart_image_url <> 'disabled'
  AND (size_chart_image_urls IS NULL OR size_chart_image_urls = '{}');

UPDATE products
SET size_chart_cloudinary_public_ids = ARRAY[size_chart_cloudinary_public_id]
WHERE size_chart_cloudinary_public_id IS NOT NULL
  AND size_chart_cloudinary_public_id <> ''
  AND (size_chart_cloudinary_public_ids IS NULL OR size_chart_cloudinary_public_ids = '{}');

-- Note: the old single-image columns (image_url, size_chart_image_url, etc.)
-- are kept in place for backward compatibility and are not dropped.
