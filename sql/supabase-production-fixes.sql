-- RAWFLEX production readiness migration.
-- Run this once in Supabase SQL Editor before deploying these code changes.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;

ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'right';

UPDATE hero_slides
SET position = 'right'
WHERE position IS NULL;

CREATE TABLE IF NOT EXISTS home_banner_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS lookbook_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS courier_name TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS shipment_notes TEXT,
  ADD COLUMN IF NOT EXISTS stock_decremented_at TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE FUNCTION decrement_product_variant_stock(
  variant_id_input UUID,
  quantity_input INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  IF quantity_input <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  SELECT stock_quantity
  INTO current_stock
  FROM product_variants
  WHERE id = variant_id_input
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product variant not found';
  END IF;

  IF current_stock < quantity_input THEN
    RAISE EXCEPTION 'Not enough stock available';
  END IF;

  UPDATE product_variants
  SET stock_quantity = current_stock - quantity_input,
      updated_at = timezone('utc'::text, now())
  WHERE id = variant_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION decrement_order_stock_once(order_id_input UUID)
RETURNS BOOLEAN AS $$
DECLARE
  existing_stock_decremented_at TIMESTAMP WITH TIME ZONE;
  item RECORD;
  current_stock INTEGER;
BEGIN
  SELECT stock_decremented_at
  INTO existing_stock_decremented_at
  FROM orders
  WHERE id = order_id_input
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF existing_stock_decremented_at IS NOT NULL THEN
    RETURN false;
  END IF;

  FOR item IN
    SELECT variant_id, quantity, product_name
    FROM order_items
    WHERE order_id = order_id_input
  LOOP
    SELECT stock_quantity
    INTO current_stock
    FROM product_variants
    WHERE id = item.variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant not found for %', item.product_name;
    END IF;

    IF current_stock < item.quantity THEN
      RAISE EXCEPTION 'Not enough stock available for %', item.product_name;
    END IF;

    UPDATE product_variants
    SET stock_quantity = current_stock - item.quantity,
        updated_at = timezone('utc'::text, now())
    WHERE id = item.variant_id;
  END LOOP;

  UPDATE orders
  SET stock_decremented_at = timezone('utc'::text, now())
  WHERE id = order_id_input;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
