# Ôn Tập Kì 5

Web ôn tập trắc nghiệm kì 5, gộp nhiều môn trong một trang: https://wunecutee.github.io/on-tap-ki-5/

| Mã môn | Tên môn | Số câu |
| --- | --- | --- |
| DSR301 | Data Science with R | 262 |
| DPL302 | Deep Learning | 252 |

- Vào trang sẽ hỏi tên, sau đó chọn mã môn. Tiến trình mỗi môn được lưu riêng theo tên.
- Mỗi câu hiển thị đúng ảnh cắt từ slide (câu hỏi và các đáp án), đáp án đã được kiểm tra lại.
- Trả lời xong hiện giải thích và mẹo nhớ; trả lời đúng thì tự chuyển câu sau 2 giây.
- Nút **Học câu sai & chưa học** bỏ qua các câu đã trả lời đúng.
- Nút **Xoá tiến trình môn này** để học lại từ đầu.
- Có trộn câu, lọc theo chủ đề, hỏi lại câu sai cuối lượt, chuỗi câu đúng và thống kê sau mỗi lượt.

## Cấu trúc

| File | Nội dung |
| --- | --- |
| `index.html` | Toàn bộ giao diện và logic |
| `data/dsr301.js`, `data/dpl302.js` | Câu hỏi từng môn (ảnh WebP nhúng sẵn, đáp án, giải thích, mẹo), chỉ tải khi chọn môn |
| `config.js` | Địa chỉ Worker để đồng bộ tiến trình (để trống = chỉ lưu trên trình duyệt) |
| `worker/worker.js` | Cloudflare Worker ghi tiến trình thành `progress/<ten>.json` trên nhánh `progress` |

## Lưu tiến trình lên GitHub (tuỳ chọn)

Trang tĩnh trên GitHub Pages không được phép tự ghi vào repo, vì muốn ghi phải có token, mà token nằm trong trang public thì ai cũng lấy được. Vì vậy việc ghi đi qua một Cloudflare Worker miễn phí; token chỉ nằm trong Worker.

Mỗi người học sẽ có một file `progress/<ten-khong-dau>.json` trên nhánh **`progress`** của repo. Nhánh này tách riêng để mỗi lần lưu không làm GitHub Pages build lại.

1. **Tạo token GitHub**: Settings → Developer settings → Personal access tokens → *Fine-grained tokens* → Generate new token.
   - Repository access: *Only select repositories* → chọn repo này.
   - Permissions → Repository permissions → **Contents: Read and write**.
2. **Tạo Worker**: vào [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → Worker → đặt tên (ví dụ `dsr301-progress`) → Deploy → **Edit code**, dán toàn bộ `worker/worker.js` → Deploy.
3. **Cấu hình Worker** (Settings → Variables and Secrets):
   - `GITHUB_TOKEN` (kiểu *Secret*): token ở bước 1
   - `REPO`: `username/ten-repo`
   - `BRANCH`: `progress`
   - `ALLOWED_ORIGIN`: `https://username.github.io`
4. **Bật đồng bộ**: sửa `config.js` thành
   `window.DSR_SYNC_URL = "https://dsr301-progress.<tai-khoan>.workers.dev";` rồi commit và push.

Khi chưa làm các bước trên, trang vẫn chạy bình thường và lưu tiến trình theo tên trên trình duyệt đang dùng.

> Lưu ý: tên là cách nhận diện duy nhất, nên hai người nhập trùng tên sẽ dùng chung một tiến trình.
