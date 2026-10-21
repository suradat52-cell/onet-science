// แปลงภาพ SVG รุ่นเก่า (กว้าง 360) เป็นรุ่นแคบ กว้าง 300 ตัวอักษร ≥ 12 px ไม่ต้องเลื่อนซ้าย-ขวา แล้วเขียนผลเป็นบล็อก GEN ท้าย figs/<ระดับ>.js
//   node tools/narrow-figs.mjs [P6|M3 ...]      (ไม่ใส่ = ทั้งสองระดับ)
// วิธี: รูปร่างทั้งหมดย่อเท่ากัน (× 300/360 ทั้งแนวนอนแนวตั้ง ไม่บิดสัดส่วน มุม/รังสีไม่เพี้ยน) · ตำแหน่งป้ายย่อตาม แต่ขนาดตัวอักษรไม่ย่อ (ขั้นต่ำ 12)
//        จากนั้นวัดกรอบข้อความในเบราว์เซอร์จริง แล้วขยับป้ายที่ทับกัน/ล้นขอบให้พ้น (ลงล่าง ขึ้นบน ซ้าย ขวา เลือกที่ขยับน้อยสุด) ขยายความสูงภาพถ้าจำเป็น
// ภาพที่วาดมือรุ่นใหม่ (บล็อก "ภาพรุ่นใหม่" ในไฟล์) ไม่ถูกแตะ · ภาพที่แก้ไม่ได้อัตโนมัติ (ป้ายยาวเกินกว้าง/ยังทับกัน) รายงานไว้ใน tools/.cache/narrow-report.json เพื่อแก้มือ
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { ROOT, TOOLS, BLOCK_REAL_API } from "./lib.mjs";

const LVS = process.argv.slice(2).length ? process.argv.slice(2) : ["P6", "M3"];
const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const GEN_BEGIN = "/* ===GEN:BEGIN", GEN_END = "/* ===GEN:END=== */";
const W = 300, MINF = 12;
const f1 = n => +n.toFixed(1);

function parse(svg, name) {
  const m = svg.match(/^<svg ([^>]*)>([\s\S]*)<\/svg>$/); if (!m) throw new Error(name + ": ไม่ใช่ svg");
  const vb = m[1].match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/); if (!vb) throw new Error(name + ": ไม่มี viewBox");
  const W0 = +vb[1], H0 = +vb[2], s = W / W0;
  const attrs = m[1].replace(vb[0], 'viewBox="0 0 300 @H@"');
  const d = m[2].match(/^<defs>([\s\S]*?)<\/defs>([\s\S]*)$/), defs = d ? d[1] : "", body = d ? d[2] : m[2];
  const parts = []; let last = 0; const re = /<text\b([^>]*)>([\s\S]*?)<\/text>/g; let t;
  const pushG = h => { if (h) parts.push({ g: h }); };
  while ((t = re.exec(body))) {
    pushG(body.slice(last, t.index)); last = t.index + t[0].length;
    const at = t[1], num = k => { const x = at.match(new RegExp("\\s" + k + '="(-?[\\d.]+)"')); return x ? +x[1] : 0; };
    const fs0 = at.match(/font-size="([\d.]+)"/), tr = at.match(/transform="([^"]*)"/);
    let rest = at.replace(/\s(x|y)="-?[\d.]+"/g, "").replace(/\sfont-size="[\d.]+"/, "").replace(/\stransform="[^"]*"/, "");
    const rec = { x: num("x") * s, y: num("y") * s, fs: Math.max(fs0 ? +fs0[1] : 13, MINF), fsAttr: !!fs0 || false, rest, text: t[2], rot: null };
    if (tr) { const mm = tr[1].match(/^translate\((-?[\d.]+)[ ,]+(-?[\d.]+)\) rotate\((-?[\d.]+)\)$/); if (!mm) throw new Error(name + ": transform แปลก " + tr[1]); rec.rot = { tx: +mm[1] * s, ty: +mm[2] * s, a: +mm[3] }; rec.x = num("x"); rec.y = num("y"); }
    parts.push({ t: rec });
  }
  pushG(body.slice(last));
  const labelM = attrs.match(/aria-label="([^"]*)"/);
  return { attrs, defs, parts, H0, s, name, label: labelM ? labelM[1] : name };
}
function build(P, off, H) {
  let i = 0, body = "";
  for (const p of P.parts) {
    if (p.g) { body += `<g transform="scale(${f1(P.s * 1000) / 1000})">${p.g}</g>`; continue; }
    const t = p.t, o = off[i++] || [0, 0];
    const fsa = t.fs !== 13 || t.fsAttr ? ` font-size="${t.fs}"` : "";
    if (t.rot) body += `<text x="${f1(t.x)}" y="${f1(t.y)}"${fsa}${t.rest} transform="translate(${f1(t.rot.tx + o[0])} ${f1(t.rot.ty + o[1])}) rotate(${t.rot.a})">${t.text}</text>`;
    else body += `<text x="${f1(t.x + o[0])}" y="${f1(t.y + o[1])}"${fsa}${t.rest}>${t.text}</text>`;
  }
  return `<svg ${P.attrs.replace("@H@", Math.ceil(H))}><defs>${P.defs}</defs>${body}</svg>`;
}
const CSS = "body{margin:0}svg{display:block;width:300px;font:11px 'Noto Sans Thai',Sarabun,sans-serif;fill:currentColor;color:#151a33}";
const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const pg = await b.newPage(); await pg.setViewport({ width: 320, height: 800 });
const measure = async svg => { await pg.setContent(`<style>${CSS}</style>${svg}`); await pg.evaluate(() => document.fonts.ready);
  return pg.evaluate(() => { const s = document.querySelector("svg"), vb = s.viewBox.baseVal, tx = [...s.querySelectorAll("text")].filter(x => x.textContent.trim());
    const all = [...s.querySelectorAll("text")], bb = s.getBBox();
    const sr = s.getBoundingClientRect(), shapes = [...s.querySelectorAll("rect,circle,ellipse,polygon")].filter(e => { const f = e.getAttribute("fill"); return f && f !== "none" && !e.closest("marker,defs"); }).map(e => { const r = e.getBoundingClientRect(); return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height }; }).filter(r => r.w > 6 && r.h > 6);
    return { shapes, H: vb.height, bb: { x: bb.x, y: bb.y, w: bb.width, h: bb.height }, texts: all.map(x => { const r = x.getBBox(); return { x: r.x, y: r.y, w: r.width, h: r.height, rot: x.hasAttribute("transform"), empty: !x.textContent.trim() }; }) }; }); };

