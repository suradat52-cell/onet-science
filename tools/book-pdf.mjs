// สร้างเล่มติวเป็น PDF จริงด้วย Chrome แล้วนับหน้า (ใช้ปรับ BOOK_CFG ให้ไม่เกิน 100 หน้า และตรวจหน้าตา)
//   node tools/book-pdf.mjs [P6|M3] [main|ans] [ชื่อโรงเรียน]    (ต้องรัน tools/test/server.mjs ก่อน) ผล: tools/.cache/book/<ระดับ>-<ชนิด>.pdf
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import * as mupdf from "mupdf";
import { TOOLS, BLOCK_REAL_API } from "./lib.mjs";

const [lv = "P6", kind = "main", school = "โรงเรียนตัวอย่างวิทยา"] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), OUT = path.join(TOOLS, ".cache", "book"); fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: BLOCK_REAL_API });
const p = await b.newPage(); p.on("pageerror", e => console.log("JS error:", e.message));
await p.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" });
const r = await p.evaluate(async (lv, school, kind) => {
  const x = await bookBuild(lv, school, kind); let d = document.getElementById("bookdoc"); if (d) d.remove();
  d = document.createElement("div"); d.id = "bookdoc"; d.innerHTML = x.html; document.body.appendChild(d);
  document.documentElement.style.setProperty("--bkhead", JSON.stringify(school + " · " + x.title)); document.body.classList.add("print-book");
  await Promise.all([...d.querySelectorAll("img")].map(i => { i.loading = "eager"; return i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }); })); await bookJpeg(d); fitFigures(d);
  return { n: x.n, title: x.title };
}, lv, school, kind);
await p.emulateMediaType("print");
const file = path.join(OUT, `${lv}-${kind}.pdf`);
await p.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
await b.close();
const d = mupdf.Document.openDocument(fs.readFileSync(file), "application/pdf"), pages = d.countPages();
console.log(`${lv} ${kind}: ${r.n} ข้อ · ${pages} หน้า · ${(fs.statSync(file).size / 1e6).toFixed(1)} MB → ${file}`);
if (process.argv.includes("--png")) for (const i of [0, 1, 2, 5, Math.floor(pages / 2), pages - 1]) { if (i >= pages) continue; const px = d.loadPage(i).toPixmap(mupdf.Matrix.scale(0.9, 0.9), mupdf.ColorSpace.DeviceRGB, false, true); fs.writeFileSync(path.join(OUT, `${lv}-${kind}-p${i + 1}.png`), px.asPNG()); }
