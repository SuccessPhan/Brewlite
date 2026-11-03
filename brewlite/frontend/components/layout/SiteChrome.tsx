'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { isInternalPath } from '@/lib/internal';

/** Trang của khách có măng-sét, chân trang, thanh dưới; khu nội bộ tự dựng khung riêng.
 *  Nhân viên quầy chỉ làm việc ở quầy pha chế: mở trang của khách thì đưa về quầy. */
export default function SiteChrome({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const internal = isInternalPath(pathname);
  const staffOutside = !internal && user?.role === 'STAFF';

  useEffect(() => {
    if (staffOutside) router.replace('/staff');
  }, [staffOutside, router]);

  if (internal) return <>{children}</>;
  if (staffOutside) return null;
  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}
