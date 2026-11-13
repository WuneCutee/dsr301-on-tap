# DSR301 Ôn Tập

Web ôn tập 262 câu trắc nghiệm môn **DSR301 (Data Science with R)**, theo kiểu Quizlet:

- Mỗi câu hiển thị đúng ảnh cắt từ slide (câu hỏi và các đáp án), đáp án đã được kiểm tra lại.
- Trả lời xong sẽ hiện giải thích và mẹo nhớ; câu làm sai được hỏi lại ở cuối lượt.
- Có trộn câu, lọc theo chủ đề, chế độ "chỉ câu đang sai", chuỗi câu đúng liên tiếp và thống kê sau mỗi lượt.
- Lần đầu vào trang sẽ hỏi tên. **Tiến trình học được lưu theo tên.**

## Cấu trúc

| File | Nội dung |
| --- | --- |
| `index.html` | Toàn bộ giao diện và logic |
| `questions.js` | 262 câu (ảnh WebP nhúng sẵn, đáp án, giải thích, mẹo) |
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
