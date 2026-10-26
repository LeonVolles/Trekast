// Draws the Trekast signpost icon and renders the PNG app icons.
// Measures (viewBox 0..100): post 45..55, boards 26..46 high, corner radius 4 on all outer corners.
// Yellow board 34 wide including its tip (h/2 = 10); white board 29 = 34 - 10/2, so both have the same area and look equally long.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { writeFileSync } from "node:fs";

const G = "#18412d", W = "#fff", Y = "#f4b63f", P = "#cdd8d1";

// Polygon whose corners marked true get a circular arc of radius r
function poly(pts, r) {
  const n = pts.length; let d = "";
  for (let i = 0; i < n; i++) {
    const [x, y, round] = pts[i], [px, py] = pts[(i + n - 1) % n], [nx, ny] = pts[(i + 1) % n];
    if (!round) { d += (i ? "L" : "M") + `${x} ${y} `; continue; }
    const ax = px - x, ay = py - y, bx = nx - x, by = ny - y, la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    const t = r / Math.tan(Math.acos((ax * bx + ay * by) / (la * lb)) / 2);
    const sweep = ((x - px) * (ny - y) - (y - py) * (nx - x)) > 0 ? 1 : 0;
    d += (i ? "L" : "M") + `${(x + ax / la * t).toFixed(2)} ${(y + ay / la * t).toFixed(2)} A${r} ${r} 0 0 ${sweep} ${(x + bx / lb * t).toFixed(2)} ${(y + by / lb * t).toFixed(2)} `;
  }
  return d + "Z";
}
const cloud = (x, y) => `<g fill="${G}" transform="translate(${x} ${y})"><circle cx="-5" cy="1.5" r="3.6"/><circle cx="0" cy="-2.2" r="4.8"/><circle cx="5" cy="1.5" r="3.6"/><rect x="-5" y="1.5" width="10" height="3.6"/></g>`;
const sun = (x, y, r = 4) => `<g transform="translate(${x} ${y})" stroke="${G}" stroke-width="2" stroke-linecap="round"><circle r="${r}" fill="${G}" stroke="none"/>${
  [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const t = a * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    return `<line x1="${(c * (r + 2.2)).toFixed(1)}" y1="${(s * (r + 2.2)).toFixed(1)}" x2="${(c * (r + 4.4)).toFixed(1)}" y2="${(s * (r + 4.4)).toFixed(1)}"/>`; }).join("")}</g>`;

function sign() {
  const r = 4, y = 26, h = 20, pl = 45, pr = 55, wl = 29, w = 34, l0 = pl - wl, r1 = pr + w, cy = y + h / 2;
  const left = poly([[pl, y, false], [l0, y, true], [l0, y + h, true], [pl, y + h, false]], r);
  const right = poly([[pr, y, false], [r1 - h / 2, y, true], [r1, cy, true], [r1 - h / 2, y + h, true], [pr, y + h, false]], r);
  return `<rect x="${pl - 0.4}" y="${y}" width="${pr - pl + 0.8}" height="${84 - y}" fill="${P}"/><rect x="37" y="84" width="26" height="4" fill="${P}"/>
  <path d="${left}" fill="${W}"/><path d="${right}" fill="${Y}"/>${cloud((l0 + pl) / 2, cy)}${sun((pr + r1 - h / 2) / 2, cy)}`;
}
// Full-bleed square: iOS and Android round the corners themselves
const svg = (scale = 1) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${G}"/>` +
  `<g transform="translate(50 52) scale(${scale}) translate(-50 -52)">${sign()}</g></svg>`;

writeFileSync("brand/icon.svg", svg());
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, scale] of [["icon-512.png", 512, 1], ["icon-192.png", 192, 1], ["apple-touch-icon.png", 180, 1], ["icon-maskable-512.png", 512, 0.8]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg(scale)}`);
  await page.screenshot({ path: file, omitBackground: false });
}
await browser.close();
