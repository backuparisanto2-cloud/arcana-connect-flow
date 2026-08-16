DELETE FROM public.devices a
USING public.devices b
WHERE a.mac_address IS NOT NULL
  AND b.mac_address IS NOT NULL
  AND upper(a.mac_address) = upper(b.mac_address)
  AND coalesce(a.ip_address,'') = coalesce(b.ip_address,'')
  AND (a.created_at > b.created_at OR (a.created_at = b.created_at AND a.id > b.id));

CREATE UNIQUE INDEX IF NOT EXISTS devices_mac_ip_unique
  ON public.devices (upper(mac_address), coalesce(ip_address,''))
  WHERE mac_address IS NOT NULL;