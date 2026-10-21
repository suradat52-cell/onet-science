// ทดสอบรูปแบบสรุปเนื้อหาใหม่ (kc: !! ?? tr: ex/th/an fl: ตารางการ์ด แผนผังความคิด ภาพ SVG) บนมือถือ 360 px และตอนพิมพ์
//   node tools/test/summary-format.mjs      (ต้องรัน tools/test/server.mjs ก่อน)
// ครอบคลุม: ตัวแปลง rich() · ข้อมูล build (ปีที่ข้อสอบออก) · ต้นแบบ P6 ว 2.1 / M3 ว 2.3: ไม่ต้องเลื่อนซ้าย-ขวา · ตัวอักษรไม่เล็กกว่า 12 px (รวมภาพ) · ย่อหน้า ≤ 4 บรรทัด ·
//          แผนผังความคิดกดแล้วเลื่อนถึงหัวข้อ · พิมพ์ขาวดำแยกประเภทกล่องได้ด้วยลายขอบ · มาตรฐานที่ยังไม่แปลงยังแสดงผลปกติ · ตัวตรวจ summaries.mjs จับรูปแบบผิด
import puppeteer from "puppeteer-core";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { ROOT, TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
let fail = 0, ok = 0;
const t = (name, cond, detail = "") => { if (cond) ok++; else fail++; console.log(`${cond ? "✓" : "✗"} ${name}${cond ? "" : " — " + detail}`); };

// ---- ข้อมูลจาก build ----
const sumJ = (lv, std) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", lv, `sum-${std}.json`), "utf8"));
const m3 = sumJ("M3", "2.3"), p6 = sumJ("P6", "2.1");
t("build: M3 ว 2.3 พลังงานกลคงตัว มีข้อสอบ 5 ข้อ (2561 ข้อ 31 ฯลฯ)", (m3.find(b => b.indicator === "ม.2/5").x["พลังงานกลคงตัว"] || []).includes("2561 ข้อ 31") && m3.find(b => b.indicator === "ม.2/5").x["พลังงานกลคงตัว"].length === 5);
t("build: P6 ว 2.1 วิธีสังเกตว่าเป็นสถานะใด มี 2562 ข้อ 11", (p6.find(b => b.indicator === "ป.4/3").x["วิธีสังเกตว่าเป็นสถานะใด"] || []).includes("2562 ข้อ 11"));
t("build: หัวข้อที่ยังไม่เคยออกไม่มีข้อสอบอ้างถึง", !m3.find(b => b.indicator === "ม.1/2").x && !p6.find(b => b.indicator === "ป.4/4").x);

const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const p = await b.newPage(); p.on("pageerror", e => { fail++; console.log("✗ JS error:", e.message); });
await p.setViewport({ width: 360, height: 800, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const boot = async lv => {
  await p.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" }); await p.evaluate(() => localStorage.clear());
  await p.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" });
  await p.type("#cc", cfg.rooms[lv]); await p.$eval("#cf button", x => x.click());
  await p.waitForSelector('button[data-a="pick"]'); await p.$eval('button[data-a="pick"]', x => x.click()); await p.waitForSelector(".scard");
};
await boot("P6");

// ---- ตัวแปลง rich() ----
const R = await p.evaluate(() => {
  const o = {};
  S.level = "P6";
  o.cards = rich("ex: โจทย์ข้อหนึ่ง\nth: ขั้น 1\nth: ขั้น 2\nan: ตอบ ก\n\nex: ตัวอย่างเดี่ยว ไม่มีขั้น");
  o.boxes = rich("kc: แนวคิด **คำสำคัญ**\n!! จำ {1/2}\n?? ถามบ่อย\ntr: ระวัง\nxx: เดิม\nob: ข้อสังเกต");
  o.flow = rich("fl: ขั้นแรก | อธิบายแรก\nfl: ขั้นสอง\n\nข้อความต่อ");
  o.tabs = rich("| ก | ข |\n| 1 | 2 |\n\n| ก | ข | ค |\n| 1 | 2 | 3 |\n\n| ก | ข | ค |\n| 1 | 2 | ข้อความยาวเกินยี่สิบสี่ตัวอักษรแน่นอนครับ |\n\n| ก | ข | ค | ง |\n| 1 | 2 | 3 | 4 |");
  o.orphan = rich("th: ขั้นลอย\nan: คำตอบลอย");
  o.exams = rich("## หัวข้อ ก\n?? ถามบ่อย\n## หัวข้อ ข\n?? ไม่มีปี", { pre: "sx", exams: { "หัวข้อ ก": ["2565 ข้อ 20", "2567 ข้อ 4", "2565 ข้อ 6"] } });
  o.tp = [titleParts("พลังงานกล (ออก 5 ข้อ)"), titleParts("ฟ (ออกบ่อยที่สุด 12 ข้อ)"), titleParts("กฎ (ยังไม่เคยออกสอบ 2561–2568)"), titleParts("ธรรมดา")];
  return o;
});
t("rich: ex+th+an เป็นการ์ด 3 ตอน (โจทย์ / คิดอย่างไร ลำดับเลข / คำตอบ)", /<div class="exm"><div class="exq"><b class="t">โจทย์<\/b>โจทย์ข้อหนึ่ง<\/div><div class="exth"><b class="t">คิดอย่างไร<\/b><ol><li>ขั้น 1<\/li><li>ขั้น 2<\/li><\/ol><\/div><div class="exan"><b class="t">คำตอบ<\/b>ตอบ ก<\/div><\/div>/.test(R.cards), R.cards);
const two = await p.evaluate(() => rich("ex: ข้อ ก\nth: ก1\nan: ตอบ ก\nex: ข้อ ข\nth: ข1\nth: ข2\nan: ตอบ ข"));
t("rich: การ์ดตัวอย่างสองใบติดกัน (ไม่เว้นบรรทัด) แยกเป็น 2 การ์ด ไม่มี th:/an: ตกค้าง", (two.match(/class="exm"/g) || []).length === 2 && !/th: |an: /.test(two), two);
t("rich: ex เดี่ยว (ไม่มี th/an) ยังเป็นกล่องตัวอย่างแบบเดิม", /<div class="box ex"><b class="t">ตัวอย่าง<\/b><div class="bl">ตัวอย่างเดี่ยว/.test(R.cards));
t("rich: กล่อง kc / key / ask / trap / tip(xx) / warn มีชื่อและคลาสครบ", ["box kc\"><b class=\"t\">แนวคิดหลัก", "box key\"><b class=\"t\">จำให้แม่น", "box ask\"><b class=\"t\">ข้อสอบชอบถาม", "box trap\"><b class=\"t\">กับดักที่พลาดบ่อย", "box tip\"><b class=\"t\">จุดที่มักพลาด", "box warn\"><b class=\"t\">ข้อสังเกต"].every(x => R.boxes.includes(x)), R.boxes);
t("rich: คำสำคัญ ** → <b> และเศษส่วนในกล่องยังทำงาน", R.boxes.includes("<b>คำสำคัญ</b>") && R.boxes.includes('class="fr"'));
t("rich: fl: เป็นผังขั้นตอนแนวตั้ง มีเลขขั้นและคำอธิบาย", /<ol class="flow"><li><span class="n">1<\/span><div><b>ขั้นแรก<\/b><span>อธิบายแรก<\/span><\/div><\/li><li><span class="n">2<\/span><div><b>ขั้นสอง<\/b><\/div><\/li><\/ol><p>ข้อความต่อ/.test(R.flow), R.flow);
const tabs = [...R.tabs.matchAll(/<table class="ctab( stk)?" data-n="(\d)"/g)].map(m => [m[2], !!m[1]]);
t("rich: ตาราง 2 คอลัมน์ไม่แตกการ์ด · 3 คอลัมน์ช่องสั้นไม่แตก · 3 คอลัมน์ช่องยาวและ 4 คอลัมน์แตกเป็นการ์ด", JSON.stringify(tabs) === JSON.stringify([["2", false], ["3", false], ["3", true], ["4", true]]), JSON.stringify(tabs));
t("rich: เซลล์ตารางมีป้ายหัวคอลัมน์ (data-l) ไว้แสดงในการ์ด", R.tabs.includes('<td data-l="ค">3</td>'));
t("rich: th:/an: ที่ไม่ได้ตามหลัง ex: แสดงเป็นข้อความธรรมดา ไม่พัง", R.orphan === "<p>th: ขั้นลอย</p><p>an: คำตอบลอย</p>", R.orphan);
t("rich: กล่องข้อสอบชอบถามใส่ปีที่ออก (ไม่ซ้ำ เรียงใหม่→เก่า) เฉพาะหัวข้อที่มีข้อสอบ และหัวข้อมี id", R.exams.includes("ออกปี 2567 · 2565<") && R.exams.includes("ไม่มีปี") && R.exams.includes('id="sx-1"') && R.exams.includes("ข้อสอบจริงที่เคยออก</b> 2565 ข้อ 20"), R.exams);
t("titleParts แยกป้ายท้ายชื่อ", R.tp[0].name === "พลังงานกล" && R.tp[0].n === 5 && R.tp[1].n === 12 && R.tp[2].never && R.tp[3].n === null, JSON.stringify(R.tp));

// ---- ต้นแบบบนมือถือ 360 px ----
const lineH = `(e => { const cs = getComputedStyle(e); return parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5; })`;
const PROTOS = [["P6", "ว 2.1", 8], ["M3", "ว 2.3", 25]];
for (const [lv, std, nTopics] of PROTOS) {
  await boot(lv);
  await p.evaluate(s => study(s, ""), std); await p.waitForSelector(".rich"); await p.waitForNetworkIdle({ idleTime: 400 }); await new Promise(r => setTimeout(r, 400));
  // หัวข้อกลุ่ม ค (ยังไม่เคยออก) พับอยู่ตอนเปิดหน้า · กดในแผนผังความคิดแล้วเปิดเอง
  const fold = await p.evaluate(() => { const ds = [...document.querySelectorAll("details.fold")]; return { n: ds.length, open: ds.filter(d => d.open).length, hint: !!document.querySelector(".fold-hint"), nev: document.querySelectorAll(".mm-g.b4 [data-a=goto]").length }; });
  t(`${lv} ${std}: หัวข้อที่ยังไม่เคยออก ${fold.n} หัวข้อ พับไว้ (เปิดอยู่ ${fold.open}) ตรงกับกลุ่มในแผนผัง ${fold.nev}`, fold.n > 0 && fold.open === 0 && fold.n === fold.nev && fold.hint, JSON.stringify(fold));
  const fid = await p.evaluate(() => document.querySelector(".mm-g.b4 [data-a=goto]").dataset.id);
  await p.$eval(`.mm [data-a=goto][data-id="${fid}"]`, x => x.click()); await new Promise(r => setTimeout(r, 500));
  t(`${lv} ${std}: กดหัวข้อที่พับในแผนผัง → เปิดอ่านได้ทันที`, await p.evaluate(id => { const d = document.querySelector("#" + id + " details.fold"); return d.open && d.querySelector(".rich").getBoundingClientRect().height > 20; }, fid));
  await p.evaluate(() => document.querySelectorAll("details.fold").forEach(d => { d.open = true; })); await new Promise(r => setTimeout(r, 300));
  const m = await p.evaluate(`(() => {
    const leftover = (document.querySelector('.paper').innerText.match(/(^|\\n)(th|an|fl|kc|tr|ex): /g) || []).length;
    const lh = ${lineH}, w = document.documentElement.clientWidth, o = {};
    o.docW = document.documentElement.scrollWidth; o.w = w;
    o.over = [...document.querySelectorAll(".paper *")].filter(e => !e.closest("svg") && e.getBoundingClientRect().right > w + 1).map(e => e.className || e.tagName).slice(0, 5);
    o.scroll = [...document.querySelectorAll(".paper *")].filter(e => !e.closest("svg") && e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(e).overflowX)).map(e => e.className || e.tagName).slice(0, 5);
    o.wideFig = document.querySelectorAll(".figscroll.wide").length; o.figs = document.querySelectorAll(".paper figure svg").length;
    o.rawFig = (document.querySelector(".paper").textContent.match(/\\[\\[fig:/g) || []).length;
    o.svgMin = Math.min(...[...document.querySelectorAll(".paper figure svg")].map(s => { const sc = s.getBoundingClientRect().width / s.viewBox.baseVal.width, t = [...s.querySelectorAll("text")].filter(x => x.textContent.trim()); return t.length ? Math.min(...t.map(x => parseFloat(getComputedStyle(x).fontSize) * sc)) : 99; }));
    o.small = [...document.querySelectorAll(".paper .rich *")].filter(e => !e.closest("svg") && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 11.95).map(e => e.tagName + "." + e.className).slice(0, 4);
    o.long = [...document.querySelectorAll(".paper .rich p, .paper .rich li")].filter(e => !e.closest(".flow, .ctab, .exth")).map(e => ({ n: Math.round(e.getBoundingClientRect().height / lh(e)), s: e.textContent.slice(0, 24) })).filter(x => x.n > 4).slice(0, 4);
    o.mm = document.querySelectorAll(".mm [data-a=goto]").length; o.topics = document.querySelectorAll(".topic").length;
    o.badGoto = [...document.querySelectorAll(".mm [data-a=goto]")].filter(b => !document.getElementById(b.dataset.id)).length;
    o.kinds = ["kc", "key", "ask", "trap"].map(k => k + ":" + document.querySelectorAll(".box." + k).length).join(" ");
    o.cards = document.querySelectorAll(".exm").length; o.flows = document.querySelectorAll(".flow").length; o.stk = document.querySelectorAll(".ctab.stk").length;
    o.askYears = [...document.querySelectorAll(".box.ask b.t")].filter(x => /ออกปี \\d{4}/.test(x.textContent)).length;
    o.noThai = (document.querySelector(".paper").innerText.match(/undefined|\\[object/g) || []).length + leftover;
    o.h3 = [...document.querySelectorAll(".rich h3")].filter(h => !h.id).length;
    o.stkOver = [...document.querySelectorAll(".ctab.stk")].filter(t => t.scrollWidth > t.clientWidth + 1).length;
    return o; })()`);
  t(`${lv} ${std}: ไม่ต้องเลื่อนซ้าย-ขวาเลย (กว้างหน้า ${m.docW}/${m.w} · ไม่มีกล่องเลื่อน · ไม่มีภาพที่ต้องเลื่อน)`, m.docW <= m.w && !m.over.length && !m.scroll.length && m.wideFig === 0 && m.stkOver === 0, JSON.stringify([m.over, m.scroll, m.wideFig]));
  t(`${lv} ${std}: ภาพ SVG ${m.figs} ภาพ แสดงครบ (ไม่มีข้อความ [[fig:…]] ค้าง) ตัวอักษรเล็กสุด ${m.svgMin.toFixed(1)} px ≥ 12`, m.figs > 0 && m.rawFig === 0 && m.svgMin >= 11.95, `${m.rawFig} ${m.svgMin}`);
  t(`${lv} ${std}: ตัวอักษรเนื้อหาไม่เล็กกว่า 12 px`, !m.small.length, m.small.join(","));
  t(`${lv} ${std}: ย่อหน้า/รายการไม่เกิน 4 บรรทัดบนมือถือ`, !m.long.length, JSON.stringify(m.long));
  t(`${lv} ${std}: แผนผังความคิด ${m.mm} หัวข้อ (= ${nTopics}) ทุกปุ่มชี้ id ที่มีจริง · หัวข้อย่อยทุกอันมี id`, m.mm === nTopics && m.badGoto === 0 && m.h3 === 0, JSON.stringify([m.mm, m.badGoto, m.h3]));
  t(`${lv} ${std}: มีกล่องครบประเภท (${m.kinds}) ตัวอย่าง 3 ขั้น ${m.cards} ผังขั้นตอน ${m.flows} ตารางการ์ด ${m.stk} · ?? ใส่ปีที่ออก ${m.askYears} กล่อง`, m.kinds.split(" ").every(x => +x.split(":")[1] > 0) && m.cards >= 10 && m.flows >= 1 && m.askYears >= 3 && m.noThai === 0, JSON.stringify(m));
  // กดหัวข้อในแผนผังแล้วเลื่อนไปที่ส่วนนั้น
  const tgt = await p.evaluate(() => { const bs = [...document.querySelectorAll(".mm [data-a=goto]")], bt = bs[Math.min(3, bs.length - 1)]; return { id: bt.dataset.id }; });
  await p.evaluate(() => window.scrollTo(0, 0)); await new Promise(r => setTimeout(r, 200));
  await p.$eval(`.mm [data-a=goto][data-id="${tgt.id}"]`, x => x.click()); await new Promise(r => setTimeout(r, 1500));
  const top = await p.evaluate(id => ({ y: Math.round(document.getElementById(id).getBoundingClientRect().top), sy: scrollY }), tgt.id);
  t(`${lv} ${std}: กดหัวข้อในแผนผัง (${tgt.id}) เลื่อนไปถึงส่วนนั้น (หัวข้ออยู่ ${top.y}px จากบนจอ)`, top.sy > 300 && top.y >= 0 && top.y < 140, JSON.stringify(top));
  // พิมพ์: ขาวดำ แยกประเภทกล่องด้วยลายขอบ
  await p.evaluate(() => { window.print = () => {}; ACT.pdf(); }); await p.emulateMediaType("print"); await new Promise(r => setTimeout(r, 300));
  const pr = await p.evaluate(() => {
    const bs = k => { const e = document.querySelector(".box." + k); if (!e) return null; const c = getComputedStyle(e); return { st: c.borderTopStyle, lw: parseFloat(c.borderLeftWidth), tw: parseFloat(c.borderTopWidth), bg: c.backgroundColor }; };
    const colored = [...document.querySelectorAll(".paper .rich *")].filter(e => !e.closest("svg") && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).filter(e => { const c = getComputedStyle(e).color.match(/\d+/g).map(Number); return c[0] + c[1] + c[2] > 40; }).length;
    const mm = document.querySelector(".mm button"); return { kc: bs("kc"), key: bs("key"), ask: bs("ask"), trap: bs("trap"), colored, mmShown: !!mm && getComputedStyle(mm).display !== "none", n: document.querySelector(".flow .n") && getComputedStyle(document.querySelector(".flow .n")).backgroundColor };
  });
  await p.emulateMediaType(null); await p.evaluate(() => { if (typeof cleanupPrint === "function") cleanupPrint(); });
  const styles = [pr.kc && pr.kc.lw >= 8 && pr.kc.st === "none" ? "แถบซ้ายหนา" : "?", pr.key && pr.key.st, pr.ask && pr.ask.st, pr.trap && pr.trap.st + "+" + pr.trap.lw];
  t(`${lv} ${std}: พิมพ์ขาวดำ แยกกล่อง 4 ประเภทด้วยลายขอบต่างกัน (${styles.join(" / ")})`, pr.kc && pr.kc.lw >= 8 && pr.key.st === "double" && pr.ask.st === "dashed" && pr.trap.st === "solid" && pr.trap.lw >= 9, JSON.stringify(pr));
  t(`${lv} ${std}: พิมพ์แล้วตัวหนังสือในเนื้อหาเป็นสีดำล้วน · แผนผังความคิดยังแสดง · วงกลมเลขขั้นเป็นพื้นขาว`, pr.colored === 0 && pr.mmShown && /255, 255, 255/.test(pr.n || "rgb(255, 255, 255)"), JSON.stringify(pr));
}

// ---- ทุกมาตรฐาน (19): ไม่เลื่อนซ้าย-ขวาที่ 360 px · ตัวอักษรและภาพ ≥ 12 px · ไม่มี markup ค้าง · แผนผังความคิดครบ ----
for (const lv of ["P6", "M3"]) {
  await boot(lv);
  const stds = await p.evaluate(async lv => { const m = await cj(lv + "/meta.json"); return m.standards.filter(s => (m.summaries || []).includes(s.standard)).map(s => s.standard); }, lv);
  for (const std of stds) {
    await p.evaluate(s => study(s, ""), std); await p.waitForSelector(".rich"); await p.waitForNetworkIdle({ idleTime: 250 }); await new Promise(r => setTimeout(r, 200));
    await p.evaluate(() => document.querySelectorAll("details.fold").forEach(d => { d.open = true; })); await new Promise(r => setTimeout(r, 150));
    const m = await p.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const svgMin = Math.min(99, ...[...document.querySelectorAll(".paper figure svg")].map(s => { const sc = s.getBoundingClientRect().width / s.viewBox.baseVal.width, t = [...s.querySelectorAll("text")].filter(x => x.textContent.trim()); return t.length ? Math.min(...t.map(x => parseFloat(getComputedStyle(x).fontSize) * sc)) : 99; }));
      return { docW: document.documentElement.scrollWidth, w, wide: document.querySelectorAll(".figscroll.wide").length, scr: [...document.querySelectorAll(".paper *")].filter(e => !e.closest("svg") && e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(e).overflowX)).length, figs: document.querySelectorAll(".paper figure svg").length, rawFig: (document.querySelector(".paper").textContent.match(/\[\[fig:/g) || []).length, svgMin,
        small: [...document.querySelectorAll(".paper .rich *")].filter(e => !e.closest("svg") && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 11.95).length,
        left: (document.querySelector(".paper").innerText.match(/(^|\n)(th|an|fl|kc|tr|ex): /g) || []).length, mm: document.querySelectorAll(".mm [data-a=goto]").length, topics: document.querySelectorAll(".topic[id]").length };
    });
    t(`${lv} ${std}: 360 px ไม่เลื่อนซ้าย-ขวา · ภาพ ${m.figs} (เล็กสุด ${m.svgMin.toFixed(1)} px) · ไม่มี markup ค้าง · แผนผัง ${m.mm}`, m.docW <= m.w && m.wide === 0 && m.scr === 0 && m.rawFig === 0 && m.svgMin >= 11.95 && m.small === 0 && m.left === 0 && m.mm === m.topics - 1, JSON.stringify(m));
  }
}
// ---- มาตรฐานที่ยังไม่แปลงรูปแบบ ต้องแสดงผลปกติ ----
await boot("P6");
await p.evaluate(() => study("ว 1.1", "")); await p.waitForSelector(".rich"); await new Promise(r => setTimeout(r, 300));
const leg = await p.evaluate(() => ({ docW: document.documentElement.scrollWidth, w: document.documentElement.clientWidth, topics: document.querySelectorAll(".topic").length, boxes: document.querySelectorAll(".box").length, raw: (document.querySelector(".paper").innerText.match(/\[\[fig:|kc: |tr: /g) || []).length }));
t(`P6 ว 1.1 (ยังไม่แปลง) แสดงปกติ: ${leg.topics} หัวข้อ ${leg.boxes} กล่อง ไม่มี markup ค้าง และไม่ล้นจอ`, leg.topics > 0 && leg.boxes > 0 && leg.raw === 0 && leg.docW <= leg.w, JSON.stringify(leg));
await b.close();

// ---- ตัวตรวจ summaries.mjs ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sumfmt-")), f = path.join(tmp, "P6-2.2.txt");
const good = fs.readFileSync(path.join(ROOT, "data", "summaries", "P6-2.2.txt"), "utf8");
const run = txt => { fs.writeFileSync(f, txt); const r = spawnSync("node", [path.join(ROOT, "tools", "summaries.mjs"), f], { encoding: "utf8" }); return r.stdout + r.stderr; };
const bad1 = run(good + "\n\n?? ปิดกล่อง\nth: ขั้นลอย\nan: คำตอบลอย\n"), bad2 = run(good + "\nex: โจทย์ไม่มีคำตอบ\nth: ขั้น\n\n## ต่อ\n"), bad3 = run(good + "\nkc: " + "ก".repeat(200) + "\n"), bad4 = run(good + "\n\nfl: \n");
t("ตัวตรวจ: th:/an: ลอย → ผิด", /th: ต้องตามหลัง ex:/.test(bad1), bad1.slice(-300));
t("ตัวตรวจ: ตัวอย่างที่ไม่มี an: → ผิด", /ไม่มี an:/.test(bad2), bad2.slice(-300));
t("ตัวตรวจ: บรรทัด kc: ยาวเกิน 140 ตัวอักษร → ผิด", /ยาว \d+ ตัวอักษร/.test(bad3), bad3.slice(-300));
t("ตัวตรวจ: fl: ว่าง → ผิด", /✗ P6-2\.2\.txt: บรรทัด \d+: .*fl/.test(bad4), bad4.slice(-300));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nผ่าน ${ok} · ไม่ผ่าน ${fail}`);
process.exitCode = fail ? 1 : 0;
