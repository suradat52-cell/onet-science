// ขึ้นหน้าทดลอง https://suradat52-cell.github.io/onet-science/preview/ — แตะเฉพาะโฟลเดอร์ preview/ ของ repo deploy เท่านั้น (เว็บหลักไม่ถูกแตะ)
//   node tools/publish-preview.mjs ["ข้อความ commit"] [--dir=โฟลเดอร์ deploy] [--dry]
// ความปลอดภัย: (1) repo deploy ต้องสะอาดก่อนเริ่ม (2) หลังสร้าง ทุกไฟล์ที่เปลี่ยนต้องอยู่ใต้ preview/ ถ้ามีไฟล์นอก preview/ เปลี่ยน → ยกเลิก ไม่ commit
//   (3) ไม่รัน tools/publish.mjs (ตัวขึ้นเว็บหลัก) (4) URL Apps Script ของหน้าทดลองต้องไม่ใช่ของเว็บหลัก (build-preview ตรวจ)
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { ROOT } from "./lib.mjs";

const args = process.argv.slice(2), flag = n => args.find(a => a.startsWith("--" + n + "="))?.slice(n.length + 3), dry = args.includes("--dry");
const msgArg = args.find(a => !a.startsWith("--"));
const dst = path.resolve(flag("dir") || path.join(os.homedir(), "onet-science-deploy"));
const REPO = "suradat52-cell/onet-science", SITE = "https://suradat52-cell.github.io/onet-science/preview/";
const extra = ["C:\\Program Files\\Git\\cmd", "C:\\Program Files\\GitHub CLI"].filter(p => fs.existsSync(p));
const env = { ...process.env, PATH: [process.env.PATH, ...extra].join(path.delimiter) };
const run = (cmd, a, cwd) => spawnSync(cmd, a, { cwd, env, encoding: "utf8", maxBuffer: 1 << 28 });
const git = a => run("git", a, dst), die = m => { console.error("✗ " + m); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!fs.existsSync(path.join(dst, ".git"))) die("ไม่พบ repo deploy ที่ " + dst);
if (!git(["remote", "get-url", "origin"]).stdout.includes(REPO)) die("origin ของ repo deploy ไม่ใช่ " + REPO);
if (git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim() !== "main") die("repo deploy ต้องอยู่กิ่ง main");
const dirty = git(["status", "--porcelain"]).stdout.split("\n").filter(l => l && !/^.. preview\//.test(l));
if (dirty.length) die("repo deploy มีการเปลี่ยนแปลงนอก preview/ ค้างอยู่ — ไม่ขึ้นหน้าทดลอง:\n" + dirty.slice(0, 5).join("\n"));
git(["pull", "--ff-only", "-q", "origin", "main"]);
const mainSha = git(["rev-parse", "HEAD:index.html"]).stdout.trim();

const b = run("node", [path.join(ROOT, "tools", "build-preview.mjs"), "--dir=" + dst], ROOT);
process.stdout.write(b.stdout); if (b.status) { process.stderr.write(b.stderr); die("build-preview ไม่สำเร็จ"); }

git(["add", "-A", "preview"]);
git(["add", "-f", "preview/content"]); // .gitignore ของ repo deploy กัน content/ ไว้ (เหมือนเว็บหลัก) แต่ต้องขึ้นเว็บ
const staged = git(["diff", "--cached", "--name-only"]).stdout.split("\n").filter(Boolean);
const outside = staged.filter(f => !f.startsWith("preview/"));
if (outside.length) { git(["reset", "-q"]); die("พบไฟล์นอก preview/ ถูกเปลี่ยน (" + outside.slice(0, 3).join(", ") + ") — ยกเลิก"); }
if (!staged.length) { console.log("หน้าทดลองไม่เปลี่ยนจากครั้งก่อน"); process.exit(0); }
if (git(["rev-parse", "HEAD:index.html"]).stdout.trim() !== mainSha) die("index.html ของเว็บหลักเปลี่ยนไป — ยกเลิก");
console.log(`ไฟล์ที่เปลี่ยนใต้ preview/: ${staged.length} ไฟล์ (ไม่มีไฟล์นอก preview/)`);
if (dry) { git(["reset", "-q"]); console.log("--dry: หยุดก่อน commit/push"); process.exit(0); }
const subject = run("git", ["log", "-1", "--format=%s"], ROOT).stdout.trim();
const msg = msgArg || `หน้าทดลอง /preview/ ${new Date().toISOString().slice(0, 16).replace("T", " ")} · ล่าสุดในโฟลเดอร์งาน: ${subject}`;
if (git(["commit", "-q", "-m", msg]).status) die("commit ไม่สำเร็จ");
const sha = git(["rev-parse", "HEAD"]).stdout.trim(); console.log("commit " + sha.slice(0, 7));
if (git(["push", "origin", "main"]).status) die("push ไม่สำเร็จ");
let st = ""; const t0 = Date.now();
while (Date.now() - t0 < 6 * 60e3) {
  let bj = {}; try { bj = JSON.parse(run("gh", ["api", `repos/${REPO}/pages/builds/latest`], dst).stdout); } catch {}
  if (bj.commit === sha && bj.status !== st) { st = bj.status; console.log("Pages: " + st); }
  if (bj.commit === sha && (st === "built" || st === "errored")) break;
  await sleep(8000);
}
if (st !== "built") die("Pages build ยังไม่สำเร็จ (" + st + ")");
const res = await fetch(SITE + "?v=" + sha.slice(0, 7)), txt = await res.text();
console.log(`✓ ${SITE} HTTP ${res.status} · noindex ${/noindex/.test(txt)} · ป้ายหน้าทดลอง ${/pvbadge/.test(txt)}`);
const main = await fetch("https://suradat52-cell.github.io/onet-science/?v=" + sha.slice(0, 7)); const mt = await main.text();
console.log(`เว็บหลัก HTTP ${main.status} · ไม่มีป้ายทดลอง ${!/pvbadge/.test(mt)} · ยังใช้ API เดิม ${/AKfycbx6hs29/.test(mt)}`);
process.exitCode = res.ok && !/pvbadge/.test(mt) ? 0 : 1;
