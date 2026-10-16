/* Service worker ของติว O-NET (ใช้เมื่อเปิด PWA: หน้าทดลอง /preview/ ก่อน · เว็บหลักเมื่อผู้ใช้อนุมัติ)
   เป้าหมาย: เปิดเว็บและทำข้อสอบได้แม้เน็ตไม่ดี · ส่งคะแนนค้างอัตโนมัติเมื่อเน็ตกลับมา (คิวอยู่ใน js/core.js)
   - ตัวเว็บ (index.html, css, js, figs): แคชไว้ตอนติดตั้ง · เปิดจากแคชก่อน แล้วอัปเดตเบื้องหลัง (stale-while-revalidate)
   - เนื้อหา content/*: manifest.json ขอจากเน็ตก่อน (ได้ฉบับใหม่) ถ้าไม่ได้ใช้ที่แคช · ไฟล์เนื้อหาที่มี ?v=<hash> เก็บถาวร (เปลี่ยนเนื้อหา = hash ใหม่ = โหลดใหม่เอง)
   - ภาพข้อสอบ (images/): เก็บเมื่อเคยเปิดแล้ว เปิดซ้ำออฟไลน์ได้ (จำกัดจำนวนไม่ให้เต็มเครื่อง)
   - Apps Script (script.google.com) ไม่แคชเด็ดขาด */
const VER = '9a1dfd2d9e';
const SHELL = ['./', 'index.html', 'app.js', 'figs/P6.js', 'figs/M3.js', 'manifest.webmanifest', 'icons/icon-192.png'];
const C_SHELL = 'onet-shell-' + VER, C_DATA = 'onet-data', C_IMG = 'onet-img', IMG_MAX = 400;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C_SHELL).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => /^onet-shell-/.test(k) && k !== C_SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const swr = (req, name) => caches.open(name).then(c => c.match(req, { ignoreSearch: false }).then(hit => {
  const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
  return hit || net;
}));
async function trimImages() {
  const c = await caches.open(C_IMG), ks = await c.keys();
  for (let i = 0; i < ks.length - IMG_MAX; i++) await c.delete(ks[i]);
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (/script\.google(usercontent)?\.com$/.test(url.hostname)) return; // API: ผ่านเน็ตตรง
  if (url.origin === location.origin) {
    if (/\/content\/manifest\.json$/.test(url.pathname)) {
      e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(C_DATA).then(c => c.put(req, cp)); return r; }).catch(() => caches.open(C_DATA).then(c => c.match(req)).then(h => h || Response.error())));
      return;
    }
    if (/\/content\//.test(url.pathname)) { // ไฟล์มี ?v=hash → เก็บถาวร
      e.respondWith(caches.open(C_DATA).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
      return;
    }
    if (/\/images\//.test(url.pathname)) {
      e.respondWith(caches.open(C_IMG).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { c.put(req, r.clone()).then(trimImages); } return r; }))));
      return;
    }
    e.respondWith(caches.open(C_SHELL).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(swr(req, C_DATA));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
