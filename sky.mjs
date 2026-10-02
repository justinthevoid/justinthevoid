// The sky of the day, for the top of the GitHub profile. It's the same sky the homepage draws for that seed: the
// seed comes from the date, the palette is picked the way justinthevoid.com picks it, and the banner links to
// justinthevoid.com/?seed=NNNN, where the same sky is drawn in full. GitHub shows images but runs no scripts, so
// everything that moves is CSS inside the SVG.
//
//   node sky.mjs              today's sky (UTC)
//   node sky.mjs 2026-10-02   the sky for a given day
//   node sky.mjs seed=1234    a given seed
import { readFileSync, writeFileSync } from "node:fs";

// The homepage's palettes (apps/site/src/sky/home/seed.ts): name, gas colours, dust colours.
const PALETTES = [
  ["Orion Nebula", [[255, 95, 150], [255, 170, 120], [90, 200, 230], [170, 120, 255]], [[255, 228, 236], [255, 110, 160], [100, 200, 230], [255, 180, 130]]],
  ["Carina", [[255, 165, 60], [255, 110, 50], [80, 160, 255], [250, 220, 160]], [[255, 238, 214], [255, 170, 70], [90, 170, 255], [255, 120, 60]]],
  ["Pillars of Creation", [[60, 210, 200], [255, 190, 80], [205, 120, 60], [140, 220, 230]], [[232, 242, 236], [70, 210, 200], [255, 190, 90], [210, 130, 70]]],
  ["Crab Nebula", [[255, 140, 60], [255, 90, 80], [90, 170, 255], [250, 230, 200]], [[240, 236, 255], [255, 150, 70], [100, 170, 255], [255, 100, 90]]],
  ["Helix", [[60, 220, 220], [255, 90, 70], [40, 120, 255], [250, 200, 120]], [[226, 244, 246], [70, 220, 220], [255, 100, 80], [60, 130, 255]]],
  ["Rosette", [[255, 60, 100], [255, 130, 150], [200, 40, 100], [255, 190, 170]], [[255, 226, 232], [255, 80, 120], [255, 150, 165], [210, 60, 110]]],
  ["Pleiades", [[90, 160, 255], [170, 210, 255], [120, 110, 255], [235, 245, 255]], [[228, 238, 255], [100, 170, 255], [180, 215, 255], [140, 130, 255]]],
  ["Lagoon", [[255, 110, 170], [80, 220, 210], [255, 190, 140], [140, 120, 255]], [[255, 232, 240], [255, 120, 180], [90, 220, 210], [255, 195, 150]]],
  ["Cat's Eye", [[70, 255, 190], [60, 190, 255], [255, 90, 120], [200, 255, 230]], [[228, 255, 244], [80, 255, 200], [70, 190, 255], [255, 110, 140]]],
  ["Andromeda", [[255, 215, 150], [140, 170, 255], [255, 170, 110], [220, 200, 255]], [[255, 244, 226], [255, 215, 160], [150, 175, 255], [255, 180, 120]]],
  ["Veil", [[255, 150, 70], [170, 110, 255], [80, 210, 255], [255, 210, 160]], [[240, 232, 255], [255, 160, 80], [180, 120, 255], [90, 210, 255]]],
  ["Horsehead", [[255, 70, 80], [255, 140, 100], [60, 120, 255], [255, 200, 180]], [[255, 230, 226], [255, 90, 90], [255, 150, 110], [80, 130, 255]]],
  ["Aurora", [[60, 255, 160], [40, 200, 255], [190, 90, 255], [150, 255, 120]], [[226, 255, 240], [70, 255, 170], [60, 200, 255], [200, 110, 255]]],
];

// The homepage's random stream (apps/site/src/sky/shared/shapes.ts), so a seed means the same palette here.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashStr = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

const arg = process.argv[2] ?? "";
const day = /^\d{4}-\d{2}-\d{2}$/.test(arg) ? arg : new Date().toISOString().slice(0, 10);
const seed = arg.startsWith("seed=") ? Number(arg.slice(5)) % 10000 : hashStr(`sky ${day}`) % 10000;
const [name, gas, dust] = PALETTES[Math.floor(rng(seed * 7919 + 13)() * PALETTES.length)];
const r = rng(seed * 31 + hashStr("profile"));

const W = 1280, H = 400;
const rgb = ([R, G, B]) => `rgb(${R},${G},${B})`;
const f = (n) => Math.round(n * 10) / 10;
const pick = (list) => list[Math.floor(r() * list.length)];

