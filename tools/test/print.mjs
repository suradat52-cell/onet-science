// ตรวจ PDF ทุกแบบที่หน้าเว็บพิมพ์ได้: ต้องเป็นพื้นขาว ตัวหนังสือดำ ไม่มีพื้นหลังอวกาศ/การ์ดมืด/ปุ่ม/เมนู
//   node tools/test/print.mjs      (ต้องรัน tools/test/server.mjs ก่อน) · ใช้ขั้นตอนเตรียมพิมพ์ของหน้าเว็บจริง (prepPrintExam / prepPrintPage) แล้วสั่ง page.pdf ในโหมดสื่อ print
// เกณฑ์ต่อหน้า PDF: (1) แถบขอบ 6 มม. รอบหน้าเป็นสีขาวทั้งหมด (2) พิกเซลมืด (สว่าง < 0.30) ไม่เกิน 14% (ตัวหนังสือ/เส้น/ภาพสแกนเท่านั้น) (3) ไม่มีพื้นที่สีเข้มต่อเนื่องก้อนใหญ่
import puppeteer from "puppeteer-core";
import * as mupdf from "mupdf";
import fs from "fs";
import path from "path";
import { TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
const BASE = `http://localhost:${cfg.port}/`, OUT = path.join(TOOLS, ".cache", "print"); fs.mkdirSync(OUT, { recursive: true });
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  " + info)); };

function analyse(buf, maxPages = 40) {
  const doc = mupdf.Document.openDocument(buf, "application/pdf"), n = doc.countPages(), res = { pages: n, worst: { dark: 0, border: 1, blob: 0 } };
  for (let i = 0; i < Math.min(n, maxPages); i++) {
    const pix = doc.loadPage(i).toPixmap(mupdf.Matrix.scale(0.4, 0.4), mupdf.ColorSpace.DeviceGray, false, true), w = pix.getWidth(), h = pix.getHeight(), px = pix.getPixels();
    let dark = 0; const margin = Math.round(6 / 25.4 * 72 * 0.4); let bordN = 0, bordWhite = 0;
    const cell = 8, cols = Math.ceil(w / cell), rows = Math.ceil(h / cell), darkCells = new Uint8Array(cols * rows), tot = new Uint16Array(cols * rows);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = px[y * w + x] / 255, isD = v < 0.30; if (isD) dark++;
      const ci = Math.floor(y / cell) * cols + Math.floor(x / cell); tot[ci]++; if (isD) darkCells[ci]++;
      if (x < margin || y < margin || x >= w - margin || y >= h - margin) { bordN++; if (v > 0.97) bordWhite++; }
    }
    // ก้อนมืดต่อเนื่อง: นับเซลล์ 8x8 ที่มืด >85% ติดกันเป็นกลุ่ม แล้วดูกลุ่มใหญ่สุด
    const seen = new Uint8Array(cols * rows); let blob = 0;
    for (let c = 0; c < cols * rows; c++) { if (seen[c] || darkCells[c] < 0.85 * tot[c]) continue; let sz = 0; const st = [c]; seen[c] = 1; while (st.length) { const k = st.pop(); sz++; const x = k % cols, y = (k - x) / cols; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue; const kk = ny * cols + nx; if (!seen[kk] && darkCells[kk] >= 0.85 * tot[kk]) { seen[kk] = 1; st.push(kk); } } } blob = Math.max(blob, sz); }
    res.worst.dark = Math.max(res.worst.dark, dark / (w * h)); res.worst.border = Math.min(res.worst.border, bordWhite / bordN); res.worst.blob = Math.max(res.worst.blob, blob * cell * cell / (w * h));
  }
  return res;
}
const judge = (name, buf) => { const r = analyse(buf); t(`${name}: ${r.pages} หน้า พื้นขาว (ขอบขาว ${(r.worst.border * 100).toFixed(1)}% · พิกเซลมืดสูงสุด ${(r.worst.dark * 100).toFixed(1)}% · ก้อนมืดใหญ่สุด ${(r.worst.blob * 100).toFixed(1)}% ของหน้า)`, r.pages > 0 && r.worst.border > 0.995 && r.worst.dark < 0.14 && r.worst.blob < 0.02, JSON.stringify(r)); return r; };

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const page = await browser.newPage();
page.on("dialog", d => d.accept());
const click = async sel => { await page.waitForSelector(sel); await page.$eval(sel, b => b.click()); };
const idle = () => page.waitForNetworkIdle({ idleTime: 300 });
const toPdf = async name => { await page.emulateMediaType("print"); const buf = await page.pdf({ format: "A4", margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" }, printBackground: true }); await page.emulateMediaType(null); fs.writeFileSync(path.join(OUT, name), buf); return buf; };
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); // พิมพ์จากมือถือ (หน้าจอแคบ) เหมือนที่นักเรียนใช้จริง
await page.evaluateOnNewDocument(() => { window.__printCalls = 0; });
for (const lv of ["P6", "M3"]) {
  await page.goto(BASE, { waitUntil: "networkidle0" }); await page.evaluate(() => localStorage.clear()); await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.type("#cc", cfg.rooms[lv]); await click("#cf button"); await click('button[data-a="pick"]'); await page.waitForSelector(".scard");
  await page.evaluate(() => { window.print = () => { window.__printCalls++; }; }); // หน้าต่างพิมพ์จริงเปิดไม่ได้ในโหมดทดสอบ: เรียกขั้นเตรียมพิมพ์ของจริงแล้วข้ามตัว print
  // 1) สรุปเนื้อหา (มีภาพ SVG ตารางกล่องสี)
  await idle(); await page.evaluate(() => study("ว 2.3", "")); await page.waitForSelector(".sheet1"); await idle();
  await page.evaluate(() => ACT.pdf()); judge(`${lv} สรุปเนื้อหา ว 2.3`, await toPdf(`${lv}-summary.pdf`));
  // 2) ข้อสอบ (ก่อนส่ง) 3) ผลลัพธ์พร้อมเฉลยละเอียด
  await page.evaluate(() => { document.querySelector("#bnav [data-k=exams]").click(); }); await page.waitForSelector('button[data-a="year"]');
  await click('button[data-a="year"]'); await page.waitForSelector("#qcard");
  await page.evaluate(() => ACT.pdfexam()); judge(`${lv} ข้อสอบรายปี (ยังไม่ส่ง)`, await toPdf(`${lv}-exam.pdf`)); await page.evaluate(() => cleanupPrint());
  await page.evaluate(() => { Q.qs.forEach((q, i) => { if (q.type === "mc") Q.ans[q.id] = String(i % 4 + 1); }); }); await click('[data-a="sheet"]'); await click('#sheet [data-a="submit"]');
  await page.waitForFunction(() => /ได้ .*%/.test(document.querySelector("h2")?.textContent || ""), { timeout: 30000 }); await page.waitForFunction(() => document.querySelector('[data-a="sol"]'), { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => ACT.pdf()); judge(`${lv} ผลลัพธ์ + เฉลยละเอียด`, await toPdf(`${lv}-answers.pdf`));
  // 4) ฝึกรายมาตรฐาน ผลลัพธ์แบบฝึก (แสดงคะแนนต่อข้อ)
  await page.evaluate(() => quiz("practice", "ว 1.1", "")); await page.waitForSelector("#qcard");
  await click('[data-a="sheet"]'); await click('#sheet [data-a="submit"]'); await page.waitForFunction(() => /ได้ .*คะแนน/.test(document.querySelector("h2")?.textContent || ""), { timeout: 30000 });
  await page.evaluate(() => ACT.pdf()); judge(`${lv} ผลฝึกรายมาตรฐาน`, await toPdf(`${lv}-practice.pdf`));
}
// 5) รายงานของครู
await page.goto(BASE, { waitUntil: "networkidle0" }); await page.evaluate(() => localStorage.clear()); await page.goto(BASE, { waitUntil: "networkidle0" });
await page.evaluate(() => admin()); await page.type('#lg input[name="u"]', cfg.username); await page.type('#lg input[name="p"]', cfg.password); await page.$eval("#lg button", b => b.click());
await page.waitForSelector("#bnav.on"); await idle(); await click('#bnav [data-k="report"]'); await idle();
await page.evaluate(() => { window.print = () => {}; ACT.pdf(); }); judge("รายงานผลของครู", await toPdf("teacher-report.pdf"));
await browser.close();
process.exit(bad ? 1 : 0);
