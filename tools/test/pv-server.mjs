// เซิร์ฟเวอร์ทดสอบสำหรับ "หน้าทดลองที่สร้างแล้ว" (ผลจาก tools/build-preview.mjs --out=โฟลเดอร์) — ตรวจว่าไฟล์รวม/ย่อขนาดทำงานเหมือนต้นฉบับ
//   node tools/test/pv-server.mjs <โฟลเดอร์ preview ที่สร้างแล้ว> [พอร์ต=8794]   (ต้องรัน tools/test/server.mjs ที่ 8765 ไว้ก่อน)
//   /preview/*  → ไฟล์ในโฟลเดอร์ (แทน URL Apps Script ด้วย /api) · /api → ส่งต่อไปเซิร์ฟเวอร์จำลอง · อย่างอื่น (images/) → โฟลเดอร์งาน
import fs from "fs";
import http from "http";
import path from "path";
import { ROOT } from "../lib.mjs";

const dir = path.resolve(process.argv[2] || ""), PORT = +(process.argv[3] || 8794), MOCK = "http://localhost:8765";
if (!fs.existsSync(path.join(dir, "index.html"))) throw new Error("ไม่พบ index.html ใน " + dir);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };
http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api") {
    let b = ""; for await (const d of req) b += d;
    const r = await fetch(MOCK + "/api", { method: "POST", body: b }); res.writeHead(200, { "Content-Type": "application/json" }); return res.end(await r.text());
  }
  const u = decodeURIComponent(req.url.split("?")[0]);
  let f = u.startsWith("/preview/") ? path.join(dir, u.slice(9) || "index.html") : path.join(ROOT, u);
  if (u === "/preview/") f = path.join(dir, "index.html");
  if (!f.startsWith(dir) && !f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  let body = fs.readFileSync(f);
  if (path.basename(f) === "index.html" && f.startsWith(dir)) body = body.toString("utf8").replace(/const API_URL = '[^']*';/, "const API_URL = '/api';");
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(body);
}).listen(PORT, () => console.log("pv-server " + PORT));
