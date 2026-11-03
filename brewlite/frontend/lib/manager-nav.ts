// Các mục của khu Quản lý cửa hàng, dùng chung cho thanh mục bên trái và ô tìm nhanh
export interface ManagerSection {
  href: string;
  label: string;
  /** Từ khoá phụ để ô tìm nhanh hiểu cách gọi khác */
  keywords: string[];
}

export const MANAGER_GROUPS: { title: string; items: ManagerSection[] }[] = [
  { title: '', items: [{ href: '/quan-ly', label: 'Tổng quan', keywords: ['dashboard', 'hom nay', 'bang tin'] }] },
  {
    title: 'Cửa hàng',
    items: [
      { href: '/quan-ly/thuc-don', label: 'Thực đơn', keywords: ['mon', 'menu', 'an mon', 'gia', 'anh', 'slogan'] },
      { href: '/quan-ly/ma-giam-gia', label: 'Mã giảm giá', keywords: ['voucher', 'khuyen mai', 'uu dai', 'coupon'] },
      { href: '/quan-ly/noi-dung', label: 'Nội dung trang', keywords: ['trang nhat', 'banner', 'thong bao', 'tieu de', 'slogan'] },
    ],
  },
  { title: 'Khách hàng', items: [{ href: '/quan-ly/phan-hoi', label: 'Phản hồi', keywords: ['gop y', 'khieu nai', 'feedback', 'thu'] }] },
  {
    title: 'Kho',
    items: [
      { href: '/quan-ly/nguyen-lieu', label: 'Nguyên liệu', keywords: ['ton kho', 'nvl', 'sap het'] },
      { href: '/quan-ly/nhap-kho', label: 'Nhập kho', keywords: ['phieu nhap', 'mua hang'] },
      { href: '/quan-ly/kiem-kho', label: 'Kiểm kho', keywords: ['dem', 'kiem ke'] },
      { href: '/quan-ly/cong-thuc', label: 'Công thức', keywords: ['dinh luong', 'gia von', 'recipe'] },
    ],
  },
];

export const MANAGER_SECTIONS = MANAGER_GROUPS.flatMap((g) => g.items);
