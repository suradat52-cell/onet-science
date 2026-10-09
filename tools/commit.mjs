// commit ในเครื่องด้วย isomorphic-git (เครื่องนี้ไม่มีโปรแกรม git) — ได้ repo .git มาตรฐาน ใช้กับ git ปกติต่อได้
// node tools/commit.mjs "ข้อความ commit"      เพิ่ม/ลบทุกไฟล์ที่เปลี่ยน (ตาม .gitignore) แล้ว commit
// node tools/commit.mjs --log                  ดูประวัติ
import git from "isomorphic-git";
import fs from "fs";
import { ROOT } from "./lib.mjs";

const dir = ROOT, arg = process.argv[2];
const author = { name: process.env.GIT_AUTHOR_NAME || "suradat52", email: process.env.GIT_AUTHOR_EMAIL || "suradat52@gmail.com" };
if (!fs.existsSync(`${dir}/.git`)) { await git.init({ fs, dir, defaultBranch: "main" }); console.log("git init"); }
if (arg === "--log") {
  for (const c of await git.log({ fs, dir }).catch(() => [])) console.log(c.oid.slice(0, 7), new Date(c.commit.author.timestamp * 1000).toISOString().slice(0, 16), c.commit.message.trim().split("\n")[0]);
  process.exit(0);
}
if (!arg) { console.error('ใช้: node tools/commit.mjs "ข้อความ"'); process.exit(1); }
let n = 0;
for (const [file, head, work, stage] of await git.statusMatrix({ fs, dir })) {
  if (work === 0 && head === 1) { await git.remove({ fs, dir, filepath: file }); n++; }
  else if (work !== stage || head !== work) { await git.add({ fs, dir, filepath: file }); n++; }
}
if (!n) { console.log("ไม่มีไฟล์เปลี่ยน"); process.exit(0); }
const oid = await git.commit({ fs, dir, message: arg, author });
console.log(oid.slice(0, 7), arg, `(${n} ไฟล์)`);
