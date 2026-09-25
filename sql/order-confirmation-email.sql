ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_confirmation_email_sent_at TIMESTAMP WITH TIME ZONE;
