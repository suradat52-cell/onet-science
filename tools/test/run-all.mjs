// รันชุดทดสอบทั้งหมดทีละชุด โดยเริ่มเซิร์ฟเวอร์จำลองใหม่ก่อนแต่ละชุด (ข้อมูลทดสอบเริ่มจากศูนย์ ชุดที่ใช้นักเรียนคนเดียวกันจึงไม่ปนกัน)
//   node tools/test/run-all.mjs [ชื่อชุด,...]      ผลละเอียดอยู่ที่ tools/.cache/out-<ชื่อ>.txt
import { spawn, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { TOOLS } from "../lib.mjs";

const ALL = ["a11y", "figzoom", "grading", "secure", "privacy", "guards", "alts", "outcurr", "summary-format", "figs-text", "print", "browser", "learn", "teacher", "offline", "sum-audit", "responsive"];
const want = process.argv[2] ? process.argv[2].split(",") : ALL;
const PORT = 8765, CACHE = path.join(TOOLS, ".cache");
const killPort = () => spawnSync("powershell", ["-NoProfile", "-Command", `Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const run = (f, args = []) => new Promise(res => { const out = fs.openSync(path.join(CACHE, "out-" + path.basename(f, ".mjs") + ".txt"), "w"); const p = spawn("node", [f, ...args], { stdio: ["ignore", out, out] }); p.on("exit", c => res(c)); });
let failed = 0;
for (const name of want) {
  killPort(); await sleep(800);
  const srv = spawn("node", [path.join(TOOLS, "test", "server.mjs"), String(PORT)], { stdio: ["ignore", fs.openSync(path.join(CACHE, "srv.log"), "w"), "inherit"] });
  for (let i = 0; i < 90; i++) { await sleep(1000); try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch {} }
  const code = await run(path.join(TOOLS, "test", name + ".mjs"));
  const txt = fs.readFileSync(path.join(CACHE, "out-" + name + ".txt"), "utf8"), nf0 = (txt.match(/^FAIL/gm) || []).length;
  let np = (txt.match(/^PASS/gm) || []).length, nf = nf0;
  if (!np) { const m = /ผ่าน ([0-9]+) · ไม่ผ่าน ([0-9]+)/.exec(txt); if (m) { np = +m[1]; nf += +m[2]; } else if (!code) np = 1; } // ชุดที่สรุปเป็นบรรทัดเดียว (figs-text) นับเป็น 1 รายการเมื่อ exit 0
  if (code || nf) failed++;
  console.log(`${code || nf ? "✗" : "✓"} ${name}: ผ่าน ${np} · ไม่ผ่าน ${nf}${code && !nf ? " (exit " + code + ")" : ""}`);
  srv.kill(); killPort();
}
console.log(failed ? `\nไม่ผ่าน ${failed} ชุด` : "\nผ่านทุกชุด");
process.exit(failed ? 1 : 0);
