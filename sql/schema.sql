-- RAWFLEX Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'customer',
  full_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Addresses Table
CREATE TABLE addresses (
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

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- 3. Categories Table
CREATE TABLE categories (
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
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id TEXT REFERENCES categories(id),
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
  fabric TEXT,
  stitching TEXT,
  use_global_faqs BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);

-- 5. Product Variants Table
CREATE TABLE product_variants (
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

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

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

-- 6. Product Images Table
CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  cloudinary_public_id TEXT,
  sort_order INTEGER DEFAULT 0,
  color_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- 7. Product Information Table
CREATE TABLE product_information (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_product_information_product_id ON product_information(product_id);

-- 8. Product FAQs Table
CREATE TABLE product_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_product_faqs_product_id ON product_faqs(product_id);

-- 8b. Global FAQs Table
CREATE TABLE global_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Cart Items Table
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, variant_id)
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- 10. Orders Table
CREATE TABLE orders (
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

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 11. Order Items Table
CREATE TABLE order_items (
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

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 12. Reviews Table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- 13. Contact Inquiries Table
CREATE TABLE contact_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Hero Slides Table
CREATE TABLE hero_slides (
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

-- 15. Coupons Table
CREATE TABLE coupons (
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

-- 16. Settings Table (for shipping, announcements, etc.)
CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT 'site_settings',
  shipping JSONB DEFAULT '{"flat_rate": 99, "free_threshold": 1999, "cod_charge": 50, "online_discount": 0}'::jsonb,
  announcements JSONB DEFAULT '[]'::jsonb,
  faqs JSONB DEFAULT '[]'::jsonb,
  home_banner_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default settings
INSERT INTO settings (id) VALUES ('site_settings')
ON CONFLICT (id) DO NOTHING;

-- 16b. Home Banner Images Table
CREATE TABLE home_banner_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16c. Lookbook Images Table
CREATE TABLE lookbook_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE lookbook_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active lookbook images"
  ON lookbook_images
  FOR SELECT
  USING (is_active = true);

INSERT INTO lookbook_images (id, image_url, link_url, display_order)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/lookbook/lookbook-1.jpg', '/shop', 0),
  ('11111111-1111-4111-8111-111111111102', 'https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/lookbook/lookbook-2.jpg', '/shop', 1),
  ('11111111-1111-4111-8111-111111111103', 'https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/lookbook/lookbook-3.jpg', '/shop', 2),
  ('11111111-1111-4111-8111-111111111104', 'https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/lookbook/lookbook-4.jpg', '/shop', 3),
  ('11111111-1111-4111-8111-111111111105', 'https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/lookbook/lookbook-5.jpg', '/shop', 4)
ON CONFLICT DO NOTHING;

-- 17. Email OTPs Table (for passwordless authentication)
CREATE TABLE email_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  full_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_email_otps_email ON email_otps(email);
CREATE INDEX idx_email_otps_expires_at ON email_otps(expires_at);

-- 17b. Newsletter Subscriptions Table
CREATE TABLE newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);

-- 18. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 19. Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_information_updated_at BEFORE UPDATE ON product_information
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_faqs_updated_at BEFORE UPDATE ON product_faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_inquiries_updated_at BEFORE UPDATE ON contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON hero_slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 19. Production Row Level Security
-- Public storefront data is read-only. Private customer/admin writes go through
-- server actions and the service role after application-level auth checks.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_banner_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are readable by owner or admin" ON profiles;
CREATE POLICY "Profiles are readable by owner or admin" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Profiles are updatable by owner or admin" ON profiles;
CREATE POLICY "Profiles are updatable by owner or admin" ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin()) WITH CHECK (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Addresses are owner readable" ON addresses;
CREATE POLICY "Addresses are owner readable" ON addresses
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Public can read active categories" ON categories;
CREATE POLICY "Public can read active categories" ON categories
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Public can read active products" ON products;
CREATE POLICY "Public can read active products" ON products
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Public can read active variants" ON product_variants;
CREATE POLICY "Public can read active variants" ON product_variants
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Public can read product images" ON product_images;
CREATE POLICY "Public can read product images" ON product_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read product information" ON product_information;
CREATE POLICY "Public can read product information" ON product_information
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read product FAQs" ON product_faqs;
CREATE POLICY "Public can read product FAQs" ON product_faqs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read global FAQs" ON global_faqs;
CREATE POLICY "Public can read global FAQs" ON global_faqs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cart items are owner readable" ON cart_items;
CREATE POLICY "Cart items are owner readable" ON cart_items
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Orders are owner readable" ON orders;
CREATE POLICY "Orders are owner readable" ON orders
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Order items readable with order access" ON order_items;
CREATE POLICY "Order items readable with order access" ON order_items
  FOR SELECT USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public can read approved reviews" ON reviews;
CREATE POLICY "Public can read approved reviews" ON reviews
  FOR SELECT USING (is_approved = true OR user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Anyone can submit contact inquiries" ON contact_inquiries;
CREATE POLICY "Anyone can submit contact inquiries" ON contact_inquiries
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read contact inquiries" ON contact_inquiries;
CREATE POLICY "Admins can read contact inquiries" ON contact_inquiries
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Public can read active hero slides" ON hero_slides;
CREATE POLICY "Public can read active hero slides" ON hero_slides
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Public can validate active coupons" ON coupons;
CREATE POLICY "Public can validate active coupons" ON coupons
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Public can read site settings" ON settings;
CREATE POLICY "Public can read site settings" ON settings
  FOR SELECT USING (id = 'site_settings');

DROP POLICY IF EXISTS "Public can read active home banner images" ON home_banner_images;
CREATE POLICY "Public can read active home banner images" ON home_banner_images
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Public can view active lookbook images" ON lookbook_images;
CREATE POLICY "Public can view active lookbook images" ON lookbook_images
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins can manage lookbook images" ON lookbook_images;
CREATE POLICY "Admins can manage lookbook images" ON lookbook_images FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
CREATE POLICY "Admins can manage product variants" ON product_variants FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;
CREATE POLICY "Admins can manage product images" ON product_images FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage product information" ON product_information;
CREATE POLICY "Admins can manage product information" ON product_information FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage product FAQs" ON product_faqs;
CREATE POLICY "Admins can manage product FAQs" ON product_faqs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage global FAQs" ON global_faqs;
CREATE POLICY "Admins can manage global FAQs" ON global_faqs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings" ON settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage hero slides" ON hero_slides;
CREATE POLICY "Admins can manage hero slides" ON hero_slides FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage home banner images" ON home_banner_images;
CREATE POLICY "Admins can manage home banner images" ON home_banner_images FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons" ON coupons FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews" ON reviews FOR ALL USING (is_admin()) WITH CHECK (is_admin());
