-- ==============================================================================
-- TeenZos  COMPLETE SUPABASE DATABASE SCHEMA & MIGRATION
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ywsybtefdtgnzzxnxfvy/sql/new
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'customer',
  full_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  count TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  "oldPrice" NUMERIC,
  featured_image_url TEXT,
  badge TEXT,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  description TEXT,
  short_description TEXT,
  color_group_id UUID,
  color_name TEXT,
  color_hex TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  use_global_faqs BOOLEAN DEFAULT false,
  use_global_size_chart BOOLEAN DEFAULT true,
  size_chart_image_url TEXT,
  size_chart_cloudinary_public_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- 5. Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- 6. Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  cloudinary_public_id TEXT,
  sort_order INTEGER DEFAULT 0,
  color_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- 7. Product Information Table
CREATE TABLE IF NOT EXISTS product_information (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_information_product_id ON product_information(product_id);

-- 8. Product FAQs Table
CREATE TABLE IF NOT EXISTS product_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_faqs_product_id ON product_faqs(product_id);

-- 9. Global FAQs Table
CREATE TABLE IF NOT EXISTS global_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Size Charts Table
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

CREATE INDEX IF NOT EXISTS idx_size_charts_is_global ON size_charts(is_global);
CREATE INDEX IF NOT EXISTS idx_size_charts_is_active ON size_charts(is_active);

-- 11. Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- 12. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  subtotal NUMERIC NOT NULL,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  courier_name TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipment_notes TEXT,
  shiprocket_order_id TEXT,
  shiprocket_shipment_id TEXT,
  shiprocket_awb_code TEXT,
  shiprocket_courier_company_id TEXT,
  shiprocket_pickup_token TEXT,
  shiprocket_pickup_scheduled_date TEXT,
  order_confirmation_email_sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  stock_decremented_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id ON orders(shiprocket_order_id);

-- 13. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  price_at_purchase NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  line_total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 14. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- 15. Contact Inquiries Table
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Hero Slides Table
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  button_text TEXT,
  button_link TEXT,
  text_mode TEXT DEFAULT 'global',
  position TEXT DEFAULT 'right',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16b. Hero Section Content Table (Headline, Subtitle, & Action Buttons)
CREATE TABLE IF NOT EXISTS hero_section (
  id TEXT PRIMARY KEY DEFAULT 'main',
  eyebrow TEXT DEFAULT 'STREETWEAR',
  headline_top TEXT DEFAULT 'EXPRESS WHAT',
  headline_accent TEXT DEFAULT 'MOVES YOU',
  subtitle TEXT DEFAULT 'Bold designs. Premium comfort.
More than clothes, it’s a mindset.',
  button_text TEXT DEFAULT 'Shop Now',
  button_link TEXT DEFAULT '/shop',
  secondary_button_text TEXT DEFAULT 'Explore Collections',
  secondary_button_link TEXT DEFAULT '/collections',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'flat')),
  value NUMERIC NOT NULL,
  min_purchase NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. Settings Table (Shipping, Announcements, About & Oversized sections)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'site_settings',
  shipping JSONB DEFAULT '{"flat_rate": 99, "free_threshold": 1999, "cod_charge": 50, "online_discount": 0}'::jsonb,
  announcements JSONB DEFAULT '[]'::jsonb,
  faqs JSONB DEFAULT '[]'::jsonb,
  home_banner_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 19. Home Banner Images Table
CREATE TABLE IF NOT EXISTS home_banner_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. Lookbook Images Table
CREATE TABLE IF NOT EXISTS lookbook_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 21. Email OTPs Table (Passwordless Auth)
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  full_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_otps_created_at ON email_otps(created_at);

-- Trigger to automatically clean email_otps older than 24 hours on every insert
CREATE OR REPLACE FUNCTION trigger_clean_old_email_otps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.email_otps
  WHERE created_at < NOW() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clean_old_email_otps ON email_otps;
CREATE TRIGGER trg_clean_old_email_otps
AFTER INSERT ON email_otps
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_clean_old_email_otps();

-- 22. Newsletter Subscriptions Table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);

-- 23. Announcements Table (Top Marquee & Store Ticker)
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  badge TEXT,
  badge_theme TEXT DEFAULT 'cyan',
  icon TEXT DEFAULT 'sparkles',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_display_order ON announcements(display_order);


