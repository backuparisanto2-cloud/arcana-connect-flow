import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

import { getDeviceImageUrl } from "@/lib/device-image";

export function DeviceImage({
  path,
  alt,
  className = "h-12 w-12",
}: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setUrl(null);
    if (!path) return;
    void getDeviceImageUrl(path).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [path]);

  if (!path) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground ${className}`}
      >
        <ImageIcon className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span className={`inline-block overflow-hidden rounded-lg border border-border ${className}`}>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover" />
        </a>
      ) : (
        <span className="block h-full w-full animate-pulse bg-secondary" />
      )}
    </span>
  );
}
