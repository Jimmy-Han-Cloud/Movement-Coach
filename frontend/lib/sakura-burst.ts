/**
 * Sakura burst + rain effect — pure DOM / Web Animations API.
 * Only call from client-side code (useEffect, event handlers).
 */

let _petalId = 0;
let _rainTimer: ReturnType<typeof setInterval> | null = null;
let _windTimer: ReturnType<typeof setInterval> | null = null;

// Global wind strength: -1 (left) to +1 (right), drifts slowly over time
let _wind = (Math.random() - 0.5) * 1.2;

const PALETTES = [
  ["#FFE4EC", "#FFB6CD"],
  ["#FFC8D8", "#FF8FAB"],
  ["#FF9EC0", "#E85D88"],
  ["#FFCBA4", "#F4906A"],
] as const;

const PETAL_PATH =
  "M 11 1 Q 20 6 19 15 Q 17 22 12 22 Q 11 19 11 17 Q 11 19 10 22 Q 5 22 3 15 Q 2 6 11 1 Z";
const VEIN_PATH = "M 11 5 Q 11 12 11 17";

function makeSVG(): SVGSVGElement {
  const id  = `sk${_petalId++}`;
  const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const ns  = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(ns, "svg") as SVGSVGElement;
  svg.setAttribute("viewBox", "0 0 22 24");
  svg.setAttribute("width", "22");
  svg.setAttribute("height", "24");
  svg.style.width = "100%";
  svg.style.height = "100%";

  const defs = document.createElementNS(ns, "defs");
  const grad = document.createElementNS(ns, "linearGradient");
  grad.id = id;
  grad.setAttribute("x1", "0%"); grad.setAttribute("y1", "0%");
  grad.setAttribute("x2", "100%"); grad.setAttribute("y2", "100%");

  const s1 = document.createElementNS(ns, "stop");
  s1.setAttribute("offset", "0%");
  s1.setAttribute("stop-color", pal[0]);

  const s2 = document.createElementNS(ns, "stop");
  s2.setAttribute("offset", "100%");
  s2.setAttribute("stop-color", pal[1]);

  grad.append(s1, s2);
  defs.append(grad);

  const shape = document.createElementNS(ns, "path");
  shape.setAttribute("d", PETAL_PATH);
  shape.setAttribute("fill", `url(#${id})`);

  const vein = document.createElementNS(ns, "path");
  vein.setAttribute("d", VEIN_PATH);
  vein.setAttribute("stroke", pal[1]);
  vein.setAttribute("stroke-opacity", "0.35");
  vein.setAttribute("stroke-width", "0.8");
  vein.setAttribute("fill", "none");

  svg.append(defs, shape, vein);
  return svg;
}

function spawnDiv(x: number, y: number, tag: string, scale = 1): HTMLDivElement {
  const w = Math.round(22 * scale);
  const h = Math.round(24 * scale);
  const div = document.createElement("div");
  div.style.cssText = [
    "position:fixed",
    `left:${x}px`,
    `top:${y}px`,
    `width:${w}px`,
    `height:${h}px`,
    "pointer-events:none",
    "will-change:transform,opacity",
    "z-index:2",
  ].join(";");
  div.dataset.sakura = tag;
  div.append(makeSVG());
  document.body.append(div);
  return div;
}

// ── Burst petal ──────────────────────────────────────────────────

function launchPetal(
  cx: number,
  cy: number,
  angle: number,
  distMult: number,
  maxReach: number,
) {
  const scale = 0.5 + Math.random() * 0.9;
  const dist  = maxReach * distMult;
  const dx    = Math.cos(angle) * dist;
  const dy    = Math.sin(angle) * dist + 80 + Math.random() * 280;

  const windMag = Math.cos(angle) > 0 ? 220 : 150;
  const perpX   = -Math.sin(angle);
  const perpY   = Math.cos(angle);
  const wind    = (Math.random() - 0.5) * windMag;
  const midX    = dx * 0.28 + perpX * wind;
  const midY    = dy * 0.22 + perpY * wind;

  const rot0 = Math.random() * 360;
  const rd   = (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 120);
  const dur  = 4000 + Math.random() * 3500;
  const del  = Math.random() * 350;

  const div = spawnDiv(cx - Math.round(11 * scale), cy - Math.round(12 * scale), "burst", scale);

  div.animate(
    [
      { transform: `translate(0,0) rotate(${rot0}deg) scale(${0.5})`,                             opacity: 0.9, offset: 0    },
      { transform: `translate(${midX}px,${midY}px) rotate(${rot0 + rd * 0.5}deg) scale(${1})`,   opacity: 1,   offset: 0.65 },
      { transform: `translate(${dx}px,${dy}px) rotate(${rot0 + rd}deg) scale(${0.5})`,            opacity: 0,   offset: 1    },
    ],
    { duration: dur, delay: del, easing: "cubic-bezier(0.05, 0.5, 0.15, 1)", fill: "forwards" },
  ).onfinish = () => div.remove();
}

// ── Rain petal ───────────────────────────────────────────────────

