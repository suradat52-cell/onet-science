// สร้างไอคอนแอป (PNG 192/512 + maskable) จากโลโก้ดาวเคราะห์ในหน้าเว็บ → icons/  (รันครั้งเดียวหรือเมื่อเปลี่ยนโลโก้)
//   node tools/make-icons.mjs
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { ROOT, BLOCK_REAL_API } from "./lib.mjs";

const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const OUT = path.join(ROOT, "icons"); fs.mkdirSync(OUT, { recursive: true });
const svg = (pad, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="g" cx="30%" cy="20%" r="90%"><stop offset="0" stop-color="#2a3590"/><stop offset=".6" stop-color="#101845"/><stop offset="1" stop-color="#080d24"/></radialGradient></defs>
<rect width="512" height="512" rx="${bg ? 0 : 112}" fill="url(#g)"/><g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
<g fill="#fff"><circle cx="90" cy="96" r="4"/><circle cx="420" cy="70" r="3"/><circle cx="440" cy="400" r="4"/><circle cx="70" cy="420" r="3"/><circle cx="330" cy="120" r="2.5"/></g>
<circle cx="256" cy="256" r="112" fill="#fbbf24"/><ellipse cx="256" cy="256" rx="220" ry="80" fill="none" stroke="#a5b4fc" stroke-width="22" transform="rotate(-24 256 256)"/><circle cx="436" cy="146" r="38" fill="#4ade80"/>
<path d="M232 236l-22 48c-4 8 2 16 11 14l42-10 30-34-18-24z" fill="#b45309" opacity=".35"/></g></svg>`;
const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API }), p = await b.newPage();
for (const [name, size, pad, bg] of [["icon-192.png", 192, 0, false], ["icon-512.png", 512, 0, false], ["icon-maskable-512.png", 512, 76, true]]) {
  await p.setViewport({ width: size, height: size });
  await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg(pad, bg)}`);
  await p.screenshot({ path: path.join(OUT, name), omitBackground: true });
}
fs.writeFileSync(path.join(OUT, "icon.svg"), svg(0, false));
await b.close(); console.log("icons/ แล้ว");
