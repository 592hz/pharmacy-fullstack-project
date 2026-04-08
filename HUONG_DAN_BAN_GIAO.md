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

## LƯU Ý
- Hai cửa sổ màn hình đen (CMD của Backend và Frontend) **phải luôn được bật** thì phần mềm mới hoạt động. Có thể thu nhỏ nó xuống thanh Taskbar (Minimize) chứ không được bấm dấu "X" để tắt. Khi nào hết giờ làm việc mới được tắt đi.
- Database (CSDL) hiện tại của bạn đang nằm trên **MongoDB Atlas** (Cloud), vì vậy khách hàng cần có mạng Internet để phần mềm gọi và lưu dữ liệu. Nếu mất mạng, hệ thống sẽ báo lỗi không lấy được dữ liệu.
