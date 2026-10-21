// สร้างหน้าทดลอง /preview/ จากโฟลเดอร์งาน → <deploy>/preview/  (ไม่แตะไฟล์อื่นของ repo deploy · ไม่แตะเว็บหลัก)
//   node tools/build-preview.mjs [--dir=โฟลเดอร์ deploy] [--out=โฟลเดอร์ปลายทางอื่น (ทดสอบ)]
// หน้าทดลองต่างจากเว็บหลักเฉพาะ: URL ของ Apps Script ชุดทดลอง (tools/preview.config.json) · ที่เก็บในเครื่องชื่อ pv.* · รูปข้อสอบอ้าง ../images/ (ไม่ซ้ำสำเนา 18 MB)
//   · noindex · ป้าย "หน้าทดลอง" · PWA (service worker + manifest) เปิดใช้
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import esbuild from "esbuild";
import { ROOT } from "./lib.mjs";
import { buildContent } from "./build-content.mjs";

const args = process.argv.slice(2), flag = n => args.find(a => a.startsWith("--" + n + "="))?.slice(n.length + 3);
const deploy = path.resolve(flag("dir") || path.join(os.homedir(), "onet-science-deploy"));
export const OUT = path.resolve(flag("out") || path.join(deploy, "preview"));
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "preview.config.json"), "utf8"));
if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(cfg.api)) throw new Error("preview.config.json: api ไม่ถูกต้อง");
if (cfg.api.includes("AKfycbx6hs29CHXPQGAgLKR8goORieF0l8cSI_9WXuOsblbhCmi5SEejDTF8lvf1ESR-aNxS")) throw new Error("ปฏิเสธ: หน้าทดลองห้ามใช้ URL ของ Apps Script ตัวจริง");
if (path.basename(OUT) !== "preview" && !flag("out")) throw new Error("ปลายทางต้องเป็นโฟลเดอร์ preview/");

fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const cp = rel => { const s = path.join(ROOT, rel), d = path.join(OUT, rel); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); };
const walk = (rel, ext) => { for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) { const r = rel + "/" + e.name; if (e.isDirectory()) walk(r, ext); else if (!ext || ext.test(e.name)) cp(r); } };
["manifest.webmanifest"].forEach(cp);
walk("icons", /[.](png|svg)$/);
// รวมสคริปต์เป็นไฟล์เดียว + ย่อขนาด + ฝัง CSS ใน index.html: ลดจำนวนคำขอบนเส้นทางโหลดแรก (วัดด้วย Lighthouse จำลอง 4G ช้า: LCP 3.4 → ~1.7 วินาที)
// ลำดับสคริปต์ตามแท็ก <script defer src> ใน index.html (ทุกไฟล์ใช้ตัวแปรร่วมระดับบนสุด จึงต่อกันได้ตรง ๆ)
const srcHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const ORDER = [...srcHtml.matchAll(/<script defer src="([^"]+)"><[/]script>/g)].map(m => m[1]);
if (ORDER.length < 8) throw new Error("ไม่พบแท็ก <script defer src> ใน index.html");
const minJs = f => esbuild.transformSync(fs.readFileSync(path.join(ROOT, f), "utf8"), { minify: true, charset: "utf8" }).code;
const appJs = ORDER.map(minJs).join(";\n");
fs.writeFileSync(path.join(OUT, "app.js"), appJs);
const appCss = esbuild.transformSync(fs.readFileSync(path.join(ROOT, "app.css"), "utf8"), { loader: "css", minify: true, charset: "utf8" }).code;
fs.mkdirSync(path.join(OUT, "figs"), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, "figs")).filter(x => x.endsWith(".js"))) fs.writeFileSync(path.join(OUT, "figs", f), minJs("figs/" + f));
const bc = buildContent(path.join(OUT, "content"));
// หมายเลขรุ่น: ผูกกับเนื้อหา + โค้ด → เปลี่ยนแล้ว service worker อัปเดตเอง
const h = crypto.createHash("sha1"); for (const f of ["index.html", "sw.js"]) h.update(fs.readFileSync(path.join(ROOT, f))); h.update(appJs); h.update(appCss); h.update(bc.rev);
const ver = h.digest("hex").slice(0, 10);
const swSrc = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8"), shellRe = /const SHELL = [[][^\]]*[\]];/;
if (!shellRe.test(swSrc)) throw new Error("sw.js: ไม่พบรายการ SHELL");
fs.writeFileSync(path.join(OUT, "sw.js"), swSrc.replace("__VER__", ver).replace(shellRe, "const SHELL = ['./', 'index.html', 'app.js', 'figs/P6.js', 'figs/M3.js', 'manifest.webmanifest', 'icons/icon-192.png'];"));

let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const rep = (a, b) => { if (!html.includes(a)) throw new Error("index.html: ไม่พบ " + a.slice(0, 40)); html = html.replace(a, b); };
rep("const PREVIEW = false, IMG_BASE = 'images/', PWA = false;", "const PREVIEW = true, IMG_BASE = '../images/', PWA = true;");
html = html.replace(/const API_URL = '[^']*';/, `const API_URL = '${cfg.api}';`);
rep('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow">');
rep("<title>ติว O-NET วิทยาศาสตร์ ป.6 · ม.3</title>", "<title>ติว O-NET วิทยาศาสตร์ ป.6 · ม.3 (หน้าทดลอง)</title>");
rep('<body class="lv-P6">', '<body class="lv-P6"><div class="pvbadge" role="note" aria-label="นี่คือหน้าทดลอง">หน้าทดลอง</div>');
rep('<link rel="stylesheet" href="app.css">', "<style>" + appCss + "</style>");
html = html.replace(/<script defer src="[^"]+"><[/]script>\n?/g, "").replace("</body>", '<script defer src="app.js"></script>\n</body>');
fs.writeFileSync(path.join(OUT, "index.html"), html);
console.log(`สร้างหน้าทดลองที่ ${OUT} · ${bc.nFiles} ไฟล์เนื้อหา · รุ่น ${ver} · API ${cfg.api.slice(0, 55)}…`);
