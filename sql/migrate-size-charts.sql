-- Size Charts Migration
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Size Charts Table (for global size chart)
CREATE TABLE IF NOT EXISTS size_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Global Size Chart',
  image_url TEXT NOT NULL,
  cloudinary_public_id TEXT,
  is_global BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add size chart fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS use_global_size_chart BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS size_chart_image_url TEXT,
ADD COLUMN IF NOT EXISTS size_chart_cloudinary_public_id TEXT;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_size_charts_is_global ON size_charts(is_global);
CREATE INDEX IF NOT EXISTS idx_size_charts_is_active ON size_charts(is_active);

-- 4. Enable RLS
ALTER TABLE size_charts ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Public can read active size charts
DROP POLICY IF EXISTS "Public can read active size charts" ON size_charts;
CREATE POLICY "Public can read active size charts"
  ON size_charts
  FOR SELECT
  USING (is_active = true);

-- Admins can manage size charts
DROP POLICY IF EXISTS "Admins can manage size charts" ON size_charts;
CREATE POLICY "Admins can manage size charts"
  ON size_charts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- 6. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_size_charts_updated_at ON size_charts;
CREATE TRIGGER update_size_charts_updated_at
  BEFORE UPDATE ON size_charts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Insert default global size chart (using the existing Default_SizeChart.jpg from public folder)
-- Note: You'll need to upload this to Cloudinary first and update the URL
INSERT INTO size_charts (id, name, image_url, is_global, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Global Size Chart',
  '/Default_SizeChart.jpg',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;