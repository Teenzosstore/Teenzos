-- RAWFLEX RLS repair.
-- Run this in Supabase SQL Editor after enabling RLS on the tables.
-- It restores public read access for storefront content and owner/admin access
-- for private customer data.

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
CREATE POLICY "Admins can manage lookbook images" ON lookbook_images
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
CREATE POLICY "Admins can manage product variants" ON product_variants
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;
CREATE POLICY "Admins can manage product images" ON product_images
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage product information" ON product_information;
CREATE POLICY "Admins can manage product information" ON product_information
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage product FAQs" ON product_faqs;
CREATE POLICY "Admins can manage product FAQs" ON product_faqs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage global FAQs" ON global_faqs;
CREATE POLICY "Admins can manage global FAQs" ON global_faqs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage hero slides" ON hero_slides;
CREATE POLICY "Admins can manage hero slides" ON hero_slides
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage home banner images" ON home_banner_images;
CREATE POLICY "Admins can manage home banner images" ON home_banner_images
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons" ON coupons
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
