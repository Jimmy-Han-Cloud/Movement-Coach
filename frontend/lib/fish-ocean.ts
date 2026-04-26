/**
 * Fish ocean background — pure DOM / Web Animations API.
 * Only call from client-side code (useEffect, event handlers).
 */

let _fishTimer:   ReturnType<typeof setInterval> | null = null;
let _bubbleTimer: ReturnType<typeof setInterval> | null = null;
let _overlay:     HTMLDivElement | null = null;

const PALETTES = [
  { body: "#FF8C42", belly: "#FFD19A", fin: "#D96820", eye: "#3d1500" }, // orange
  { body: "#29B6F6", belly: "#B3E5FC", fin: "#0277BD", eye: "#01447a" }, // blue
  { body: "#66BB6A", belly: "#C8E6C9", fin: "#2E7D32", eye: "#1a4a1c" }, // green
  { body: "#FFD54F", belly: "#FFFDE7", fin: "#F9A825", eye: "#3E2723" }, // yellow
  { body: "#F06292", belly: "#FCE4EC", fin: "#AD1457", eye: "#560a2f" }, // pink
  { body: "#AB47BC", belly: "#E1BEE7", fin: "#6A1B9A", eye: "#38006b" }, // purple
] as const;

function makeFishSVG(pal: typeof PALETTES[number]): SVGSVGElement {
  const ns  = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg") as SVGSVGElement;
  svg.setAttribute("viewBox", "0 0 64 34");
  svg.setAttribute("width", "64"); svg.setAttribute("height", "34");
  svg.style.cssText = "width:100%;height:100%";

  // Tail
  const tail = document.createElementNS(ns, "path");
  tail.setAttribute("d", "M 13 17 L 0 6 L 0 28 Z");
  tail.setAttribute("fill", pal.fin);
  svg.append(tail);

  // Body
  const body = document.createElementNS(ns, "ellipse");
  body.setAttribute("cx", "36"); body.setAttribute("cy", "17");
  body.setAttribute("rx", "22"); body.setAttribute("ry", "12");
  body.setAttribute("fill", pal.body);
  svg.append(body);

  // Belly highlight
  const belly = document.createElementNS(ns, "ellipse");
  belly.setAttribute("cx", "37"); belly.setAttribute("cy", "20");
  belly.setAttribute("rx", "14"); belly.setAttribute("ry", "7");
  belly.setAttribute("fill", pal.belly); belly.setAttribute("opacity", "0.55");
  svg.append(belly);

  // Dorsal fin
  const dFin = document.createElementNS(ns, "path");
  dFin.setAttribute("d", "M 28 5 Q 36 -3 44 5");
  dFin.setAttribute("stroke", pal.fin); dFin.setAttribute("stroke-width", "2.5");
  dFin.setAttribute("fill", "none"); dFin.setAttribute("stroke-linecap", "round");
  svg.append(dFin);

  // Pectoral fin
  const pFin = document.createElementNS(ns, "ellipse");
  pFin.setAttribute("cx", "32"); pFin.setAttribute("cy", "21");
  pFin.setAttribute("rx", "7"); pFin.setAttribute("ry", "4");
  pFin.setAttribute("fill", pal.fin); pFin.setAttribute("opacity", "0.65");
  pFin.setAttribute("transform", "rotate(-25 32 21)");
  svg.append(pFin);

  // White of eye
  const eyeW = document.createElementNS(ns, "circle");
  eyeW.setAttribute("cx", "50"); eyeW.setAttribute("cy", "13");
  eyeW.setAttribute("r", "3.5"); eyeW.setAttribute("fill", "white");
  svg.append(eyeW);

  // Pupil
  const pupil = document.createElementNS(ns, "circle");
  pupil.setAttribute("cx", "51"); pupil.setAttribute("cy", "13");
  pupil.setAttribute("r", "2"); pupil.setAttribute("fill", pal.eye);
  svg.append(pupil);

  // Optional stripe
  if (Math.random() > 0.5) {
    const stripe = document.createElementNS(ns, "line");
    stripe.setAttribute("x1", "33"); stripe.setAttribute("y1", "5");
    stripe.setAttribute("x2", "33"); stripe.setAttribute("y2", "29");
    stripe.setAttribute("stroke", "rgba(255,255,255,0.25)"); stripe.setAttribute("stroke-width", "3");
    svg.append(stripe);
  }

  return svg;
}

