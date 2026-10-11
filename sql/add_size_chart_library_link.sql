-- Lets a product pick a NAMED size chart from the library (size_charts table)
-- instead of only Global vs. its own one-off custom upload. Editing a library
-- chart's images later instantly updates every product that picked it.
-- Run this once in the Supabase SQL editor.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS size_chart_id UUID REFERENCES size_charts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_size_chart_id ON products(size_chart_id);