-- ==============================================================================
-- 3. FUNCTIONS & STORED PROCEDURES
-- ==============================================================================

-- Timestamp Update Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Admin check helper
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Stock decrement helper
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

-- Atomic stock decrement for order
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

-- Automatic profile creation on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = COALESCE(EXCLUDED.role, public.profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==============================================================================
-- 4. TRIGGERS
-- ==============================================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_global_faqs_updated_at ON global_faqs;
CREATE TRIGGER update_global_faqs_updated_at BEFORE UPDATE ON global_faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_size_charts_updated_at ON size_charts;
CREATE TRIGGER update_size_charts_updated_at BEFORE UPDATE ON size_charts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_inquiries_updated_at ON contact_inquiries;
CREATE TRIGGER update_contact_inquiries_updated_at BEFORE UPDATE ON contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hero_slides_updated_at ON hero_slides;
CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON hero_slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hero_section_updated_at ON hero_section;
CREATE TRIGGER update_hero_section_updated_at BEFORE UPDATE ON hero_section
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_home_banner_images_updated_at ON home_banner_images;
CREATE TRIGGER update_home_banner_images_updated_at BEFORE UPDATE ON home_banner_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lookbook_images_updated_at ON lookbook_images;
CREATE TRIGGER update_lookbook_images_updated_at BEFORE UPDATE ON lookbook_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_banner_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "Profiles are readable by owner or admin" ON profiles;
CREATE POLICY "Profiles are readable by owner or admin" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Profiles are updatable by owner or admin" ON profiles;
CREATE POLICY "Profiles are updatable by owner or admin" ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin()) WITH CHECK (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid() OR is_admin());

-- 2. Addresses
DROP POLICY IF EXISTS "Addresses are owner readable" ON addresses;
CREATE POLICY "Addresses are owner readable" ON addresses
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Addresses are owner manageable" ON addresses;
CREATE POLICY "Addresses are owner manageable" ON addresses
  FOR ALL USING (user_id = auth.uid() OR is_admin()) WITH CHECK (user_id = auth.uid() OR is_admin());

-- 3. Categories
DROP POLICY IF EXISTS "Public can read active categories" ON categories;
CREATE POLICY "Public can read active categories" ON categories
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 4. Products
DROP POLICY IF EXISTS "Public can read active products" ON products;
CREATE POLICY "Public can read active products" ON products
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 5. Product Variants
DROP POLICY IF EXISTS "Public can read active variants" ON product_variants;
CREATE POLICY "Public can read active variants" ON product_variants
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
CREATE POLICY "Admins can manage product variants" ON product_variants
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 6. Product Images
DROP POLICY IF EXISTS "Public can read product images" ON product_images;
CREATE POLICY "Public can read product images" ON product_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;
CREATE POLICY "Admins can manage product images" ON product_images
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 7. Product Information
DROP POLICY IF EXISTS "Public can read product information" ON product_information;
CREATE POLICY "Public can read product information" ON product_information
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product information" ON product_information;
CREATE POLICY "Admins can manage product information" ON product_information
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 8. Product FAQs
DROP POLICY IF EXISTS "Public can read product FAQs" ON product_faqs;
CREATE POLICY "Public can read product FAQs" ON product_faqs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product FAQs" ON product_faqs;
CREATE POLICY "Admins can manage product FAQs" ON product_faqs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 9. Global FAQs
DROP POLICY IF EXISTS "Public can read global FAQs" ON global_faqs;
CREATE POLICY "Public can read global FAQs" ON global_faqs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage global FAQs" ON global_faqs;
CREATE POLICY "Admins can manage global FAQs" ON global_faqs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 10. Size Charts
DROP POLICY IF EXISTS "Public can read active size charts" ON size_charts;
CREATE POLICY "Public can read active size charts" ON size_charts
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage size charts" ON size_charts;
CREATE POLICY "Admins can manage size charts" ON size_charts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 11. Cart Items
DROP POLICY IF EXISTS "Cart items are owner readable" ON cart_items;
CREATE POLICY "Cart items are owner readable" ON cart_items
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Cart items are owner manageable" ON cart_items;
CREATE POLICY "Cart items are owner manageable" ON cart_items
  FOR ALL USING (user_id = auth.uid() OR is_admin()) WITH CHECK (user_id = auth.uid() OR is_admin());

