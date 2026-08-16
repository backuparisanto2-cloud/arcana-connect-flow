CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'Lainnya',
  location TEXT,
  ip_address TEXT,
  mac_address TEXT,
  username TEXT,
  password TEXT,
  ssid TEXT,
  wifi_password TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO authenticated;
GRANT ALL ON public.devices TO service_role;

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read devices" ON public.devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert devices" ON public.devices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update devices" ON public.devices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete devices" ON public.devices FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_devices_updated_at
BEFORE UPDATE ON public.devices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();