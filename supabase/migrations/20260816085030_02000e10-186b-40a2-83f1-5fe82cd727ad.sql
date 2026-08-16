ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS serial_number text;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS image_url text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO anon;

CREATE POLICY "Public can read devices" ON public.devices FOR SELECT TO anon USING (true);
CREATE POLICY "Public can insert devices" ON public.devices FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public can update devices" ON public.devices FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete devices" ON public.devices FOR DELETE TO anon USING (true);

CREATE POLICY "Public read device images" ON storage.objects FOR SELECT USING (bucket_id = 'device-images');
CREATE POLICY "Public upload device images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'device-images');
CREATE POLICY "Public update device images" ON storage.objects FOR UPDATE USING (bucket_id = 'device-images') WITH CHECK (bucket_id = 'device-images');
CREATE POLICY "Public delete device images" ON storage.objects FOR DELETE USING (bucket_id = 'device-images');