function spawnFish() {
  const goRight = Math.random() > 0.5;
  const pal     = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const scale   = 0.55 + Math.random() * 1.1;
  const w = Math.round(64 * scale);
  const h = Math.round(34 * scale);

  const startX = goRight ? -w : window.innerWidth + w;
  const dx     = goRight ? window.innerWidth + w * 2 : -(window.innerWidth + w * 2);
  const y      = window.innerHeight * (0.18 + Math.random() * 0.64);
  const swayY  = (Math.random() - 0.5) * 50;

  const div = document.createElement("div");
  div.style.cssText = [
    "position:fixed",
    `left:${startX}px`, `top:${y - h / 2}px`,
    `width:${w}px`, `height:${h}px`,
    "pointer-events:none",
    "will-change:transform,opacity",
    "z-index:2",
  ].join(";");
  div.dataset.ocean = "fish";

  const svg = makeFishSVG(pal);
  if (!goRight) svg.style.transform = "scaleX(-1)";
  div.append(svg);
  document.body.append(div);

  const dur = 7000 + Math.random() * 8000;
  div.animate([
    { transform: `translateX(0) translateY(0) rotate(0deg)`,         opacity: 0,    offset: 0    },
    { transform: `translateX(${dx*0.04}px) translateY(0) rotate(0deg)`,  opacity: 0.88, offset: 0.04 },
    { transform: `translateX(${dx*0.25}px) translateY(${swayY}px) rotate(-2deg)`,  opacity: 0.9, offset: 0.25 },
    { transform: `translateX(${dx*0.5}px)  translateY(0px)          rotate(2deg)`,  opacity: 0.9, offset: 0.5  },
    { transform: `translateX(${dx*0.75}px) translateY(${swayY}px) rotate(-2deg)`,  opacity: 0.9, offset: 0.75 },
    { transform: `translateX(${dx*0.96}px) translateY(0px)          rotate(2deg)`,  opacity: 0.88, offset: 0.96 },
    { transform: `translateX(${dx}px)      translateY(0) rotate(0deg)`,             opacity: 0,    offset: 1    },
  ], { duration: dur, easing: "linear", fill: "forwards" }).onfinish = () => div.remove();
}

function spawnBubble(x?: number, y?: number) {
  const bx   = x ?? Math.random() * window.innerWidth;
  const by   = y ?? window.innerHeight * (0.4 + Math.random() * 0.55);
  const size = 5 + Math.random() * 12;
  const div  = document.createElement("div");
  div.style.cssText = [
    "position:fixed",
    `left:${bx - size / 2}px`, `top:${by}px`,
    `width:${size}px`, `height:${size}px`,
    "border-radius:50%",
    "border:1.5px solid rgba(160,210,255,0.55)",
    "background:rgba(200,235,255,0.12)",
    "pointer-events:none",
    "will-change:transform,opacity",
    "z-index:2",
  ].join(";");
  div.dataset.ocean = "bubble";
  document.body.append(div);

  const drift = (Math.random() - 0.5) * 50;
  const dur   = 3500 + Math.random() * 3000;
  div.animate([
    { transform: "translateX(0) translateY(0)",              opacity: 0,   offset: 0 },
    { transform: "translateX(0) translateY(0)",              opacity: 0.7, offset: 0.08 },
    { transform: `translateX(${drift}px) translateY(-70vh)`, opacity: 0.3, offset: 0.9 },
    { transform: `translateX(${drift}px) translateY(-80vh)`, opacity: 0,   offset: 1   },
  ], { duration: dur, easing: "ease-in", fill: "forwards" }).onfinish = () => div.remove();
}

function addOverlay() {
  if (_overlay) return;
  const div = document.createElement("div");
  div.style.cssText = [
    "position:fixed", "inset:0",
    "pointer-events:none", "z-index:1",
    "background:linear-gradient(180deg,rgba(0,50,110,0.13) 0%,rgba(0,90,170,0.07) 100%)",
  ].join(";");
  div.dataset.ocean = "overlay";
  document.body.append(div);
  div.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, fill: "forwards" });
  _overlay = div;
}

function removeOverlay() {
  if (!_overlay) return;
  const el = _overlay;
  _overlay = null;
  el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" })
    .onfinish = () => el.remove();
}

// ── Public API ────────────────────────────────────────────────────

/** Bubble burst from (cx, cy). Call on Go bubble click. */
export function triggerBubbleBurst(cx: number, cy: number) {
  // Ripple ring
  const ring = document.createElement("div");
  ring.style.cssText = [
    "position:fixed", `left:${cx}px`, `top:${cy}px`,
    "width:55px", "height:55px", "border-radius:50%",
    "border:2.5px solid rgba(100,180,255,0.85)",
    "pointer-events:none", "z-index:2",
  ].join(";");
  document.body.append(ring);
  ring.animate([
    { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
    { transform: "translate(-50%,-50%) scale(6)", opacity: 0 },
  ], { duration: 520, easing: "ease-out", fill: "forwards" }).onfinish = () => ring.remove();

  // Burst bubbles
  for (let i = 0; i < 30; i++) {
    spawnBubble(cx + (Math.random() - 0.5) * 80, cy + (Math.random() - 0.5) * 80);
  }
}

/** Start fish + bubbles. Call ~2s after triggerBubbleBurst. */
export function startFishOcean() {
  if (_fishTimer) return;
  addOverlay();
  let tick = 0;
  _fishTimer = setInterval(() => {
    if (tick % 4 === 0) spawnFish();
    tick++;
  }, 600);
  _bubbleTimer = setInterval(() => spawnBubble(), 900);
}

/** Stop ocean and remove all elements. Call before navigation. */
export function stopFishOcean() {
  if (_fishTimer)   { clearInterval(_fishTimer);   _fishTimer   = null; }
  if (_bubbleTimer) { clearInterval(_bubbleTimer); _bubbleTimer = null; }
  removeOverlay();
  document.querySelectorAll("[data-ocean]").forEach((el) => el.remove());
}
