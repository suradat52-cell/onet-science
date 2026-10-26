// เล่มติวพิมพ์ได้ (สรุป + โจทย์ / เฉลย) ป.6 และ ม.3: เล่ม 1 ไม่เกิน 100 หน้า A4 (นับจาก PDF จริงที่ Chrome พิมพ์) · เนื้อหาไม่มี markup หลุด · เฉลยตรงโจทย์ทุกข้อ
// · ครบทุกตัวชี้วัดที่เคยออก · ปกมีชื่อโรงเรียน · เฉพาะแอดมินเห็นปุ่ม (นักเรียนไม่เห็น) · ชื่อโรงเรียนใส่ให้อัตโนมัติ
//   node tools/test/book.mjs   (ต้องรัน tools/test/server.mjs ก่อน)
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import * as mupdf from "mupdf";
import { ROOT, TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = `http://localhost:${cfg.port}`;
const OUT = path.join(TOOLS, ".cache", "book"); fs.mkdirSync(OUT, { recursive: true });
const MAX_PAGES = 100, SAFE = 95; // เผื่อฟอนต์ต่างเครื่อง
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + String(info).slice(0, 220))); };
const raw = async (action, p = {}) => (await fetch(BASE + "/api", { method: "POST", body: JSON.stringify({ action, ...p }) })).json();
const browser = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
try {
  const page = await browser.newPage(); await page.setViewport({ width: 1100, height: 900 });
  const errs = []; page.on("pageerror", e => errs.push(e.message)); page.on("dialog", d => d.accept());
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  const school = "โรงเรียนทดสอบวิทยา";
  for (const lv of ["P6", "M3"]) {
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, "content", lv, "meta.json"), "utf8"));
    const R = await page.evaluate(async (lv, school) => {
      const a = await bookBuild(lv, school, "main"), b = await bookBuild(lv, school, "ans"), d = document.createElement("div"); d.innerHTML = a.html;
      const qn = [...d.querySelectorAll(".bq-n")].map(x => +x.textContent), src = [...d.querySelectorAll(".bq-src")].map(x => x.textContent);
      const e = document.createElement("div"); e.innerHTML = b.html; const an = [...e.querySelectorAll(".bk-grid b")].map(x => +x.textContent);
      const txt = d.innerText + " " + e.innerText;
      return { n: a.n, nb: b.n, qn, src, an, cover: d.querySelector(".bk-cover").textContent, coverB: e.querySelector(".bk-cover").textContent, leak: (txt.match(/.{0,25}(\*\*|\[\[|@@|undefined|NaN|\[object|\n(\?\?|!!|tr:|kc:|ex:|th:|an:) ).{0,25}/g) || []).slice(0, 3), tocSum: [...d.querySelectorAll(".bk-toc li span")].reduce((s, x) => s + +x.textContent.replace(/\D/g, ""), 0), imgs: d.querySelectorAll("img.bq-img").length, h2: [...d.querySelectorAll(".bk-body>.bk-band")].length };
    }, lv, school);
    t(`${lv}: เล่ม 1 มีโจทย์ ${R.n} ข้อ เลขข้อเรียง 1..${R.n} ไม่ข้าม ไม่ซ้ำ`, R.n > 50 && R.qn.length === R.n && R.qn.every((x, i) => x === i + 1), R.qn.slice(0, 5));
    t(`${lv}: ไม่มีข้อซ้ำในเล่ม (ปี/ข้อ)`, new Set(R.src.map(s => s.split(" · ")[0])).size === R.n);
    t(`${lv}: เฉลยตรงโจทย์ ทุกข้อมีเฉลยย่อ ลำดับเดียวกัน (${R.an.length} ข้อ)`, R.nb === R.n && R.an.length === R.n && R.an.every((x, i) => x === i + 1));
    const cited = new Set(R.src.map(s => s.split(" · ").pop())), askedInd = Object.values(meta.asked).flatMap(o => Object.keys(o));
    t(`${lv}: ครอบคลุมทุกตัวชี้วัดที่เคยออกสอบ (${askedInd.length} ตัว)`, askedInd.every(i => cited.has(i)), askedInd.filter(i => !cited.has(i)).join(","));
    t(`${lv}: สารบัญรวมจำนวนโจทย์ตรงกับในเล่ม`, R.tocSum === R.n, R.tocSum + " vs " + R.n);
    t(`${lv}: ปกมีชื่อโรงเรียน ชื่อเล่ม และที่มา สทศ. (ทั้งสองเล่ม)`, R.cover.includes(school) && R.cover.includes("สทศ") && R.coverB.includes(school) && R.coverB.includes("เฉลย"));
    t(`${lv}: ไม่มี markup หลุด/undefined/NaN`, !R.leak.length, R.leak.join(" | "));
    // พิมพ์ PDF จริง
    for (const kind of ["main", "ans"]) {
      const f = path.join(OUT, `${lv}-${kind}.pdf`);
      await page.evaluate(async (lv, school, kind) => { const x = await bookBuild(lv, school, kind); let d = document.getElementById("bookdoc"); if (d) d.remove(); d = document.createElement("div"); d.id = "bookdoc"; d.innerHTML = x.html; document.body.appendChild(d); document.documentElement.style.setProperty("--bkhead", JSON.stringify(school + " · " + x.title)); document.body.classList.add("print-book"); await Promise.all([...d.querySelectorAll("img")].map(i => { i.loading = "eager"; return i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }); })); await bookJpeg(d); fitFigures(d); }, lv, school, kind);
      await page.emulateMediaType("print"); await page.pdf({ path: f, preferCSSPageSize: true, printBackground: true }); await page.emulateMediaType(null);
      await page.evaluate(() => bookCleanup());
      const doc = mupdf.Document.openDocument(fs.readFileSync(f), "application/pdf"), pages = doc.countPages(), mb = fs.statSync(f).size / 1e6;
      if (kind === "main") t(`${lv}: เล่ม 1 (สรุป + โจทย์) ${pages} หน้า ไม่เกิน ${MAX_PAGES} (เผื่อไว้ ≤ ${SAFE})`, pages <= SAFE, pages);
      else t(`${lv}: เล่ม 2 (เฉลย) ${pages} หน้า`, pages >= 5 && pages <= 80, pages);
      t(`${lv}: ไฟล์ PDF ${kind} ขนาด ${mb.toFixed(1)} MB (ไม่ใหญ่เกิน 25 MB)`, mb < 25);
      const p1 = doc.loadPage(0).toStructuredText().asText();
      t(`${lv}: หน้าปก PDF ${kind} มีชื่อโรงเรียน`, p1.replace(/\s/g, "").includes(school.replace(/\s/g, "")));
      const pgs = [...Array(pages).keys()].map(i => doc.loadPage(i).toStructuredText().asText().length);
      t(`${lv}: PDF ${kind} ไม่มีหน้าว่าง/แทบว่าง (กระดาษไม่เปลือง)`, pgs.slice(1, -1).every(n => n > 120), pgs.map((n, i) => n <= 120 ? i + 1 : 0).filter(Boolean).join(","));
    }
  }
  /* สิทธิ์ + หน้าแอดมิน */
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await page.type("#cc", cfg.rooms.P6); await page.$eval("#cf", f => f.requestSubmit()); await page.waitForSelector(".pickgrid button"); await page.$eval(".pickgrid button", b => b.click());
  await page.waitForFunction(() => S.student); await new Promise(r => setTimeout(r, 1500));
  t("นักเรียนไม่เห็นปุ่มพิมพ์เล่ม/ส่วนพิมพ์เล่มในหน้าใด ๆ ของนักเรียน", await page.evaluate(async () => { for (const k of ["home", "exams", "learn", "review", "mine"]) { await run(() => ACT.nav({ kind: "s", k })); await new Promise(r => setTimeout(r, 600)); if (/พิมพ์เล่มติว|data-a="bookmain"/.test(document.getElementById("app").innerHTML)) return false; } return true; }));
  const sup = (await raw("login", { username: cfg.username, password: cfg.password })).data.token;
  await raw("saveAdmin", { token: sup, username: "bookadm", password: "bookpass12", role: "school", schoolId: cfg.schoolId });
  await page.evaluate(() => { S.token = null; S.student = null; save(); admin(); }); await page.waitForSelector("#lg");
  await page.type("#lg [name=u]", "bookadm"); await page.type("#lg [name=p]", "bookpass12"); await page.$eval("#lg", f => f.requestSubmit());
  await page.waitForSelector("#bnav [data-k=more]"); await page.$eval("#bnav [data-k=more]", b => b.click()); await page.waitForSelector("#bk-s");
  t("แอดมินโรงเรียนเห็นส่วนพิมพ์เล่ม และชื่อโรงเรียนถูกใส่ให้เอง", await page.$eval("#bk-s", i => i.value.length > 3), await page.$eval("#bk-s", i => i.value));
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; window.__bd = !!document.getElementById("bookdoc") && document.body.classList.contains("print-book"); window.__cover = document.querySelector("#bookdoc .bk-sch")?.textContent; }; });
  await page.$eval("#bk-s", i => { i.value = "โรงเรียนพิมพ์ทดสอบ"; }); await page.select("#bk-l", "M3"); await page.$eval("[data-a=bookmain]", b => b.click());
  await page.waitForFunction(() => window.__printed === 1, { timeout: 120000 });
  t("กดพิมพ์เล่ม 1 → ประกอบเล่มแล้วสั่งพิมพ์ ปกมีชื่อโรงเรียนที่กรอก", await page.evaluate(() => window.__bd && window.__cover === "โรงเรียนพิมพ์ทดสอบ"));
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  t("พิมพ์เสร็จแล้วเก็บกวาด (ไม่ค้างเล่มในหน้า)", await page.evaluate(() => !document.getElementById("bookdoc") && !document.body.classList.contains("print-book")));
  await page.$eval("[data-a=bookans]", b => b.click()); await page.waitForFunction(() => window.__printed === 2, { timeout: 120000 });
  t("กดพิมพ์เล่ม 2 (เฉลย) ได้", await page.evaluate(() => /เฉลย/.test(document.querySelector("#bookdoc .bk-cover h1")?.textContent || "")));
  t("ไม่มี JS error", !errs.length, errs.slice(0, 2).join(" | "));
} finally { await browser.close(); }
console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
