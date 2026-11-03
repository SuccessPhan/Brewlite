'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isInternalPath } from '@/lib/internal';

/** Trang của khách có măng-sét, chân trang, thanh dưới; khu nội bộ tự dựng khung riêng */
export default function SiteChrome({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const internal = isInternalPath(usePathname());
  if (internal) return <>{children}</>;
  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}