// Gas: a few soft banks that drift slowly. A diagonal band gives the field some structure, like the homepage's.
const band = (x) => H * 0.78 - x * 0.32;
const gasBanks = Array.from({ length: 5 }, (_, i) => {
  const x = W * (0.12 + 0.2 * i + (r() - 0.5) * 0.12);
  return { x, y: band(x) + (r() - 0.5) * 120, rx: 150 + r() * 170, ry: 70 + r() * 80, c: gas[i % gas.length], o: 0.16 + r() * 0.16, dur: 38 + r() * 30, dx: (r() - 0.5) * 60, dy: (r() - 0.5) * 30 };
});

// Dust: mostly the palette's near-white, crowded toward the band. One in four twinkles.
const stars = Array.from({ length: 260 }, () => {
  const x = r() * W;
  const near = r() < 0.6;
  const y = near ? band(x) + (r() + r() + r() - 1.5) * 110 : r() * H;
  const c = r() < 0.72 ? dust[0] : pick(dust.slice(1));
  const size = r() < 0.08 ? 1.4 + r() * 0.9 : 0.4 + r() * 0.9;
  return { x, y, s: size, c, o: 0.35 + r() * 0.6, tw: r() < 0.25 ? { dur: 2.5 + r() * 5, delay: -r() * 8 } : null };
}).filter((s) => s.y > -4 && s.y < H + 4);

// Grain in the gas: the homepage's clouds are made of particles, not blur, so each bank gets a scatter of dust in
// its own colour that drifts with it.
const gauss = () => (r() + r() + r() + r() - 2) / 2;
for (const g of gasBanks) g.grain = Array.from({ length: 90 }, () => ({ x: g.x + gauss() * g.rx, y: g.y + gauss() * g.ry, s: 0.4 + r() * 0.8, o: 0.2 + r() * 0.45, c: r() < 0.7 ? g.c : dust[0] }));

// The planet, right of centre: a stippled sphere lit from the upper left, with a dotted ring on a coin flip, the
// way the homepage builds its worlds out of points.
const planet = { x: W * (0.74 + r() * 0.08), y: H * (0.34 + r() * 0.2), rad: 38 + r() * 16, c: gas[Math.floor(r() * 2)], c2: gas[2 + Math.floor(r() * 2)], ring: r() < 0.5, tilt: -18 + r() * 36 };
const L = [-0.55, -0.6, 0.58];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
planet.dots = [];
while (planet.dots.length < 520) {
  const u = Math.sqrt(r()), th = r() * Math.PI * 2;
  const nx = u * Math.cos(th), ny = u * Math.sin(th), nz = Math.sqrt(Math.max(0, 1 - u * u));
  const lit = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
  if (r() > 0.12 + 0.88 * lit) continue;
  // bands of colour across the latitude, so it reads as a world rather than a ball
  const lat = 0.5 + 0.5 * Math.sin(ny * 7 + nx * 1.5);
  planet.dots.push({ x: planet.x + nx * planet.rad, y: planet.y + ny * planet.rad, s: 0.5 + r() * 0.75, o: 0.3 + 0.7 * lit, c: mix(mix(planet.c2, planet.c, lit), dust[0], lit * lit * 0.5 * lat) });
}
planet.ringDots = planet.ring
  ? Array.from({ length: 170 }, () => {
      const a = r() * Math.PI * 2, k = 1.55 + r() * 0.35;
      const ex = Math.cos(a) * planet.rad * k, ey = Math.sin(a) * planet.rad * k * 0.26;
      const t = (planet.tilt * Math.PI) / 180;
      return { x: planet.x + ex * Math.cos(t) - ey * Math.sin(t), y: planet.y + ex * Math.sin(t) + ey * Math.cos(t), back: Math.sin(a) < 0, s: 0.4 + r() * 0.6, o: 0.25 + r() * 0.5 };
    })
  : [];
const dot = (d, c) => `<circle cx="${f(d.x)}" cy="${f(d.y)}" r="${f(d.s)}" fill="${rgb(c ?? d.c)}" opacity="${Math.round(d.o * 100) / 100}"/>`;

