ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT,
  ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT,
  ADD COLUMN IF NOT EXISTS shiprocket_awb_code TEXT,
  ADD COLUMN IF NOT EXISTS shiprocket_courier_company_id TEXT,
  ADD COLUMN IF NOT EXISTS shiprocket_pickup_token TEXT,
  ADD COLUMN IF NOT EXISTS shiprocket_pickup_scheduled_date TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id ON orders(shiprocket_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_shipment_id ON orders(shiprocket_shipment_id);
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_awb_code ON orders(shiprocket_awb_code);
