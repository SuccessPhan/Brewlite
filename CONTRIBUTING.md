# Quy trình làm việc nhóm với Git – BrewLite

Nhóm làm theo Scrum như đề bài tập lớn: Product Backlog gồm 10 task, chia vào 3 Sprint. Mỗi task chỉ được tính là xong khi đạt **Definition of Done** ở mục 3.

## 1. Cài đặt một lần

1. Cài [Git](https://git-scm.com/downloads), Node.js LTS và Docker Desktop.
2. Chấp nhận lời mời vào repo (GitHub gửi qua email, hoặc vào trang repo bấm *Accept invitation*).
3. Khai báo tên và email trùng với tài khoản GitHub để commit hiện đúng tên bạn:
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
git checkout -b feat/huy-don-hoan-kho      # tạo nhánh riêng cho việc này

# ... sửa code, chạy thử ...

git add .
git commit -m "feat(orders): thêm API huỷ đơn và hoàn kho"
git push -u origin feat/huy-don-hoan-kho
```

Sau đó lên GitHub bấm **Compare & pull request**, điền mẫu có sẵn, chọn **1 bạn khác** ở ô *Reviewers*.
Người review đọc code, bấm *Approve* (hoặc góp ý), rồi bấm **Merge**. Xong thì xoá nhánh.

Làm tiếp trên cùng nhánh: cứ `git add` / `git commit` / `git push`, pull request tự cập nhật.

## 3. Definition of Done (theo đề)

Một task được tính là xong khi:

- Code chạy được, không lỗi build; đúng tiêu chí chấp nhận của task.
- Có commit trên Git với mô tả rõ ràng; được review trong nhóm.
- API có validate đầu vào; giao diện xử lý trạng thái đang tải và lỗi cơ bản.
- Có hướng dẫn chạy trong README.

## 4. Quy ước của nhóm

| Quy ước | Lý do |
|---|---|
| Không push thẳng vào `main`, luôn qua nhánh riêng và pull request | Tránh làm hỏng code chung, có người review (DoD) |
| Mỗi nhánh chỉ làm 1 việc | Review dễ, ít đụng nhau |
| Không commit file `.env`, `node_modules/`, `dist/`, `.next/` | Đã có trong `.gitignore`; `.env` chứa khoá bí mật (`JWT_SECRET`, `VNP_HASH_SECRET` của VNPay). Gửi mã VNPay cho nhau qua tin nhắn riêng, không dán vào code, issue hay pull request |
| Trước khi tạo pull request: `npm run build` (backend, frontend) và `npm run test` (backend) phải qua | Đảm bảo "không lỗi build" của DoD; GitHub Actions cũng tự chạy kiểm tra, PR đỏ thì sửa rồi mới merge |

**Đặt tên nhánh:** `feat/<viec>` (chức năng mới), `fix/<loi>` (sửa lỗi), `docs/<tai-lieu>` (tài liệu, sơ đồ).

**Lời nhắn commit:** `<loại>(<phần>): <mô tả tiếng Việt>`, ví dụ
`feat(cart): sửa tuỳ chọn món trong giỏ`, `fix(payments): không trừ điểm hai lần`, `test(orders): thêm test huỷ đơn`, `docs: cập nhật sơ đồ tuần tự`, `chore: cập nhật thư viện`.

## 5. Khi bị xung đột (conflict)

```bash
git checkout feat/nhanh-cua-ban
git pull origin main          # kéo main mới về nhánh của bạn
# mở các file bị đánh dấu <<<<<<< ======= >>>>>>>, giữ phần đúng, xoá các dấu đó
git add .
git commit -m "merge main vào nhánh"
git push
```
Không chắc thì hỏi bạn đã viết đoạn code kia, đừng xoá code của người khác.

## 6. Phân công

Phân công theo 10 task, luồng đặt món và sơ đồ UML: [docs/phan-cong-brewlite.pdf](docs/phan-cong-brewlite.pdf). Lời nhắn commit ghi số task, ví dụ `feat(task-10): ...`; phần ngoài 10 task ghi `feat(mo-rong): ...`.

### 6.1 Theo 10 task của đề

| Task | Nội dung | Phụ trách |
|---|---|---|
| 1 | Khởi tạo dự án, cấu trúc, README, `.env.example` | Phan Thành Đạt |
| 2 | API sản phẩm `GET /products`, CSDL, dữ liệu mẫu | Nguyễn Tiến Đạt |
| 3 | Trang Menu | Nguyễn Tiến Đạt |
| 4 | Chi tiết và tuỳ chọn sản phẩm | Nguyễn Tiến Đạt |
| 5 | Giỏ hàng | Nguyễn Tiến Đạt |
| 6 | API tạo đơn `POST /orders` (báo giá từ máy chủ: Phan Thành Đạt) | Đinh Văn Đạt |
| 7 | Đăng ký / đăng nhập JWT, phân quyền | Phan Thành Đạt |
| 8 | Thanh toán không tiền mặt qua VNPay | Đinh Văn Đạt |
| 9 | Màn xác nhận, theo dõi đơn, hoá đơn (Văn Đạt); lịch sử đơn và giao dịch, docker-compose, demo (Thành Đạt) | Phan Thành Đạt, Đinh Văn Đạt |
| 10 | Máy trạng thái, tồn kho khi đặt đồng thời, huỷ đơn, tích điểm, test chứng minh (a)(b)(c) (Thành Đạt); thanh toán idempotent (Văn Đạt); luật mã giảm giá (Tiến Đạt) | Phan Thành Đạt, Đinh Văn Đạt, Nguyễn Tiến Đạt |

### 6.2 File phụ trách

Mỗi bạn phụ trách **tìm hiểu, trình bày khi vấn đáp, vẽ sơ đồ UML và review** phần dưới đây. Sửa vào phần của bạn khác thì nhắn trước và gắn bạn đó vào review. Đường dẫn tính từ thư mục `brewlite/`, riêng `.github/` và `docs/` nằm ở thư mục gốc repo.

| Thành viên | Nhánh | Backend | Frontend | Sơ đồ UML |
|---|---|---|---|---|
| Phan Thành Đạt | `main`, `feat/tai-khoan-diem`, `feat/bao-gia`, `feat/trang-thai-don`, `feat/lich-su-quan-ly-kiem-thu` | `backend/src/main.ts`, `app.*`, `src/prisma`, `src/common`, `src/auth`; `src/notifications`; `orders/order-state-machine.ts` (+ spec); trong `orders.service.ts`: trừ kho có kiểm tra `version`, `cancel`, `advance`, `quote`, `findMine`, `expireStale`; `orders/pricing.ts`, `orders/dto/quote-order.dto.ts`; lịch sử giao dịch trong `payments.service.ts`; `src/db-harden.ts`; `backend/test` | `frontend/app/layout.tsx`, `page.tsx`, `globals.css`, trang thông tin, `frontend/components/layout`, `ui`, `home`, `contact`, các file dùng chung trong `frontend/lib`; `frontend/app/login`, `register`, `account`, `frontend/components/auth`, `account`, `frontend/context/auth-context.tsx`, `frontend/lib/redeem.ts`; `frontend/lib/pricing.ts`, `quote.ts`; `frontend/app/orders/page.tsx`, `frontend/app/payments`, `OrdersList.tsx`, `PaymentHistory.tsx`; `NotificationBell.tsx`, `frontend/lib/notifications.ts`; `.github/`, Docker, `*.bat` | Use case tổng quát; sơ đồ triển khai |
| Nguyễn Tiến Đạt | `feat/san-pham-menu` | `backend/prisma`, `backend/src/seed.ts`, `backend/src/products`, `backend/src/promotions`; mở rộng: `backend/src/manage`, `backend/src/favorites` | `frontend/app/menu`, `frontend/app/product`, `frontend/components/menu`, `product`, `search`, `frontend/components/layout/CartDrawer.tsx`, `frontend/context/app-store.tsx`, `frontend/lib/products.ts`, `search.ts`, `fly-to-cart.ts` (giao diện cùng Phan Thành Đạt); mở rộng: `frontend/app/quan-ly` (tổng quan, thực đơn, mã giảm giá, nội dung), `frontend/components/manager`, `frontend/app/uu-dai`, `components/deals`, món yêu thích | Sơ đồ lớp toàn hệ thống; sơ đồ hoạt động từ đặt món đến nhận món |
| Đinh Văn Đạt | `feat/dat-mon`, `feat/vnpay` | `backend/src/orders`: `orders.controller.ts`, `orders.module.ts`, `dto/create-order.dto.ts`; trong `orders.service.ts`: `create`, `createInTx`, `findOne`; `backend/src/payments` (`vnpay/`, `dto/`, `client-ip.ts`); mở rộng: `backend/src/staff`, `backend/src/customers`, `backend/src/feedback`, `backend/src/inventory` | `frontend/app/checkout`, `frontend/app/orders/[id]`, `frontend/app/payment/vnpay-return`, `frontend/components/checkout`, `frontend/components/orders` (OrderTracking, OrderStatusPill, InvoiceModal), `VnpayReturn.tsx`, `frontend/lib/use-orders.ts`, `payments.ts`; mở rộng: `frontend/app/staff`, `frontend/components/staff`, `frontend/app/quan-ly` (khách hàng, phản hồi, nguyên liệu, nhập kho), `frontend/lib/inventory.ts` | Use case đặt món và thanh toán; sequence đặt món và thanh toán |

**Review chéo:** Nguyễn Tiến Đạt review pull request của Đinh Văn Đạt, Đinh Văn Đạt review của Phan Thành Đạt, Phan Thành Đạt review của Nguyễn Tiến Đạt.

### 6.3 Phần mở rộng (ngoài 10 task)

Đề ghi nhân viên quầy nằm ngoài phạm vi MVP, nhóm làm thêm như phần mở rộng.

| Chức năng | Phụ trách |
|---|---|
| Quầy pha chế: hàng đợi, chuyển bước, huỷ đơn đã trả có lý do | Đinh Văn Đạt |
| Kho nguyên liệu: phiếu nhập, công thức, trừ kho khi pha, cảnh báo quầy | Đinh Văn Đạt |
| Quản lý tài khoản khách (khoá, mở khoá có lý do), phản hồi khách | Đinh Văn Đạt |
| Khu quản lý: tổng quan doanh thu, thực đơn và giá, mã giảm giá, nội dung trang | Nguyễn Tiến Đạt |
| Trang ưu đãi, món yêu thích | Nguyễn Tiến Đạt |
| Tự huỷ đơn bỏ dở sau 30 phút, rào CSDL, chống dò mật khẩu | Phan Thành Đạt |

### 6.4 Rà soát code và kiểm thử

| Thành viên | Nhiệm vụ | Sản phẩm |
|---|---|---|
| Phan Thành Đạt | Rà soát toàn bộ code backend và frontend theo 10 task và Definition of Done; viết test chứng minh tiêu chí Task 10; kiểm thử luồng đúng, luồng sai (sai quyền, sai trạng thái, dữ liệu xấu) và đồng bộ giữa khách, quầy, quản lý; đo yêu cầu phi chức năng (API dưới 500ms) | Unit test (`npm test`), integration test trên CSDL thật (`npm run test:int`), bộ Thunder Client 91 request (`brewlite/thunder-client/`, chạy toàn bộ bằng `node brewlite/thunder-client/chay-thunder.mjs`) |
| Nguyễn Tiến Đạt | Review phần mình trong pull request; chạy Thunder Client các thư mục thực đơn, quản lý thực đơn và mã giảm giá, món yêu thích | Review trên GitHub, kết quả chạy test |
| Đinh Văn Đạt | Review phần mình trong pull request; chạy Thunder Client các thư mục đặt đơn và thanh toán, VNPay, quầy huỷ đơn, kho, khoá tài khoản khách; thử VNPay sandbox thành công, thất bại, huỷ giữa chừng | Review trên GitHub, kết quả chạy test |
