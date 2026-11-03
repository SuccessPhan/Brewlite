// Gợi ý dành cho buổi trình bày (tài khoản mẫu, thẻ thử VNPay). Mặc định ẩn để khách thật không thấy;
// bật bằng NEXT_PUBLIC_SHOW_DEMO_HINTS=1 trong frontend/.env.local khi chạy demo.
export const SHOW_DEMO_HINTS = process.env.NEXT_PUBLIC_SHOW_DEMO_HINTS === '1';

export type DemoAccount = { email: string; name: string; initials: string; role: string; note: string };

/** Mật khẩu chung của các tài khoản mẫu do seed tạo */
export const DEMO_PASSWORD = 'Brewlite123';

export const DEMO_CUSTOMERS: DemoAccount[] = [{ email: 'demo@brewlite.vn', name: 'Nguyễn Minh Anh', initials: 'MA', role: 'Khách quen', note: 'Có sẵn đơn, giao dịch và điểm thưởng' }];

export const DEMO_INTERNAL: DemoAccount[] = [
  { email: 'manager@brewlite.vn', name: 'Quản lý cửa hàng', initials: 'QL', role: 'Quản lý', note: 'Thực đơn, mã giảm giá, phản hồi, kho' },
  { email: 'staff@brewlite.vn', name: 'Nhân viên quầy', initials: 'NV', role: 'Nhân viên', note: 'Hàng đợi pha chế, chuyển bước đơn' },
];
