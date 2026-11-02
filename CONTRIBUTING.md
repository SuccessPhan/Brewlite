# Quy trình làm việc nhóm với Git – BrewLite

Thầy chấm tiến độ dựa trên **lịch sử commit** của từng người, nên mỗi bạn phải tự commit
bằng **tài khoản GitHub của chính mình**. Không nhờ người khác commit hộ.

## 1. Cài đặt một lần

1. Cài [Git](https://git-scm.com/downloads) và Node.js LTS, Docker Desktop.
2. Chấp nhận lời mời vào repo (GitHub gửi qua email, hoặc vào trang repo bấm *Accept invitation*).
3. Khai báo tên và email **trùng với email tài khoản GitHub** (sai email thì commit không được tính cho bạn):
   ```bash
   git config --global user.name  "Họ Tên Của Bạn"
   git config --global user.email "email-dang-ky-github@gmail.com"
   ```
4. Tải code về và chạy thử theo README:
   ```bash
   git clone <link-repo>
   cd Brewlite/brewlite
   ```

## 2. Mỗi lần làm một việc

```bash
git checkout main
git pull                                   # lấy code mới nhất của cả nhóm
git checkout -b feat/huy-don-hoan-kho   # tạo nhánh riêng cho việc này

# ... sửa code, chạy thử ...

git add .
git commit -m "feat(orders): thêm API huỷ đơn và hoàn kho"
git push -u origin feat/huy-don-hoan-kho
```

Sau đó lên GitHub bấm **Compare & pull request**, điền mẫu có sẵn, chọn **1 bạn khác** ở ô *Reviewers*.
Người review đọc code, bấm *Approve* (hoặc góp ý), rồi bấm **Merge**. Xong thì xoá nhánh.

Làm tiếp trên cùng nhánh: cứ `git add` / `git commit` / `git push`, pull request tự cập nhật.

## 3. Quy tắc

| Quy tắc | Lý do |
|---|---|
| Không push thẳng vào `main`, luôn qua pull request | Tránh làm hỏng code chung, có người review |
| Commit **nhỏ và thường xuyên** (vài lần mỗi tuần), không dồn 1 commit to cuối kỳ | Thầy xem tiến độ đều đặn |
| Mỗi nhánh chỉ làm 1 việc | Review dễ, ít đụng nhau |
| Không commit file `.env`, `node_modules/`, `dist/`, `.next/` | Đã có trong `.gitignore`; `.env` chứa khoá bí mật (`JWT_SECRET`, `VNP_HASH_SECRET` của VNPay). Gửi mã VNPay cho nhau qua tin nhắn riêng, không dán vào code, issue hay pull request |
| Trước khi tạo pull request: `npm run build` và `npm run test` (backend) phải qua | GitHub Actions cũng tự chạy kiểm tra, PR đỏ thì sửa rồi mới merge |

**Đặt tên nhánh:** `feat/<viec>` (chức năng mới), `fix/<loi>` (sửa lỗi), `docs/<tai-lieu>` (tài liệu, sơ đồ).

**Lời nhắn commit:** `<loại>(<phần>): <mô tả tiếng Việt>`, ví dụ
`feat(cart): sửa tuỳ chọn món trong giỏ`, `fix(payments): không trừ điểm hai lần`, `test(orders): thêm test huỷ đơn`, `docs: cập nhật sơ đồ tuần tự`, `chore: cập nhật thư viện`.

## 4. Khi bị xung đột (conflict)

```bash
git checkout feat/nhanh-cua-ban
git pull origin main          # kéo main mới về nhánh của bạn
# mở các file bị đánh dấu <<<<<<< ======= >>>>>>>, giữ phần đúng, xoá các dấu đó
git add .
git commit -m "merge main vào nhánh"
git push
```
Không chắc thì hỏi bạn đã viết đoạn code kia, đừng xoá code của người khác.

## 5. Phân công

### 5.1 Phần phụ trách theo chức năng

Mỗi bạn phụ trách **tìm hiểu, trình bày khi vấn đáp, vẽ sơ đồ UML và review** phần code dưới đây. Sửa vào phần của bạn khác thì nhắn trước và gắn bạn đó vào review. Đường dẫn trong bảng tính từ thư mục `brewlite/`, riêng `.github/` nằm ở thư mục gốc repo.

| Thành viên | Chức năng | Backend | Frontend |
|---|---|---|---|
| Nguyễn Tiến Đạt | CSDL, sản phẩm, thực đơn, tìm món, giỏ hàng, mã giảm giá (giao diện cùng Phan Thành Đạt) | `backend/prisma`, `backend/src/seed.ts`, `backend/src/products`, `backend/src/promotions` | `frontend/components/menu`, `frontend/components/product`, `frontend/components/search`, `frontend/lib/` (types, mock-data, format, products, search, images, pricing), `frontend/context/app-store.tsx`, `frontend/lib/fly-to-cart.ts`, `frontend/components/layout/BottomNav.tsx` |
| Phan Thành Đạt | Khởi tạo dự án, lịch sử đơn, lịch sử giao dịch, Docker, CI; API đăng nhập cùng Trần Anh Trung; giao diện thực đơn, chi tiết món, tìm món, giỏ hàng, trang nhất cùng Nguyễn Tiến Đạt | `backend/src/main.ts`, `backend/src/app.*`, `backend/src/prisma`, `backend/src/common`, `GET /orders/me` (`findMine` trong `orders.service.ts`), `GET /payments/me` và `GET /payments/:id` (`findMine`, `findOne` trong `payments.service.ts`) | `frontend/app/layout.tsx`, `frontend/lib/api.ts`, `frontend/lib/use-orders.ts`, `frontend/components/ui`, `frontend/components/layout` (AppHeader, QueryProvider), `frontend/app/orders/page.tsx`, `frontend/components/orders` (OrdersList, OrderStatusPill), `frontend/app/payments`, `frontend/components/payment` (PaymentHistory), `frontend/lib/payments.ts` (useMyPayments, usePaymentDetail, nhãn trạng thái), `docker-compose.yml`, `*/Dockerfile`, `.github/`; cùng Nguyễn Tiến Đạt: `frontend/components/menu`, `frontend/components/product`, `frontend/components/search`, `frontend/components/home`, `frontend/app/globals.css` |
| Trần Anh Trung | Đăng ký, đăng nhập (API cùng Phan Thành Đạt), tài khoản, đổi điểm | `backend/src/auth` | `frontend/context/auth-context.tsx`, `frontend/components/auth`, `frontend/components/account`, `frontend/components/layout/UserMenu.tsx`, `frontend/app/login`, `frontend/app/register`, `frontend/app/account` |
| Đinh Văn Đạt | Thanh toán qua VNPay | `backend/src/payments/vnpay`, `backend/src/payments/dto`, `backend/src/payments/client-ip.ts`, `POST /payments`, Return URL, IPN, `/vnpay/status`, `POST /payments/:id/query` (`pay`, `handleReturn`, `handleIpn`, `reconcile`, `applyResult` trong `payments.service.ts`), `backend/test/helpers.ts`, `backend/test/payments-vnpay.int-spec.ts` | `frontend/app/payment/vnpay-return`, `frontend/components/payment/VnpayReturn.tsx`, bước gửi thanh toán trong `frontend/components/checkout/Checkout.tsx` (`payOrder`, `sendPayment`), `useVnpayStatus`, `useReconcile` trong `frontend/lib/payments.ts` |
| Đỗ Chí Thanh | Đặt món (tạo đơn), theo dõi đơn, hoá đơn | `backend/src/orders/dto`, `backend/src/orders/pricing.ts`, `POST /orders` và `GET /orders/:id` (`create`, `createInTx` phần tính giá, áp mã, tạo đơn; `findOne` trong `orders.service.ts`) | `frontend/app/checkout`, `frontend/components/checkout` (Checkout.tsx trừ bước gửi thanh toán, PaymentMethodList.tsx), `frontend/app/orders/[id]`, `frontend/components/orders` (OrderTracking, InvoiceModal) |
| Lê Bảo Trọng Tấn | Trạng thái đơn, tồn kho, huỷ đơn, quầy | `backend/src/orders/order-state-machine.ts` (+ spec), trong `orders.service.ts`: phần trừ kho có kiểm tra `version` (optimistic locking), `cancel` (huỷ cả link VNPay đang chờ), `advance`, `moveOrderStatus`; `backend/test/stock-concurrency.int-spec.ts` | `frontend/components/layout/NotificationBell.tsx`, nút huỷ đơn và demo quầy trong `OrderTracking.tsx` |

**Review chéo:** Đỗ Chí Thanh ↔ Đinh Văn Đạt, Nguyễn Tiến Đạt ↔ Phan Thành Đạt, Trần Anh Trung ↔ Lê Bảo Trọng Tấn.

Mỗi tuần mỗi bạn nên có ít nhất 1 pull request được merge và review ít nhất 1 pull request của bạn khác.

### 5.2 Quầy và quản lý cửa hàng

| Thành viên | Chức năng | Backend | Frontend |
|---|---|---|---|
| Phan Thành Đạt | Nhân viên quầy (hàng đợi, chuyển bước, huỷ đơn đã trả có lý do), quản lý cửa hàng (tổng quan, thực đơn, mã giảm giá, nội dung trang, phản hồi khách), kho nguyên liệu (phiếu nhập, công thức, trừ kho khi pha), quản lý tài khoản khách (khoá, mở khoá có lý do), một trang đăng nhập cho mọi vai trò, báo giá từ máy chủ | `backend/src/staff`, `backend/src/manage`, `backend/src/inventory`, `backend/src/customers`, `backend/src/auth/customer-only.decorator.ts`, `quote` và `expireStale`, `staffCancel` trong `orders.service.ts` | `frontend/app/staff`, `frontend/app/quan-ly`, `frontend/components/staff`, `frontend/components/manager`, `frontend/components/internal`, `frontend/lib/quote.ts`, `frontend/lib/inventory.ts`, `frontend/lib/customers-admin.ts`, `frontend/lib/storefront.ts` |

### 5.3 Rà soát code và kiểm thử

| Thành viên | Nhiệm vụ | Sản phẩm |
|---|---|---|
| Phan Thành Đạt | Rà soát toàn bộ code backend và frontend theo tiêu chí của đề (10 task, Definition of Done); kiểm thử luồng đúng, luồng sai (sai quyền, sai trạng thái, dữ liệu xấu) và đồng bộ giữa khách, quầy, quản lý; kiểm thử API trực tiếp; đo yêu cầu phi chức năng (API dưới 500ms) | Unit test (`npm test`), integration test trên CSDL thật (`npm run test:int`), bộ Thunder Client 91 request (`brewlite/thunder-client/`, chạy toàn bộ bằng `node brewlite/thunder-client/chay-thunder.mjs`) |