const sky = `SKY ${String(seed).padStart(4, "0")} · ${name.toUpperCase()}`;
const href = `https://justinthevoid.com/?seed=${seed}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Today's sky over justinthevoid.com: ${name}, sky ${seed}">
<title>${sky}</title>
<defs>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="38"/></filter>
  <filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <radialGradient id="vignette" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#05050b" stop-opacity="0"/><stop offset="100%" stop-color="#05050b" stop-opacity="0.85"/></radialGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="60%" stop-color="${rgb(planet.c)}" stop-opacity="0.16"/><stop offset="100%" stop-color="${rgb(planet.c)}" stop-opacity="0"/></radialGradient>
  <linearGradient id="streak" x1="0" x2="1"><stop offset="0%" stop-color="#fff" stop-opacity="0.9"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<style>
  .gas { animation: drift var(--d) ease-in-out infinite alternate; }
  @keyframes drift { to { transform: translate(var(--dx), var(--dy)); } }
  .tw { animation: twinkle var(--d) ease-in-out var(--l) infinite; }
  @keyframes twinkle { 0%, 100% { opacity: var(--o); } 50% { opacity: 0.08; } }
  .world { animation: bob 9s ease-in-out infinite alternate; }
  @keyframes bob { to { transform: translateY(-5px); } }
  .meteor { opacity: 0; animation: meteor 13s ease-out 3s infinite; }
  @keyframes meteor { 0% { opacity: 0; transform: translate(0, 0); } 1% { opacity: 1; } 6% { opacity: 0; transform: translate(-260px, 120px); } 100% { opacity: 0; transform: translate(-260px, 120px); } }
  .in { opacity: 0; animation: in 1.4s ease-out forwards; }
  .in2 { animation-delay: 0.5s; } .in3 { animation-delay: 1.1s; }
  @keyframes in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif; }
  .k { font-size: 13px; font-weight: 600; letter-spacing: 0.18em; }
  .lede { font-size: 34px; font-weight: 300; letter-spacing: -0.01em; fill: #f2efe8; }
  @media (prefers-reduced-motion: reduce) { .gas, .tw, .world, .meteor, .in { animation: none; } .in { opacity: 1; } }
</style>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="#05050b"/>
${gasBanks.map((g) => `  <g class="gas" style="--d:${f(g.dur)}s;--dx:${f(g.dx)}px;--dy:${f(g.dy)}px">
    <ellipse filter="url(#soft)" cx="${f(g.x)}" cy="${f(g.y)}" rx="${f(g.rx)}" ry="${f(g.ry)}" fill="${rgb(g.c)}" opacity="${Math.round(g.o * 100) / 100}"/>
    ${g.grain.map((d) => dot(d)).join("")}
  </g>`).join("\n")}
  <g>
${stars.map((s) => `    <circle${s.tw ? ` class="tw" style="--d:${f(s.tw.dur)}s;--l:${f(s.tw.delay)}s;--o:${Math.round(s.o * 100) / 100}"` : ""} cx="${f(s.x)}" cy="${f(s.y)}" r="${f(s.s)}" fill="${rgb(s.c)}" opacity="${Math.round(s.o * 100) / 100}"${s.s > 1.4 ? ' filter="url(#glow)"' : ""}/>`).join("\n")}
  </g>
  <g class="meteor"><line x1="${f(W * 0.62)}" y1="${f(H * 0.08)}" x2="${f(W * 0.62 + 90)}" y2="${f(H * 0.08 - 41)}" stroke="url(#streak)" stroke-width="1.4" stroke-linecap="round"/></g>
  <g class="world">
    <circle cx="${f(planet.x)}" cy="${f(planet.y)}" r="${f(planet.rad * 1.9)}" fill="url(#halo)"/>
    ${planet.ringDots.filter((d) => d.back).map((d) => dot(d, dust[0])).join("")}
    <circle cx="${f(planet.x)}" cy="${f(planet.y)}" r="${f(planet.rad + 0.6)}" fill="#06060d" opacity="0.94"/>
    ${planet.dots.map((d) => dot(d)).join("")}
    ${planet.ringDots.filter((d) => !d.back).map((d) => dot(d, dust[0])).join("")}
  </g>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  <g transform="translate(64 0)">
    <text class="k in" x="0" y="148"><tspan fill="#e7b75a">JUSTIN</tspan><tspan fill="#8f8c99">  —  DESIGNER AND ENGINEER</tspan></text>
    <text class="lede in in2" x="0" y="200">I design and build websites people remember,</text>
    <text class="lede in in2" x="0" y="244">and automation that gives you your hours back.</text>
    <text class="k in in3" x="0" y="300" fill="#8f8c99">JUSTINTHEVOID.COM  ↗</text>
  </g>
  <text class="k" x="${W - 40}" y="${H - 34}" text-anchor="end" fill="#8f8c99" opacity="0.8">${sky}</text>
</g>
</svg>
`;
writeFileSync(new URL("./sky.svg", import.meta.url), svg);

// Point the README's banner at the same sky on the homepage.
const readmeUrl = new URL("./README.md", import.meta.url);
try {
  const readme = readFileSync(readmeUrl, "utf8")
    .replace(/https:\/\/justinthevoid\.com\/\?seed=\d+/g, href)
    .replace(/alt="Today's sky[^"]*"/, `alt="Today's sky over justinthevoid.com: ${name}, sky ${seed}"`);
  writeFileSync(readmeUrl, readme);
} catch {}
console.log(`${day}: ${sky} (${(svg.length / 1024).toFixed(1)} KB)`);
