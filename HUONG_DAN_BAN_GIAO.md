# Hướng Dẫn Cài Đặt Hệ Thống Quản Lý Phòng Khám/Nhà Thuốc Trên Máy Khách Hàng

Tài liệu này hướng dẫn các bước để triển khai hệ thống (Source Code) trực tiếp lên máy tính của khách hàng để biến máy khách hàng thành một máy chủ (Server) nội bộ.

## Yêu cầu hệ thống ban đầu
- Máy tính chạy hệ điều hành Windows (Windows 10/11).
- Có kết nối Internet (để tải thư viện trong lần đầu setup).
- Đã cài đặt phần mềm **Node.js** (Rất quan trọng).

---

## BƯỚC 1: Cài Đặt Node.js (Nếu máy khách chưa có)
1. Truy cập trang chủ Node.js: [https://nodejs.org](https://nodejs.org)
2. Tải phiên bản **LTS** (Ví dụ: v20.x.x LTS hoặc mới nhất).
3. Chạy file vừa tải về và cứ bấm **Next** cho đến khi cài đặt hoàn tất (khi hỏi có cài Chocolatey/công cụ phụ không thì có thể bỏ qua).

---

## BƯỚC 2: Copy Source Code Vào Máy
1. Copy toàn bộ thư mục dự án `pharmacy-fullstack-project` (đã nén hoặc qua USB) vào máy tính của khách hàng (Nên để ở một ổ như `D:\Pharmacy` hoặc `C:\Pharmacy` để dễ tìm, tránh để ở Desktop dễ bị xóa nhầm).
2. Giải nén (nếu là file zip).

---

## BƯỚC 3: Cài Đặt Thư Viện Lần Đầu (Chỉ cần làm 1 lần duy nhất)
Vì source code bạn gửi qua thường không bao gồm thư mục `node_modules` (do dung lượng lớn và phải tương thích riêng với máy khách), máy khách hàng cần tải thư viện về.

*Mình (AI) đã tạo sẵn file **`1-SETUP_LAN_DAU.bat`** trong thư mục. Khách hàng chỉ cần:*
1. Click đúp chuột vào file **`1-SETUP_LAN_DAU.bat`**.
2. Đợi máy tính tự động tải thư viện (Màn hình đen CMD chạy % và download). 
3. Khi nào hiện thông báo "Hoan tat cai dat", ấn phím bất kỳ để tắt là xong.

---

## BƯỚC 4: Khởi Chạy Hệ Thống Hàng Ngày
Mỗi khi khởi động lại máy tính hoặc muốn sử dụng hệ thống, khách hàng chỉ cần khởi chạy Server giống như cách bạn đang làm:

1. Click đúp chuột vào file **`START_PHARMACY.bat`**.
2. Đợi khoảng 15-30 giây để hệ thống khởi động. Một cửa sổ sẽ hiện lên địa chỉ dạng: `https://xxxx-xxxx-xxxx.trycloudflare.com`.
3. Khách hàng có thể truy cập vào đường link này từ **bất cứ đâu** (điện thoại, máy tính ở nhà) mà không cần chung mạng WiFi.

---

## BƯỚC 5: Truy cập trên máy (Lựa chọn 2 - Chỉ dùng trong mạng nội bộ)
Nếu khách hàng không muốn dùng link công khai (Cloudflare) mà chỉ muốn dùng trong hiệu thuốc qua mạng WiFi:
1. Click đúp chuột vào file **`2-START_LOCAL.bat`**.
2. Truy cập địa chỉ: `http://localhost:3000` (trên chính máy đó) hoặc `http://192.168.1.xxx:3000` (trên các máy cùng mạng WiFi).

---

---

## BƯỚC 7: Kết nối với Tài khoản MongoDB mới (Khi muốn dùng Database riêng)
Để khách hàng có thể hoàn toàn chủ động dữ liệu trên tài khoản của họ, hãy hướng dẫn họ làm theo các bước sau:

### 1. Tạo tài khoản và Cluster trên MongoDB Atlas
*   Đăng ký tài khoản tại [mongodb.com/atlas](https://www.mongodb.com/atlas).
*   Tạo một **Cluster** mới (chọn gói **FREE**).
*   Tại mục **Database Access**: Tạo một User (đặt tên và mật khẩu, ví dụ: `admin/123456`).
*   Tại mục **Network Access**: Nhấn **Add IP Address** -> Chọn **Allow Access From Anywhere** (địa chỉ `0.0.0.0/0`) để có thể kết nối từ mọi mạng.

### 2. Lấy chuỗi kết nối (Connection String)
*   Tại màn hình Cluster, nhấn nút **Connect**.
*   Chọn **Drivers** -> Node.js.
*   Copy chuỗi có dạng: `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority`

### 3. Cập nhật vào hệ thống
*   Vào thư mục dự án -> vào tiếp thư mục **`backend`**.
*   Tìm file có tên là **`.env`**, click phải chọn Open with Notepad.
*   Thay dòng `MONGODB_URI=...` bằng chuỗi vừa copy ở Bước 2.
*   **Lưu ý:** Hãy thay cụm `<password>` bằng mật khẩu thật bạn đã tạo ở Bước 1 (phần Database Access).
*   Lưu file lại và khởi động lại phần mềm qua file `START_PHARMACY.bat`.

---

## LƯU Ý QUAN TRỌNG KHI BÀN GIAO
*   **Internet:** Máy chủ cần có mạng ổn định để lưu dữ liệu lên Cloud (MongoDB Atlas).
*   **Nén file:** Trước khi gửi file cho khách, bạn hãy xóa thư mục `node_modules` ở cả `frontend` và `backend` để file nén nhẹ nhất (chỉ còn vài MB). Khách hàng sẽ dùng file `1-SETUP_LAN_DAU.bat` để tự cài lại thư viện.