-- 12. Orders
DROP POLICY IF EXISTS "Orders are owner readable" ON orders;
CREATE POLICY "Orders are owner readable" ON orders
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins can manage orders" ON orders
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 13. Order Items
DROP POLICY IF EXISTS "Order items readable with order access" ON order_items;
CREATE POLICY "Order items readable with order access" ON order_items
  FOR SELECT USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;
CREATE POLICY "Admins can manage order items" ON order_items
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 14. Reviews
DROP POLICY IF EXISTS "Public can read approved reviews" ON reviews;
CREATE POLICY "Public can read approved reviews" ON reviews
  FOR SELECT USING (is_approved = true OR user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert reviews" ON reviews;
CREATE POLICY "Users can insert reviews" ON reviews
  FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 15. Contact Inquiries
DROP POLICY IF EXISTS "Anyone can submit contact inquiries" ON contact_inquiries;
CREATE POLICY "Anyone can submit contact inquiries" ON contact_inquiries
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage contact inquiries" ON contact_inquiries;
CREATE POLICY "Admins can manage contact inquiries" ON contact_inquiries
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 16. Hero Slides
DROP POLICY IF EXISTS "Public can read active hero slides" ON hero_slides;
CREATE POLICY "Public can read active hero slides" ON hero_slides
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage hero slides" ON hero_slides;
CREATE POLICY "Admins can manage hero slides" ON hero_slides
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 16b. Hero Section Content (Text & Action Buttons)
DROP POLICY IF EXISTS "Public can read active hero section" ON hero_section;
CREATE POLICY "Public can read active hero section" ON hero_section
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage hero section" ON hero_section;
CREATE POLICY "Admins can manage hero section" ON hero_section
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 17. Coupons
DROP POLICY IF EXISTS "Public can validate active coupons" ON coupons;
CREATE POLICY "Public can validate active coupons" ON coupons
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons" ON coupons
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 18. Settings
DROP POLICY IF EXISTS "Public can read site settings" ON settings;
CREATE POLICY "Public can read site settings" ON settings
  FOR SELECT USING (id = 'site_settings');

DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 19. Home Banner Images
DROP POLICY IF EXISTS "Public can read active home banner images" ON home_banner_images;
CREATE POLICY "Public can read active home banner images" ON home_banner_images
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage home banner images" ON home_banner_images;
CREATE POLICY "Admins can manage home banner images" ON home_banner_images
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 20. Lookbook Images
DROP POLICY IF EXISTS "Public can view active lookbook images" ON lookbook_images;
CREATE POLICY "Public can view active lookbook images" ON lookbook_images
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage lookbook images" ON lookbook_images;
CREATE POLICY "Admins can manage lookbook images" ON lookbook_images
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 21. Email OTPs
DROP POLICY IF EXISTS "Admins can manage email OTPs" ON email_otps;
CREATE POLICY "Admins can manage email OTPs" ON email_otps
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 22. Newsletter Subscriptions
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage newsletter subscriptions" ON newsletter_subscriptions;
CREATE POLICY "Admins can manage newsletter subscriptions" ON newsletter_subscriptions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 23. Announcements
DROP POLICY IF EXISTS "Public can read active announcements" ON announcements;
CREATE POLICY "Public can read active announcements" ON announcements
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- ==============================================================================
-- 6. DEFAULT SEED RECORDS
-- ==============================================================================

-- 1. Default site settings
INSERT INTO settings (id, announcements)
VALUES (
  'site_settings',
  '{"about_section": {"eyebrow": "Our Story", "image_url": "/hero-parts.png", "badge_label": "Years on the streets", "badge_value": "3+", "headline_top": "Crafted in Ahmedabad,", "paragraph_one": "Teenzosstore started with a bold vision — streetwear that lets you wear your vibe without compromises. Heavyweight fabric built for the hustle, cyber bunny graphics, and oversized fits that turn heads. Every piece is crafted, printed and packed with care in Ahmedabad.", "paragraph_two": "No shortcuts. Just drops we are proud to put our name on, shipped to every corner of India.", "stat_one_label": "Drops delivered", "stat_one_value": "120+", "stat_two_label": "States shipped to", "stat_two_value": "24", "headline_bottom": "made for the new gen.", "stat_three_label": "Flexers styled", "stat_three_value": "5,000+"}}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 2. Default announcements
INSERT INTO announcements (id, badge, badge_theme, icon, text, is_active, display_order)
VALUES
  ('shipping', 'FREE DELIVERY', 'cyan', 'truck', 'PAN-INDIA EXPRESS SHIPPING ON ALL ORDERS', true, 0),
  ('prepaid', 'PREPAID DROP', 'pink', 'zap', 'EXTRA 10% OFF ON UPI & PREPAID ORDERS', true, 1),
  ('new-drop', 'NEW COLLECTION', 'orange', 'flame', 'CYBERPUNK & ACID-WASH OVERSIZED TEES LIVE NOW', true, 2),
  ('fabric', '240+ GSM', 'soft-pink', 'sparkles', 'HEAVYWEIGHT COMBED COTTON • SIGNATURE BOX DROPS', true, 3),
  ('code', 'CODE: TEENZOS10', 'white', 'tag', 'GET 10% OFF ON YOUR FIRST STREETWEAR ORDER', true, 4),
  ('culture', 'ORIGINAL STREETWEAR', 'cyan-subtle', 'shield', 'CRAFTED IN AHMEDABAD • MADE FOR THE NEW GENERATION', true, 5)
ON CONFLICT (id) DO NOTHING;

-- 3. Default global size chart
INSERT INTO size_charts (id, name, image_url, is_global, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Global Size Chart',
  '/Default_SizeChart.jpg',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 4. Backfill existing Supabase Auth users into profiles with admin privileges
INSERT INTO public.profiles (id, email, role, full_name, is_active)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'role', 'admin'),
  COALESCE(raw_user_meta_data->>'full_name', 'Admin'),
  true
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  role = 'admin',
  is_active = true;

-- 5. Default Categories (Frontend & Shop Page Streetwear Categories)
INSERT INTO categories (id, name, slug, description, image_url, count, is_active)
VALUES
  ('men', 'Men', 'men', 'Oversized & boxy streetwear fits engineered for maximum comfort and style.', '/images/explore/img_01.png', '12 styles', true),
  ('women', 'Women', 'women', 'Relaxed streetwear silhouettes, crop graphics, and bold aesthetics.', '/images/explore/img_04.png', '8 styles', true),
  ('new-arrivals', 'New Arrivals', 'new-arrivals', 'Fresh drops hitting the racks every week — cop before they sell out.', '/images/explore/img_04.png', '16 styles', true),
  ('bestseller', 'Hot Bestseller', 'bestseller', 'The most wanted streetwear pieces everyone''s repping. Restocked weekly.', '/images/explore/img_01.png', '14 styles', true),
  ('trending', 'Trending', 'trending', 'Viral fits and hyped silhouettes setting the streetwear culture wave.', '/images/explore/img_02.png', '10 styles', true),
  ('exclusive', 'Exclusive', 'exclusive', 'Numbered limited runs and 1-of-1 drops that never restock.', '/images/explore/img_03.png', '6 styles', true),
  ('hoodies', 'Hoodies', 'hoodies', 'Heavyweight 400+ GSM fleece and graffiti streetwear hoodies.', '/images/explore/img_01.png', '18 styles', true),
  ('t-shirts', 'T-Shirts', 't-shirts', 'Heavyweight 240 GSM boxy oversized graphic tees built for everyday flex.', '/images/explore/img_02.png', '24 styles', true),
  ('sweatshirts', 'Sweatshirts', 'sweatshirts', 'Clean crewnecks and heavyweight graphic pullovers for cozy fits.', '/images/explore/img_03.png', '8 styles', true),
  ('jackets', 'Jackets', 'jackets', 'Denim, utility bombers, and distressed outerwear for the streets.', '/images/explore/img_04.png', '6 styles', true),
  ('bottoms', 'Bottoms', 'bottoms', 'Relaxed street cargo pants, tech joggers, and distressed denim.', '/images/explore/img_02.png', '10 styles', true),
  ('accessories', 'Accessories', 'accessories', 'Streetwear caps, beanies, socks, and custom hardware accessories.', '/images/explore/img_03.png', '8 styles', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  count = EXCLUDED.count,
  is_active = EXCLUDED.is_active;

-- ==============================================================================
-- SCHEMA CREATION COMPLETE!
-- ==============================================================================