function spawnRainPetal() {
  const x     = Math.random() * window.innerWidth;
  const scale = 0.4 + Math.random() * 1.1;           // 0.4x – 1.5x size variety
  const div   = spawnDiv(x, -Math.round(30 * scale), "rain", scale);

  // Wind: global direction + personal sway oscillation
  const windDrift  = _wind * window.innerWidth * 0.18;
  const personal   = (Math.random() - 0.5) * 100;
  const totalDrift = windDrift + personal;

  // Sway amplitude per petal — smaller petals sway more
  const swayAmp = (30 + Math.random() * 60) * (1.2 - scale * 0.3);
  const swayDir = Math.random() > 0.5 ? 1 : -1;

  const rot = Math.random() * 360;
  const rd  = (Math.random() > 0.5 ? 1 : -1) * (90 + Math.random() * 200);
  const dur = 5000 + Math.random() * 5000;

  // S-curve: petal sways as it drifts down, not a straight line
  div.animate(
    [
      {
        transform: `translate(0,0) rotate(${rot}deg) scale(0.8)`,
        opacity: 0, offset: 0,
      },
      {
        transform: `translate(0,0) rotate(${rot}deg) scale(1)`,
        opacity: 0.85, offset: 0.05,
      },
      {
        transform: `translate(${totalDrift * 0.25 + swayAmp * swayDir}px,22vh) rotate(${rot + rd * 0.22}deg) scale(1)`,
        opacity: 0.9, offset: 0.25,
      },
      {
        transform: `translate(${totalDrift * 0.5 - swayAmp * swayDir * 0.6}px,48vh) rotate(${rot + rd * 0.48}deg) scale(0.97)`,
        opacity: 0.85, offset: 0.5,
      },
      {
        transform: `translate(${totalDrift * 0.75 + swayAmp * swayDir * 0.4}px,74vh) rotate(${rot + rd * 0.74}deg) scale(0.9)`,
        opacity: 0.7, offset: 0.75,
      },
      {
        transform: `translate(${totalDrift}px,112vh) rotate(${rot + rd}deg) scale(0.7)`,
        opacity: 0, offset: 1,
      },
    ],
    { duration: dur, easing: "linear", fill: "forwards" },
  ).onfinish = () => div.remove();
}

// ── Wind simulation ───────────────────────────────────────────────

function startWind() {
  _wind = (Math.random() - 0.5) * 1.2;
  _windTimer = setInterval(() => {
    // Gradually shift wind direction with small random steps
    _wind += (Math.random() - 0.5) * 0.4;
    _wind = Math.max(-1.5, Math.min(1.5, _wind));
  }, 1800);
}

function stopWind() {
  if (_windTimer) { clearInterval(_windTimer); _windTimer = null; }
}

// ── Public API ───────────────────────────────────────────────────

/** Burst ring + petals from (cx, cy). Call on Go bubble click. */
export function triggerBurst(cx: number, cy: number) {
  const maxReach = Math.hypot(window.innerWidth, window.innerHeight) * 0.65;

  // Expanding ring
  const ring = document.createElement("div");
  ring.style.cssText = [
    "position:fixed",
    `left:${cx}px`,
    `top:${cy}px`,
    "width:60px",
    "height:60px",
    "border-radius:50%",
    "border:3px solid rgba(255,182,205,0.9)",
    "pointer-events:none",
    "z-index:2",
  ].join(";");
  document.body.append(ring);
  ring.animate(
    [
      { transform: "translate(-50%,-50%) scale(1)",    opacity: 1, borderWidth: "3px" },
      { transform: "translate(-50%,-50%) scale(6.33)", opacity: 0, borderWidth: "0px" },
    ],
    { duration: 550, easing: "ease-out", fill: "forwards" },
  ).onfinish = () => ring.remove();

  // 140 uniformly-distributed petals with left bias
  for (let i = 0; i < 140; i++) {
    const angle    = (i / 140) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const distMult = Math.cos(angle) < 0
      ? 2.5 + Math.random() * 1.3
      : 0.7 + Math.random() * 1.3;
    launchPetal(cx, cy, angle, distMult, maxReach);
  }

  // 50 extra petals targeting upper-left → up
  for (let j = 0; j < 50; j++) {
    const angle    = 2.8 + (j / 50) * 2.7 + (Math.random() - 0.5) * 0.35;
    const distMult = 2.0 + Math.random() * 2.0;
    launchPetal(cx, cy, angle, distMult, maxReach);
  }
}

/** Start continuous sakura rain from top. Call ~3s after triggerBurst. */
export function startRain() {
  if (_rainTimer) return;
  startWind();
  let tick = 0;
  _rainTimer = setInterval(() => {
    const count = tick < 15 ? 3 : 2;
    for (let i = 0; i < count; i++) spawnRainPetal();
    tick++;
  }, 120);
}

/** Stop rain and remove all in-flight rain petals. Call before navigation. */
export function stopRain() {
  if (_rainTimer) {
    clearInterval(_rainTimer);
    _rainTimer = null;
  }
  stopWind();
  document.querySelectorAll("[data-sakura='rain']").forEach((el) => el.remove());
}