const report = {};
for (const lv of LVS) {
  const file = path.join(ROOT, "figs", `${lv}.js`); let src = fs.readFileSync(file, "utf8");
  const gi = src.indexOf(GEN_BEGIN); if (gi >= 0) src = src.slice(0, gi).replace(/\s*$/, "\n");
  const FIGS = { P6: {}, M3: {} }; new Function("FIGS", src)(FIGS);
  const hi = src.indexOf("ภาพรุ่นใหม่"), hand = new Set(hi < 0 ? [] : [...src.slice(hi).matchAll(/F\['([\w-]+)'\]\s*=/g)].map(m => m[1]));
  const names = Object.keys(FIGS[lv]).filter(n => !hand.has(n)); report[lv] = {};
  let out = `\n${GEN_BEGIN} แปลงอัตโนมัติด้วย tools/narrow-figs.mjs (ภาพรุ่นเก่ากว้าง 360 → 300 · ห้ามแก้ในบล็อกนี้ ถ้าต้องแก้ให้วาดมือในบล็อก "ภาพรุ่นใหม่") ===*/\n(function () {\n  const F = FIGS.${lv};\n`;
  for (const n of names) {
    const P = parse(FIGS[lv][n], n), off = P.parts.filter(p => p.t).map(() => [0, 0]);
    let H = Math.ceil(P.H0 * P.s) + 4, m;
    for (let it = 0; it < 40; it++) {
      m = await measure(build(P, off, H));
      // ป้ายยาวกว่ากรอบ → ตัดบรรทัดที่ช่องว่าง (ขึ้นบรรทัดใหม่ใต้เดิม)
      const recs = P.parts.filter(p => p.t).map(p => p.t); let wrapped = false;
      if (it === 0) recs.forEach((r, i) => { const t = m.texts[i]; if (!t || t.empty || t.rot) return; const cx = t.x + t.w / 2, cy = t.y + t.h / 2;
        const c = m.shapes.filter(sh => cx >= sh.x && cx <= sh.x + sh.w && cy >= sh.y && cy <= sh.y + sh.h && sh.w * sh.h < 0.4 * W * (P.H0 * P.s)).sort((p, q) => p.w * p.h - q.w * q.h)[0]; if (c) { r.inbox = true; r.cw = c.w; } });
      for (let i = 0; i < recs.length && !wrapped; i++) { const t = m.texts[i], r = recs[i]; const lim0 = r.inbox ? Math.max(36, r.cw - 6) : W - 12; if (!t || t.empty || t.rot || t.w <= lim0) continue;
        const c = r.text; if (/[<&]/.test(c)) continue; const lim = Math.floor(c.length * (lim0 - 4) / t.w); let k = c.lastIndexOf(" ", lim); if (k < 3) k = c.indexOf(" ", Math.max(3, lim)); if (k < 3 || k >= c.length - 1) continue;
        const r2 = { ...r, text: c.slice(k + 1), y: r.y + r.fs * 1.3 }; r.text = c.slice(0, k);
        const pi = P.parts.findIndex(p => p.t === r); P.parts.splice(pi + 1, 0, { t: r2 }); off.splice(i + 1, 0, [off[i][0], off[i][1]]); wrapped = true; }
      if (wrapped) continue;
      const T = m.texts, n2 = T.length; let moved = false;
      // ล้นขอบซ้าย/ขวา → ขยับเข้า
      for (let i = 0; i < n2; i++) { const t = T[i]; if (t.empty || t.rot) continue; let dx = 0; if (t.x + t.w > W - 5) dx = (W - 5) - (t.x + t.w); if (t.x + dx < 3) dx = 3 - t.x; if (Math.abs(dx) > 0.4 && t.w <= W - 4) { off[i][0] += dx; t.x += dx; moved = true; } }
      for (let a = 0; a < n2; a++) for (let c = a + 1; c < n2; c++) {
        const A = T[a], C = T[c]; if (A.empty || C.empty || A.rot || C.rot) continue;
        const ox = Math.min(A.x + A.w, C.x + C.w) - Math.max(A.x, C.x), oy = Math.min(A.y + A.h, C.y + C.h) - Math.max(A.y, C.y);
        if (ox <= 1.5 || oy <= 2.5) continue;
        const cand = [[0, A.y + A.h - C.y + 1.5], [A.x + A.w - C.x + 1.5, 0]] // ขยับเฉพาะลง/ขวา (ไม่ย้อนทิศ → ไม่แกว่ง)
          .filter(([dx, dy]) => C.x + dx >= 2 && C.x + C.w + dx <= W - 2 && C.y + dy >= 0).sort((p, q) => (Math.abs(p[0]) + Math.abs(p[1]) * 1.3) - (Math.abs(q[0]) + Math.abs(q[1]) * 1.3));
        if (!cand.length) continue; const [dx, dy] = cand[0]; off[c][0] += dx; off[c][1] += dy; C.x += dx; C.y += dy; moved = true;
      }
      for (let i = 0; i < n2; i++) { const t = T[i]; if (t.empty || t.rot || recs[i].inbox) continue;
        for (const sh of m.shapes) { const ix = Math.min(t.x + t.w, sh.x + sh.w) - Math.max(t.x, sh.x), iy = Math.min(t.y + t.h, sh.y + sh.h) - Math.max(t.y, sh.y); if (ix <= 2 || iy <= 3) continue;
          const inside = t.x >= sh.x - 1 && t.x + t.w <= sh.x + sh.w + 1 && t.y >= sh.y - 1 && t.y + t.h <= sh.y + sh.h + 1, covers = sh.x >= t.x - 1 && sh.x + sh.w <= t.x + t.w + 1 && sh.y >= t.y - 1 && sh.y + sh.h <= t.y + t.h + 1; if (inside || covers) continue;
          const cands = [[0, sh.y + sh.h - t.y + 1.5], [sh.x + sh.w - t.x + 1.5, 0]].filter(([dx, dy]) => t.x + t.w + dx <= W - 4 && Math.abs(dx) + Math.abs(dy) < 40).sort((p, q) => (Math.abs(p[0]) + Math.abs(p[1]) * 1.3) - (Math.abs(q[0]) + Math.abs(q[1]) * 1.3));
          if (cands.length) { off[i][0] += cands[0][0]; off[i][1] += cands[0][1]; t.x += cands[0][0]; t.y += cands[0][1]; moved = true; break; } } }
      const bottom = Math.max(...T.filter(t => !t.empty).map(t => t.y + t.h), m.bb.y + m.bb.h) + 6; if (bottom > H) { H = Math.ceil(bottom); moved = true; }
      if (!moved) break;
    }
    m = await measure(build(P, off, H));
    const T = m.texts, issues = [];
    for (let a = 0; a < T.length; a++) { const A = T[a]; if (A.empty) continue; if (!A.rot && (A.x < 0 || A.x + A.w > W + 0.5)) issues.push("ล้นขอบ"); for (let c = a + 1; c < T.length; c++) { const C = T[c]; if (C.empty || A.rot || C.rot) continue; const ox = Math.min(A.x + A.w, C.x + C.w) - Math.max(A.x, C.x), oy = Math.min(A.y + A.h, C.y + C.h) - Math.max(A.y, C.y); if (ox > 1.5 && oy > 2.5) issues.push("ทับกัน"); } }
    const shifted = off.filter(o => Math.abs(o[0]) + Math.abs(o[1]) > 0.5).length, far = off.filter(o => Math.abs(o[0]) + Math.abs(o[1]) > 22).length;
    report[lv][n] = { texts: T.filter(t => !t.empty).length, shifted, far, issues: [...new Set(issues)], H: Math.ceil(H) };
    out += `  F[${JSON.stringify(n)}] = ${JSON.stringify(build(P, off, H))};\n`;
  }
  out += `})();\n${GEN_END}\n`;
  fs.writeFileSync(file, src + out);
  const bad = Object.entries(report[lv]).filter(([, r]) => r.issues.length || r.far); console.log(`${lv}: แปลง ${names.length} ภาพ · ขยับป้าย ${Object.values(report[lv]).reduce((a, r) => a + r.shifted, 0)} จุด · ต้องแก้มือ ${bad.length} ภาพ`);
  for (const [n, r] of bad) console.log(`  - ${n}: ${r.issues.join("/") || ""}${r.far ? " ขยับไกล " + r.far + " ป้าย" : ""}`);
}
await b.close();
fs.mkdirSync(path.join(TOOLS, ".cache"), { recursive: true }); fs.writeFileSync(path.join(TOOLS, ".cache", "narrow-report.json"), JSON.stringify(report, null, 1));
