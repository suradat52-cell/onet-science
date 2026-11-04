// ตรวจว่าโจทย์ในเล่มติวทุกข้อมีเนื้อหารองรับในสรุปของเล่ม: เทียบคำสำคัญในเฉลยกับข้อความสรุปของตัวชี้วัดเดียวกัน (ต่ำกว่า 50% = ให้คนตรวจซ้ำ)
//   node tools/book-coverage.mjs   (ต้องรัน tools/test/server.mjs ก่อน) · ผล tools/.cache/cov.json
import puppeteer from "puppeteer-core"; import fs from "fs";
const cfg = JSON.parse(fs.readFileSync("tools/.cache/admin.json", "utf8"));
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const p = await b.newPage(); await p.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" });
const r = await p.evaluate(async () => {
  const x = await bookBuild("M3", "x", "main"), d = document.createElement("div"); d.innerHTML = x.html;
  // ข้อความสรุปต่อมาตรฐาน (ทั้งสรุปหัวข้อ + การ์ด) และต่อตัวชี้วัด
  const std = {}, ind = {}; let cur = "";
  for (const el of d.querySelectorAll(".bk-body > *")) {
    if (el.classList.contains("bk-band")) { cur = el.textContent.trim().split(" ").slice(0, 2).join(" "); std[cur] = ""; continue; }
    if (el.classList.contains("bq")) continue;
    const t = el.innerText || el.textContent; std[cur] += " " + t;
    const tag = el.querySelector(".th .tag"); if (tag) ind[tag.textContent.trim()] = (ind[tag.textContent.trim()] || "") + " " + t;
  }
  const seg = new Intl.Segmenter("th", { granularity: "word" }), STOP = new Set("ที่ และ ของ ใน เป็น ได้ ให้ จาก มี ไม่ ว่า ข้อ ใด ต่อ กับ จะ คือ นี้ ไป มา ซึ่ง หรือ แต่ ถ้า เมื่อ โดย ทำ ให้ การ ความ ตาม ด้วย กัน อยู่ แล้ว ยัง เพราะ ดังนั้น ต้อง ตอบ ข้อความ ถูกต้อง ผิด ต่อไปนี้ ที่สุด มาก น้อย กว่า อย่างไร".split(" "));
  const words = t => [...seg.segment(String(t).replace(/[0-9().,:;"'“”·→=+\-/×÷%?!]/g, " "))].filter(s => s.isWordLike).map(s => s.segment).filter(w => w.length >= 3 && !STOP.has(w));
  const ks = {}; for (const y of ["2561","2562","2563","2564","2565","2566","2567","2568"]) ks[y] = await cj("M3/k-" + y + ".json");
  const out = [];
  for (const q of d.querySelectorAll(".bq")) {
    const src = q.querySelector(".bq-src").textContent, m = /O-NET (\d{4}) ข้อ (\d+) · (\S+)/.exec(src); if (!m) continue;
    const e = ks[m[1]][m[2]] || {}, base = (e.e || "") , w = [...new Set(words(base))], S = Object.entries(std).find(([k]) => true) ;
    const stdTxt = Object.values(std).join(" "), indTxt = ind[m[3]] || "";
    const hitInd = w.filter(x => indTxt.includes(x)).length, hitAll = w.filter(x => stdTxt.includes(x)).length;
    out.push({ n: +q.querySelector(".bq-n").textContent, y: m[1], i: m[2], ind: m[3], w: w.length, pInd: w.length ? Math.round(hitInd * 100 / w.length) : 0, pAll: w.length ? Math.round(hitAll * 100 / w.length) : 0, miss: w.filter(x => !stdTxt.includes(x)).slice(0, 8).join(" "), hasInd: !!indTxt });
  }
  return out;
});
await b.close();
fs.writeFileSync("tools/.cache/cov.json", JSON.stringify(r, null, 1));
const low = r.filter(x => x.pInd < 50).sort((a, b) => a.pInd - b.pInd);
console.log("ทั้งหมด", r.length, "· ไม่มีสรุปของตัวชี้วัดในเล่ม", r.filter(x => !x.hasInd).length, "· คำสำคัญในเฉลยพบในสรุปตัวชี้วัด <50%:", low.length);
console.log(low.map(x => `${x.n} (${x.y}/${x.i} ${x.ind}) ${x.pInd}% ขาด: ${x.miss}`).join("\n"));
