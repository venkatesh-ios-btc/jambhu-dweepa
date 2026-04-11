import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type Props = { verifyUrl: string; size?: number };

/** Small QR for admin lists (same URL as customer ticket). */
export function TicketQrThumb({ verifyUrl, size = 96 }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!verifyUrl) return;
    let cancelled = false;
    QRCode.toDataURL(verifyUrl, { width: size, margin: 1, color: { dark: '#0a0a0a', light: '#ffffff' } })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [verifyUrl, size]);

  if (!src) {
    return <div className="rounded bg-muted animate-pulse" style={{ width: size, height: size }} />;
  }
  return (
    <img src={src} width={size} height={size} className="rounded bg-white p-1" alt="" />
  );
}
