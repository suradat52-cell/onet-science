// ถ่ายภาพหน้าจอมือถือ 390 px ของทุกหน้า (ป.6 และ ม.3) + ตรวจความเปรียบต่างของตัวหนังสือทุกหน้า + ตรวจขนาดปุ่ม/เลื่อนแนวนอน
//   node tools/test/ui-shots.mjs [พอร์ต=8765] [โฟลเดอร์ออก=design/final]      (ต้องรัน tools/test/server.mjs ก่อน)
// ผล: <โฟลเดอร์ออก>/<ระดับ>-<ลำดับ>-<ชื่อหน้า>.png · report.json · สรุปในหน้าจอ
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { ROOT, TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
const BASE = `http://localhost:${process.argv[2] || cfg.port}/`, OUT = path.resolve(process.argv[3] || path.join(ROOT, "design", "final"));
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (/\.png$/.test(f)) fs.unlinkSync(path.join(OUT, f));
const VW = 390, VH = 844;
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const page = await browser.newPage();
await page.setViewport({ width: VW, height: VH, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
page.on("dialog", d => d.accept());
const errs = []; page.on("pageerror", e => errs.push(e.message));
const idle = () => page.waitForNetworkIdle({ idleTime: 300 });
const click = async sel => { await page.waitForSelector(sel); await page.$eval(sel, b => b.click()); await idle(); };
const evalc = async (fn, ...a) => { const r = await page.evaluate(fn, ...a); await idle(); return r; };
const loadImgs = () => page.evaluate(async () => { for (const i of document.images) { i.scrollIntoView(); if (!i.complete) await new Promise(r => { i.onload = i.onerror = r; }); } window.scrollTo(0, 0); });
const report = [];

/* ตรวจตัวหนังสือทุกชิ้นในหน้า: อัตราส่วนความเปรียบต่างกับพื้นหลังจริง (ผสมพื้นโปร่งใสทับกันขึ้นมาจนถึงพื้นทึบ) */
const scan = () => page.evaluate(() => {
  const parse = c => (c.match(/[\d.]+/g) || [0, 0, 0, 1]).map(Number);
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0.05; };
  const bgOf = el => { const layers = []; for (let e = el; e; e = e.parentElement) { const [r, g, b, a = 1] = parse(getComputedStyle(e).backgroundColor); if (a > 0) layers.push([r, g, b, a]); if (a >= 0.99) break; } let [r, g, b] = [11, 18, 54]; for (const [lr, lg, lb, la] of layers.reverse()) { r = lr * la + r * (1 - la); g = lg * la + g * (1 - la); b = lb * la + b * (1 - la); } return [r, g, b]; };
  const bad = [];
  document.querySelectorAll("body *").forEach(el => {
    if (!vis(el) || el.closest("[disabled],.devsw,svg,#printq")) return;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    if (el.closest("figure")) return;
    const cs = getComputedStyle(el), c = parse(cs.color), bg = bgOf(el), a = c[3] === undefined ? 1 : c[3];
    const fg = [c[0] * a + bg[0] * (1 - a), c[1] * a + bg[1] * (1 - a), c[2] * a + bg[2] * (1 - a)];
    const l1 = L(fg), l2 = L(bg), ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
    if (ratio < (big ? 3 : 4.5)) bad.push({ t: el.textContent.trim().slice(0, 28), ratio: +ratio.toFixed(2), fs: cs.fontSize });
  });
  return bad;
});
async function shot(lv, n, name, o = {}) {
  await loadImgs(); await page.evaluate(() => document.fonts.ready);
  const m = await page.evaluate(DW => {
    const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    const ctl = [...document.querySelectorAll("button,a[href],select,textarea,input:not([type=hidden]):not([type=radio]),label.opt")].filter(vis).filter(e => !e.disabled);
    const small = ctl.filter(e => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; });
    const wide = [...document.querySelectorAll("#app *,#bnav *,.top *")].filter(e => !e.closest(".scroll,.figscroll,svg,.nums") && e.getBoundingClientRect().right > DW + 1 && vis(e)).slice(0, 3).map(e => e.tagName + "." + String(e.className).slice(0, 24) + " " + Math.round(e.getBoundingClientRect().right) + " «" + e.textContent.trim().slice(0, 40) + "» in " + (e.closest("article,section") || {}).className);
    return { wide, vw: innerWidth, h: document.documentElement.scrollHeight, small: small.map(e => (e.textContent || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 16)), ox: document.documentElement.scrollWidth > DW + 1 || innerWidth > DW + 1 || wide.length > 0, nav: [...document.querySelectorAll("#bnav button")].length };
  }, VW);
  const bad = await scan();
  const full = o.full === false ? false : true, h = full ? Math.min(m.h, 4200) : VH;
  if (full) await page.setViewport({ width: VW, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 120));
  const file = `${lv}-${String(n).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: path.join(OUT, file) });
  if (full) await page.setViewport({ width: VW, height: VH, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  if (m.ox) console.log("   กว้างเกินจอ:", JSON.stringify(m.wide), "innerWidth", m.vw);
  report.push({ lv, file, h: m.h, small: m.small, ox: m.ox, nav: m.nav, lowContrast: bad });
  console.log(`${file.padEnd(34)} สูง ${String(m.h).padStart(5)} · ปุ่มเล็ก ${m.small.length}${m.small.length ? " [" + [...new Set(m.small)].slice(0, 3).join(",") + "]" : ""} · เลื่อนแนวนอน ${m.ox ? "ใช่" : "ไม่"} · เมนูล่าง ${m.nav} · ตัวอักษรคอนทราสต์ต่ำ ${bad.length}${bad.length ? " " + JSON.stringify(bad.slice(0, 3)) : ""}`);
}
const answerQ = (sel, val) => page.evaluate((sel, val) => { const el = document.querySelector(sel); if (el) { if (el.tagName === "SELECT" || el.type === "text") { el.value = val; } else el.checked = true; el.dispatchEvent(new Event("change", { bubbles: true })); el.click && el.type === "radio" && el.click(); } }, sel, val);

for (const lv of ["P6", "M3"]) {
  let n = 0; const S = (name, o) => shot(lv, ++n, name, o);
  await page.goto(BASE, { waitUntil: "networkidle0" }); await page.evaluate(() => localStorage.clear()); await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(l => { S.level = l; theme(); codeForm(); }, lv); // หน้ากรอกรหัสในธีมของระดับนั้น
  await S("code", { full: false });
  await page.type("#cc", cfg.rooms[lv]); await click("#cf button");
  await S("roster", { full: false });
  await click('button[data-a="pick"]'); await page.waitForSelector(".scard"); await new Promise(r => setTimeout(r, 400));
  await S("home");
  await evalc(() => document.querySelector('[data-k="exams"]').click());
  await S("exams");
  await evalc(() => document.querySelector('[data-k="learn"]').click());
  await page.evaluate(() => { const d = document.querySelector("details.ind"); if (d) d.open = true; });
  await S("learn");
  // สรุปเนื้อหา: มาตรฐานที่มีภาพ SVG (ว 2.3 ทั้งสองระดับมีวงจรไฟฟ้า)
  await evalc(() => document.querySelector('button[data-a="study"][data-std="ว 2.3"]').click());
  await new Promise(r => setTimeout(r, 400));
  await S("study");
  // ข้อสอบรายปี ทีละข้อ
  await evalc(() => document.querySelector('[data-k="exams"]').click());
  const y = await page.$eval('button[data-a="year"]', b => b.dataset.y);
  await evalc(y => document.querySelector('button[data-a="year"][data-y="' + y + '"]').click(), y);
  await page.waitForSelector("#qcard");
  const types = await page.evaluate(() => Q.qs.map(q => q.type + (q.imageUrl ? "+img" : "")));
  const iText = types.findIndex(t => t === "mc"), iImg = types.findIndex(t => t === "mc+img"), iCx = types.findIndex(t => t.startsWith("complex")), iOrd = types.findIndex(t => t.startsWith("order"));
  const goto = i => evalc(i => goQ(i), i);
  await goto(iText >= 0 ? iText : 0); await answerQ('input[name="a"][value="2"]'); await S("question-text", { full: false });
  if (iImg >= 0) { await goto(iImg); await answerQ('input[name="a"][value="3"]'); await S("question-image"); }
  if (iCx >= 0) { await goto(iCx); await answerQ('input[name="a__0"][value="ใช่"]'); await answerQ('input[name="a__1"][value="ไม่ใช่"]'); await S("question-complex"); }
  if (iOrd >= 0) { await goto(iOrd); await answerQ('select[name="a__0"]', "2"); await S("question-order"); }
  // ปักธง + แผงเลขข้อ
  await goto(iText >= 0 ? iText : 0); await evalc(() => document.querySelector('[data-a="flag"]').click());
  await evalc(() => document.querySelector('[data-a="sheet"]').click()); await S("question-sheet", { full: false });
  await evalc(() => document.querySelector('[data-a="closesheet"]').click());
  // ตอบทั้งหมดเป็นข้อ 1 แล้วส่ง → ผลลัพธ์
  await page.evaluate(() => { Q.qs.forEach((q, i) => { if (q.type === "mc") Q.ans[q.id] = String((i % 4) + 1); else if (q.type === "complex") Q.ans[q.id] = q.choices.map(() => "ใช่").join(","); else if (q.type === "order") Q.ans[q.id] = Array.from({ length: q.slots }, (_, k) => String(k + 1)).join(","); }); saveExam(); });
  await evalc(() => document.querySelector('[data-a="sheet"]').click()); await evalc(() => document.querySelector('#sheet [data-a="submit"]').click());
  await page.waitForFunction(() => /ได้ .*%/.test(document.querySelector("h2")?.textContent || ""), { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('[data-a="sol"]'), { timeout: 10000 }).catch(() => {});
  await S("result");
  await page.evaluate(() => { const b = document.querySelector('[data-a="sol"]'); if (b) { b.click(); b.scrollIntoView({ block: "center" }); } });
  await new Promise(r => setTimeout(r, 300));
  await shot(lv, ++n, "result-solution", { full: false });
  await evalc(() => document.querySelector('[data-k="home"]').click()); await new Promise(r => setTimeout(r, 900));
  await S("home-progress");
  await evalc(() => document.querySelector('[data-k="mine"]').click()); await new Promise(r => setTimeout(r, 600));
  await S("mine");
  await evalc(() => ACT.res()); await S("resources");
  // ทิ้งข้อสอบค้าง: ทำค้างไว้ → หน้าแรกขึ้น "ทำต่อ"
  await evalc(() => { quiz("practice", "ว 1.1", ""); });
  await page.waitForSelector("#qcard"); await answerQ('input[name="a"][value="1"]'); await evalc(() => document.querySelector('[data-a="leave"]').click());
  await evalc(() => document.querySelector('[data-k="home"]').click()); await new Promise(r => setTimeout(r, 300));
  await S("home-resume", { full: false });
  await page.evaluate(() => clearExam());
}
// ครู
await page.goto(BASE, { waitUntil: "networkidle0" }); await page.evaluate(() => localStorage.clear()); await page.goto(BASE, { waitUntil: "networkidle0" });
let n = 0; const T = (name, o) => shot("T", ++n, name, o);
await evalc(() => admin()); await T("admin-login", { full: false });
await page.type('#lg input[name="u"]', cfg.username); await page.type('#lg input[name="p"]', cfg.password); await page.$eval("#lg button", b => b.click());
await page.waitForFunction(() => document.querySelector("#bnav.on"), { timeout: 20000 }); await idle();
await T("admin-students");
for (const [k, name] of [["report", "admin-report"], ["admins", "admin-admins"], ["more", "admin-more-schools"]]) { await evalc(k => document.querySelector('#bnav [data-k="' + k + '"]').click(), k); await T(name); }
await evalc(() => document.querySelector('[data-a="moresub"][data-s="content"]').click()); await T("admin-more-content");
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
await browser.close();
const nSmall = report.reduce((a, r) => a + r.small.length, 0), nLow = report.reduce((a, r) => a + r.lowContrast.length, 0), nOx = report.filter(r => r.ox).length;
console.log(`\nภาพ ${report.length} ภาพ · ปุ่มเล็กกว่า 44px ${nSmall} · ตัวอักษรคอนทราสต์ต่ำ ${nLow} · หน้าเลื่อนแนวนอน ${nOx} · JS error ${errs.length}${errs.length ? " " + errs[0] : ""}`);
process.exit(nSmall || nLow || nOx || errs.length ? 1 : 0);
