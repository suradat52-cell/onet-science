// ไฟล์เนื้อหาเสริมสำหรับฟีเจอร์การเรียน (เรียกจาก build-content.mjs)
//   <LV>/qidx.json   { "ปี/ข้อ": [มาตรฐาน, ตัวชี้วัด] }  → สมุดข้อผิด/แนะนำตัวชี้วัดคำนวณฝั่งเว็บ
//   <LV>/cards.json  บัตรคำ: t "c" = เติมคำ (ข้อความจำให้แม่นที่มี **คำสำคัญ**) · t "q" = ถาม-ตอบ (แถวตาราง/ข้อความไม่มีคำเน้น)
//   <LV>/search.json [ชนิด s|t|q, มาตรฐาน, ตัวชี้วัด, ชื่อ, ข้อความสั้น]
import crypto from "crypto";

const clean = t => String(t).replace(/\*\*/g, "").replace(/\{([^{}/]+)\/([^{}/]+)\}/g, "$1/$2").replace(/\s+/g, " ").trim();
const nameOf = t => clean(t).replace(/^สรุปย่อ 1 หน้า:\s*/, "").replace(/\s*\((ออก|ยังไม่เคยออก)[^)]*\)\s*$/, "");
const sha = s => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);

export function extras({ lv, qs, sl, inCurr, keyOf, put }) {
  put(`${lv}/qidx.json`, Object.fromEntries(qs.filter(inCurr).filter(q => q.standard).map(q => [keyOf(q), [q.standard, q.indicator]])));
  const cards = [], seen = new Set(), srch = [];
  for (const blk of sl) {
    let sec = "", hdr = null, secStart = cards.length, fig = "";
    for (const raw of blk.content.split("\n")) {
      const l = raw.trim();
      if (l.startsWith("## ")) { sec = clean(l.slice(3)); hdr = null; secStart = cards.length; fig = ""; srch.push(["s", blk.standard, blk.indicator, sec, nameOf(blk.title)]); continue; }
      const fm = /^[[]{2}fig:([a-zA-Z0-9_-]+)/.exec(l); if (fm) { fig = fm[1]; for (const c of cards.slice(secStart)) c.fig = fig; continue; }
      if (l.startsWith("!! ") && sec) {
        const r = l.slice(3).replace(/\{([^{}/]+)\/([^{}/]+)\}/g, "$1/$2").replace(/\s+/g, " ").trim(), kw = /\*\*[^*]+\*\*/.test(r), id = sha(blk.standard + "|" + blk.indicator + "|" + r);
        if (!seen.has(id) && clean(r).length >= 12) { seen.add(id); cards.push({ id, std: blk.standard, ind: blk.indicator, t: kw ? "c" : "q", f: nameOf(blk.title) + " › " + sec, b: kw ? r : clean(r), ...(fig ? { fig } : {}) }); }
        continue;
      }
      if (l[0] === "|") {
        const c = l.replace(/^\||\|$/g, "").split("|").map(clean);
        if (!hdr) { hdr = c; continue; }
        if (blk.indicator && c.length >= 2 && c[0] && c[0].length <= 36 && hdr.length >= 2) {
          const b = c.slice(1).map((x, i) => (hdr[i + 1] ? hdr[i + 1] + ": " : "") + x).filter(x => !/: $/.test(x)).join(" · "), id = sha(blk.standard + "|" + blk.indicator + "|" + c[0] + "|" + b);
          const thai = c.slice(1).join("").replace(/[^\u0E01-\u0E4E]/g, "").length; // คำตอบต้องมีเนื้อความภาษาไทย ไม่ใช่แค่ ✓ ✗ หรือตัวเลข
          if (!seen.has(id) && b.length >= 8 && b.length <= 220 && thai >= 6) { seen.add(id); cards.push({ id, std: blk.standard, ind: blk.indicator, t: "q", f: sec + " — " + c[0], b, ...(fig ? { fig } : {}) }); }
        }
        continue;
      }
      hdr = null;
    }
    srch.push(["t", blk.standard, blk.indicator, nameOf(blk.title), clean(blk.content.split("\n").filter(x => x.trim() && !/^(##|\||\[\[|=)/.test(x.trim())).slice(0, 3).join(" ")).slice(0, 160)]);
  }
  qs.filter(inCurr).filter(q => q.standard).forEach(q => srch.push(["q", q.standard, q.indicator, keyOf(q), String(q.stem).replace(/__/g, "").replace(/\s+/g, " ").slice(0, 140)]));
  put(`${lv}/cards.json`, cards); put(`${lv}/search.json`, srch);
}
