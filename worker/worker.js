// Cloudflare Worker: đọc/ghi tiến trình học của từng người thành file JSON trong repo GitHub.
//   GET  /progress/<ten>  → trả về progress/<ten>.json (404 nếu chưa có)
//   PUT  /progress/<ten>  → ghi đè progress/<ten>.json (tạo commit trên nhánh BRANCH)
//
// Biến môi trường cần đặt trong Cloudflare (Settings → Variables and Secrets):
//   GITHUB_TOKEN   (Secret)  fine-grained token, chỉ repo này, quyền Contents: Read and write
//   REPO                     "username/ten-repo"
//   BRANCH                   nhánh lưu tiến trình, mặc định "progress"
//   ALLOWED_ORIGIN           "https://username.github.io" (domain của trang web)

const MAX_BYTES = 300_000;

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    const m = new URL(req.url).pathname.match(/^\/progress\/([a-z0-9-]{1,40})$/);
    if (!m) return json({ error: "not found" }, 404, cors);
    if (!env.GITHUB_TOKEN || !env.REPO) return json({ error: "worker chưa được cấu hình" }, 500, cors);

    const branch = env.BRANCH || "progress";
    const api = `https://api.github.com/repos/${env.REPO}/contents/progress/${m[1]}.json`;
    const gh = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "dsr301-progress-worker",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (req.method === "GET") {
      const r = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers: gh });
      if (r.status === 404) return json({ error: "none" }, 404, cors);
      if (!r.ok) return json({ error: `github ${r.status}` }, 502, cors);
      const file = await r.json();
      return new Response(fromB64(file.content || ""), {
        headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    if (req.method === "PUT") {
      const body = await req.text();
      if (body.length > MAX_BYTES) return json({ error: "quá lớn" }, 413, cors);
      let data;
      try { data = JSON.parse(body); } catch { return json({ error: "JSON không hợp lệ" }, 400, cors); }
      if (!data || typeof data !== "object" || typeof data.hist !== "object") return json({ error: "sai định dạng" }, 400, cors);

      // Lấy sha của file hiện tại (nếu có) để ghi đè; thử lại 1 lần nếu bị xung đột.
      for (let attempt = 0; attempt < 2; attempt++) {
        const cur = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers: gh });
        const sha = cur.ok ? (await cur.json()).sha : undefined;
        const r = await fetch(api, {
          method: "PUT",
          headers: { ...gh, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `progress: ${m[1]}`,
            content: toB64(JSON.stringify(data, null, 1)),
            branch,
            ...(sha ? { sha } : {}),
          }),
        });
        if (r.ok) return json({ ok: true }, 200, cors);
        if (r.status !== 409 && r.status !== 422) return json({ error: `github ${r.status}` }, 502, cors);
      }
      return json({ error: "xung đột, thử lại sau" }, 409, cors);
    }

    return json({ error: "method not allowed" }, 405, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
}
function toB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function fromB64(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
