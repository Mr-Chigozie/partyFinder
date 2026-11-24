// Generates the original illustrations used on the login page.
//   node tools/make-art.mjs
// Writes assets/lounge.svg (VIP booth) and assets/crowd.svg (dance floor).

import { mkdirSync, writeFileSync } from 'node:fs';

const W = 600;
const H = 800;

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n) => Math.round(n * 10) / 10;
const pts = (list) => list.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');

const sharedDefs = `
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0"/>
  </filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>
  <filter id="haze" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
  <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
    <stop offset="55%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.75"/>
  </radialGradient>`;

const finish = `
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)"/>`;

function neon(d, color, width = 4, core = '#fff') {
  return `
    <path d="${d}" fill="none" stroke="${color}" stroke-width="${width * 6}" stroke-linecap="round" stroke-linejoin="round" opacity="0.55" filter="url(#bloom)"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="${width * 2.2}" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
    <path d="${d}" fill="none" stroke="${core}" stroke-width="${width * 0.6}" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`;
}

// ---------------------------------------------------------------------------
// Scene 1: VIP lounge booth with a neon map of Africa and a pulsing Abuja pin.
// ---------------------------------------------------------------------------

function lounge() {
  const bL = 170, bR = 430, bT = 210, bB = 520; // back wall
  const cY = 60, fY = 640; // where side walls meet the frame edge

  // Back wall slats.
  let slats = '';
  for (let x = bL + 8; x < bR; x += 13) {
    slats += `<line x1="${x}" y1="${bT}" x2="${x}" y2="${bB}" stroke="#000" stroke-opacity="0.55" stroke-width="2"/>`;
    slats += `<line x1="${x + 2}" y1="${bT}" x2="${x + 2}" y2="${bB}" stroke="#c9a3ff" stroke-opacity="0.08" stroke-width="1"/>`;
  }
  // Side wall slats, denser toward the back for depth.
  for (let i = 1; i < 18; i++) {
    const t = 1 - Math.pow(1 - i / 18, 1.5);
    const x = bL * t;
    const top = cY + (bT - cY) * t;
    const bot = fY + (bB - fY) * t;
    for (const sx of [x, W - x]) {
      slats += `<line x1="${r1(sx)}" y1="${r1(top)}" x2="${r1(sx)}" y2="${r1(bot)}" stroke="#000" stroke-opacity="0.5" stroke-width="${r1(2.6 - t * 1.4)}"/>`;
    }
  }

  // Africa outline, normalised to roughly 100 x 106.
  const africa = [
    [28, 0], [40, 2], [52, 4], [58, 10], [68, 9], [76, 12], [80, 14], [83, 22], [88, 32], [92, 40], [100, 41],
    [96, 52], [88, 62], [86, 72], [84, 80], [80, 88], [74, 96], [66, 104], [58, 106], [54, 98], [50, 86],
    [46, 72], [44, 62], [40, 56], [32, 54], [22, 54], [14, 50], [6, 44], [2, 36], [4, 26], [12, 16], [20, 8],
  ];
  const ax = 245, ay = 236, as = 1.1;
  const africaPath = 'M' + africa.map(([x, y]) => `${r1(ax + x * as)},${r1(ay + y * as)}`).join(' L') + ' Z';
  const madagascar = `M${r1(ax + 93 * as)},${r1(ay + 78 * as)} q4,6 1,14 q-4,-6 -1,-14 Z`;
  const abuja = [ax + 42 * as, ay + 47 * as];

  // Tufted velvet pattern with crystal buttons.
  const tufting = `
    <pattern id="tuft" width="20" height="18" patternUnits="userSpaceOnUse">
      <path d="M0,9 L10,0 L20,9 L10,18 Z" fill="none" stroke="#000" stroke-opacity="0.55" stroke-width="1.4"/>
      <path d="M0,9 L10,0" stroke="#d9b8ff" stroke-opacity="0.12" stroke-width="1"/>
      <circle cx="10" cy="0" r="1.5" fill="#f4e9ff"/><circle cx="10" cy="18" r="1.5" fill="#f4e9ff"/>
      <circle cx="0" cy="9" r="1.5" fill="#f4e9ff"/><circle cx="20" cy="9" r="1.5" fill="#f4e9ff"/>
    </pattern>
    <linearGradient id="velvet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a2580"/><stop offset="0.5" stop-color="#22103d"/><stop offset="1" stop-color="#110820"/>
    </linearGradient>
    <linearGradient id="seat" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6a3bb0"/><stop offset="1" stop-color="#2a1450"/>
    </linearGradient>`;

  // Side booth (left), mirrored for the right.
  const k = (395 - 470) / 168;
  const sideBooth = `
    <g transform="matrix(1,${r1(k * 100) / 100},0,1.15,10,470)">
      <rect x="0" y="0" width="168" height="75" fill="url(#velvet)"/>
      <rect x="0" y="0" width="168" height="75" fill="url(#tuft)"/>
      <rect x="0" y="-4" width="168" height="6" rx="3" fill="#5b2f99"/>
    </g>
    <polygon points="${pts([[0, 566], [178, 481], [210, 500], [0, 655]])}" fill="url(#seat)"/>
    <polygon points="${pts([[210, 500], [210, 528], [0, 690], [0, 655]])}" fill="#13091f"/>
    ${neon('M210,529 L0,691', '#9b5cff', 2)}`;

  // Sparkler sparks on the bottle.
  const rand = rng(7);
  let sparks = '';
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const len = 8 + rand() * 22;
    const x1 = 352 + Math.cos(a) * 4, y1 = 458 + Math.sin(a) * 4;
    const x2 = 352 + Math.cos(a) * len, y2 = 458 + Math.sin(a) * len;
    const dur = (0.4 + rand() * 0.6).toFixed(2);
    sparks += `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="#ffe08a" stroke-width="1.3" stroke-linecap="round">
      <animate attributeName="opacity" values="1;0.1;1" dur="${dur}s" repeatCount="indefinite"/></line>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
  <title>VIP lounge booth under purple neon</title>
  <defs>
    ${sharedDefs}
    ${tufting}
    <linearGradient id="backwall" x1="0" y1="${bT}" x2="0" y2="${bB}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8d4cf5"/><stop offset="0.3" stop-color="#3d1a78"/><stop offset="1" stop-color="#140a26"/>
    </linearGradient>
    <linearGradient id="sidewall" x1="0" y1="${cY}" x2="0" y2="${fY}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#9a5cff"/><stop offset="0.35" stop-color="#3a1872"/><stop offset="1" stop-color="#0d0619"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="${bB}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1a0e2c"/><stop offset="1" stop-color="#07040c"/>
    </linearGradient>
    <radialGradient id="tableTop" cx="50%" cy="40%" r="60%">
      <stop offset="0" stop-color="#3a2c52"/><stop offset="1" stop-color="#0e0a16"/>
    </radialGradient>
    <linearGradient id="bottle" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0c1a10"/><stop offset="0.35" stop-color="#2f5c3a"/><stop offset="1" stop-color="#08120b"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#07040d"/>
  <polygon points="${pts([[0, cY], [bL, bT], [bL, bB], [0, fY]])}" fill="url(#sidewall)"/>
  <polygon points="${pts([[W, cY], [bR, bT], [bR, bB], [W, fY]])}" fill="url(#sidewall)"/>
  <rect x="${bL}" y="${bT}" width="${bR - bL}" height="${bB - bT}" fill="url(#backwall)"/>
  ${slats}
  <polygon points="${pts([[0, 0], [W, 0], [W, cY], [bR, bT], [bL, bT], [0, cY]])}" fill="#05030a"/>
  <polygon points="${pts([[0, fY], [bL, bB], [bR, bB], [W, fY], [W, H], [0, H]])}" fill="url(#floor)"/>

  <!-- ceiling neon -->
  ${neon(`M0,${cY} L${bL},${bT} L${bR},${bT} L${W},${cY}`, '#a35cff', 4, '#f1e4ff')}
  <line x1="${bL}" y1="${bT}" x2="${bL}" y2="${bB}" stroke="#a35cff" stroke-width="6" opacity="0.35" filter="url(#glow)"/>
  <line x1="${bR}" y1="${bT}" x2="${bR}" y2="${bB}" stroke="#a35cff" stroke-width="6" opacity="0.35" filter="url(#glow)"/>

  <!-- neon Africa with Abuja pin -->
  ${neon(africaPath, '#ff4fc8', 2.2, '#ffe3f6')}
  ${neon(madagascar, '#ff4fc8', 1.6, '#ffe3f6')}
  <circle cx="${r1(abuja[0])}" cy="${r1(abuja[1])}" r="10" fill="#ffd23f" opacity="0.5" filter="url(#glow)">
    <animate attributeName="r" values="6;16;6" dur="1.8s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.8s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${r1(abuja[0])}" cy="${r1(abuja[1])}" r="3.6" fill="#fff6cf"/>

  <!-- back booth -->
  <rect x="176" y="392" width="248" height="80" fill="url(#velvet)"/>
  <rect x="176" y="392" width="248" height="80" fill="url(#tuft)"/>
  <rect x="174" y="387" width="252" height="8" rx="4" fill="#5b2f99"/>
  <rect x="176" y="470" width="248" height="32" fill="url(#seat)"/>
  <rect x="176" y="500" width="248" height="26" fill="#13091f"/>
  ${neon('M176,527 L424,527', '#9b5cff', 2)}

  <!-- side booths -->
  ${sideBooth}
  <g transform="translate(${W},0) scale(-1,1)">${sideBooth}</g>

  <!-- floor glow -->
  <ellipse cx="300" cy="705" rx="190" ry="48" fill="#8a3cff" opacity="0.45" filter="url(#bloom)"/>

  <!-- table -->
  <rect x="292" y="575" width="16" height="120" fill="#160f22"/>
  <rect x="297" y="575" width="3" height="120" fill="#b89bff" opacity="0.35"/>
  <ellipse cx="300" cy="698" rx="58" ry="14" fill="#120b1d"/>
  ${neon('M242,698 A58,14 0 1,0 358,698 A58,14 0 1,0 242,698', '#b07cff', 1.6)}
  <ellipse cx="300" cy="568" rx="96" ry="23" fill="url(#tableTop)" stroke="#a48cc9" stroke-width="3"/>
  <path d="M212,562 A96,23 0 0,1 388,562" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.4"/>

  <!-- reserved card -->
  <rect x="262" y="528" width="26" height="38" rx="2" fill="#0d0a12" stroke="#7d5bb5" stroke-width="1"/>
  <circle cx="275" cy="541" r="5" fill="none" stroke="#ffd23f" stroke-width="1.6"/>
  <rect x="267" y="551" width="16" height="2" fill="#cdbbe8" opacity="0.8"/>
  <rect x="269" y="556" width="12" height="2" fill="#cdbbe8" opacity="0.5"/>

  <!-- bottle service with sparkler -->
  <path d="M340,568 L340,516 Q340,504 347,498 L347,478 L357,478 L357,498 Q364,504 364,516 L364,568 Z" fill="url(#bottle)"/>
  <rect x="346" y="474" width="12" height="7" fill="#d4af37"/>
  <rect x="343" y="525" width="18" height="22" fill="#d4af37" opacity="0.85"/>
  <line x1="352" y1="474" x2="352" y2="460" stroke="#888" stroke-width="1.5"/>
  <circle cx="352" cy="458" r="9" fill="#fff2b0" filter="url(#glow)">
    <animate attributeName="r" values="7;11;7" dur="0.35s" repeatCount="indefinite"/>
  </circle>
  ${sparks}
  <circle cx="352" cy="458" r="2.5" fill="#fff"/>

  ${finish}
</svg>`;
}

// ---------------------------------------------------------------------------
// Scene 2: dance floor — African crowd silhouettes, confetti, stage lights.
// ---------------------------------------------------------------------------

const ARMS = {
  up: [[70, -30], [62, -140]],
  v: [[85, -10], [122, -108]],
  high: [[55, -62], [40, -172]],
  clap: [[76, -42], [12, -152]],
  wave: [[92, -22], [104, -128]],
  down: [[62, 110], [56, 200]],
};

function hair(style, c) {
  switch (style) {
    case 'afro': {
      let s = `<circle cx="0" cy="-16" r="36" fill="${c}"/>`;
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        s += `<circle cx="${r1(Math.cos(a) * 33)}" cy="${r1(-16 + Math.sin(a) * 33)}" r="9" fill="${c}"/>`;
      }
      return s;
    }
    case 'puffs':
      return `<circle cx="-24" cy="-28" r="17" fill="${c}"/><circle cx="24" cy="-28" r="17" fill="${c}"/>`;
    case 'gele':
      return `<path d="M-26,-2 C-64,-18 -66,-64 -32,-64 C-22,-96 32,-98 42,-66 C74,-66 76,-22 34,-6 Z" fill="${c}"/>
        <path d="M-44,-40 C-30,-52 -10,-58 8,-56 M-20,-72 C0,-62 20,-60 52,-50" fill="none" stroke="${c}" stroke-width="4"/>`;
    case 'braids': {
      let s = `<ellipse cx="0" cy="-6" rx="21" ry="25" fill="${c}"/>`;
      const ends = [[-58, 70], [-46, 92], [-30, 104], [30, 104], [46, 92], [60, 66], [70, 40]];
      for (const [ex, ey] of ends) {
        s += `<path d="M${r1(ex * 0.25)},-6 Q${r1(ex * 0.8)},${r1(ey * 0.3)} ${ex},${ey}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'locs': {
      let s = `<ellipse cx="0" cy="-10" rx="24" ry="26" fill="${c}"/><circle cx="0" cy="-36" r="15" fill="${c}"/>`;
      const ends = [[-46, 40], [-38, 58], [-24, 64], [26, 62], [40, 54], [50, 34]];
      for (const [ex, ey] of ends) {
        s += `<path d="M${r1(ex * 0.3)},-14 Q${r1(ex * 0.9)},${r1(ey * 0.2)} ${ex},${ey}" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`;
      }
      return s;
    }
    default:
      return `<ellipse cx="0" cy="-4" rx="21" ry="25" fill="${c}"/>`;
  }
}

function silhouette(p, c) {
  const [sh, sw] = [44, 45];
  const arm = (side, key) => {
    const [[ex, ey], [hx, hy]] = ARMS[key];
    const sx = side * sh;
    const e = [side * ex, ey];
    const h = [side * hx, hy];
    return `<path d="M${sx},${sw} L${e[0]},${e[1]}" stroke="${c}" stroke-width="21" stroke-linecap="round"/>
      <path d="M${e[0]},${e[1]} L${h[0]},${h[1]}" stroke="${c}" stroke-width="16" stroke-linecap="round"/>
      <ellipse cx="${h[0]}" cy="${h[1] - 5}" rx="7" ry="9" fill="${c}"/>`;
  };
  return `
    ${hair(p.hair, c)}
    <ellipse cx="0" cy="0" rx="19" ry="23" fill="${c}"/>
    <rect x="-9" y="14" width="18" height="26" fill="${c}"/>
    <path d="M-50,62 C-52,42 -40,34 -22,32 L22,32 C40,34 52,42 50,62 L58,460 L-58,460 Z" fill="${c}"/>
    ${arm(-1, p.left)}${arm(1, p.right)}`;
}

function props(p) {
  let s = '';
  for (const side of [-1, 1]) {
    const key = side < 0 ? p.left : p.right;
    const [, [hx, hy]] = ARMS[key];
    const x = side * hx;
    const y = hy - 6;
    const item = side < 0 ? p.leftHolds : p.rightHolds;
    if (item === 'glass') {
      s += `<path d="M${x - 7},${y - 46} L${x + 7},${y - 46} L${x + 3},${y - 18} L${x - 3},${y - 18} Z" fill="#ffe7a8" fill-opacity="0.45" stroke="#fff" stroke-opacity="0.75" stroke-width="1.2"/>
        <line x1="${x}" y1="${y - 18}" x2="${x}" y2="${y - 6}" stroke="#fff" stroke-opacity="0.6" stroke-width="1.4"/>`;
    }
    if (item === 'phone') {
      s += `<rect x="${x - 9}" y="${y - 36}" width="18" height="30" rx="3" fill="#d8ecff" filter="url(#glowSmall)"/>
        <rect x="${x - 7}" y="${y - 33}" width="14" height="24" rx="2" fill="#9fd0ff"/>
        <rect x="${x - 7}" y="${y - 33}" width="14" height="10" rx="2" fill="#ff8fc8" opacity="0.7"/>`;
    }
  }
  if (p.hoops) {
    s += `<circle cx="-19" cy="16" r="6" fill="none" stroke="#f3c75f" stroke-width="1.6"/><circle cx="19" cy="16" r="6" fill="none" stroke="#f3c75f" stroke-width="1.6"/>`;
  }
  return s;
}

function person(p, fill) {
  const t = `translate(${p.x},${p.y}) rotate(${p.rot}) scale(${p.s})`;
  return `
  <g transform="${t}">
    <g transform="translate(-3.5,-1)" filter="url(#soft)" opacity="0.95">${silhouette(p, '#3d8bff')}</g>
    <g transform="translate(3.5,-1)" filter="url(#soft)" opacity="0.95">${silhouette(p, '#ff6a3d')}</g>
    ${silhouette(p, fill)}
    ${props(p)}
  </g>`;
}

function crowd() {
  const rand = rng(42);
  const back = [
    { x: 60, y: 470, s: 0.78, rot: -6, hair: 'short', left: 'v', right: 'v' },
    { x: 172, y: 452, s: 0.8, rot: 4, hair: 'puffs', left: 'down', right: 'high', rightHolds: 'phone', hoops: true },
    { x: 300, y: 440, s: 0.82, rot: -3, hair: 'gele', left: 'wave', right: 'wave', hoops: true },
    { x: 424, y: 458, s: 0.8, rot: 6, hair: 'afro', left: 'up', right: 'down', leftHolds: 'glass' },
    { x: 548, y: 470, s: 0.78, rot: -4, hair: 'locs', left: 'v', right: 'v' },
  ];
  const front = [
    { x: 38, y: 610, s: 1.25, rot: 5, hair: 'short', left: 'down', right: 'high', rightHolds: 'phone' },
    { x: 178, y: 566, s: 1.25, rot: -5, hair: 'afro', left: 'up', right: 'up' },
    { x: 322, y: 604, s: 1.28, rot: 3, hair: 'braids', left: 'v', right: 'v', rightHolds: 'glass' },
    { x: 460, y: 574, s: 1.24, rot: -4, hair: 'puffs', left: 'clap', right: 'clap', hoops: true },
    { x: 590, y: 616, s: 1.25, rot: 7, hair: 'gele', left: 'high', right: 'down', leftHolds: 'glass', hoops: true },
  ];

  const colors = ['#f7f3e8', '#ffd166', '#c0c7d6', '#ff7ab6', '#7ad7ff', '#e6e9f0'];
  const confetti = (n, yMax, blur, scale) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = rand() * W, y = rand() * yMax;
      const w = (4 + rand() * 6) * scale, h = (2 + rand() * 3) * scale;
      const c = colors[Math.floor(rand() * colors.length)];
      s += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${c}" opacity="${(0.45 + rand() * 0.5).toFixed(2)}" transform="rotate(${Math.round(rand() * 180)} ${r1(x)} ${r1(y)})"/>`;
    }
    return `<g ${blur ? 'filter="url(#soft)"' : ''}>${s}</g>`;
  };

  // Disco ball facets.
  let ball = '';
  for (let i = -3; i <= 3; i++) {
    ball += `<line x1="${290 + i * 10}" y1="52" x2="${290 + i * 10}" y2="128" stroke="#0a0f1d" stroke-width="1"/>`;
    ball += `<line x1="252" y1="${90 + i * 10}" x2="328" y2="${90 + i * 10}" stroke="#0a0f1d" stroke-width="1"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
  <title>African crowd dancing under stage lights and confetti</title>
  <defs>
    ${sharedDefs}
    <filter id="glowSmall" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
    <clipPath id="ballClip"><circle cx="290" cy="90" r="38"/></clipPath>
    <radialGradient id="blueLight" cx="90" cy="300" r="380" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#5aa8ff"/><stop offset="0.25" stop-color="#1f5cff" stop-opacity="0.8"/><stop offset="1" stop-color="#0a1a5c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="redLight" cx="520" cy="290" r="360" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffb347"/><stop offset="0.2" stop-color="#ff3b3b" stop-opacity="0.85"/><stop offset="1" stop-color="#5c0a2a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ballShade" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#eef3ff"/><stop offset="0.5" stop-color="#7f8db5"/><stop offset="1" stop-color="#1b2340"/>
    </radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#03050d"/>
  <rect width="${W}" height="${H}" fill="url(#blueLight)"/>
  <rect width="${W}" height="${H}" fill="url(#redLight)"/>
  <ellipse cx="320" cy="250" rx="220" ry="150" fill="#b0329c" opacity="0.25" filter="url(#haze)"/>

  <!-- light beams -->
  <polygon points="90,300 -60,0 60,0" fill="url(#beam)" opacity="0.6"/>
  <polygon points="90,300 160,0 260,0" fill="url(#beam)" opacity="0.4"/>
  <polygon points="520,290 420,0 500,0" fill="url(#beam)" opacity="0.5"/>
  <polygon points="520,290 600,0 700,0" fill="url(#beam)" opacity="0.4"/>

  <!-- disco ball -->
  <line x1="290" y1="0" x2="290" y2="52" stroke="#4a5574" stroke-width="2"/>
  <circle cx="290" cy="90" r="38" fill="url(#ballShade)"/>
  <g clip-path="url(#ballClip)">${ball}</g>
  <circle cx="276" cy="76" r="4" fill="#fff" filter="url(#soft)">
    <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite"/>
  </circle>
  <circle cx="302" cy="104" r="3" fill="#fff" filter="url(#soft)">
    <animate attributeName="opacity" values="0.2;1;0.2" dur="1.1s" repeatCount="indefinite"/>
  </circle>

  <!-- stage lights -->
  <circle cx="90" cy="300" r="34" fill="#cfe6ff" filter="url(#bloom)"/>
  <circle cx="90" cy="300" r="12" fill="#fff"/>
  <ellipse cx="90" cy="300" rx="120" ry="2.5" fill="#bcdcff" opacity="0.7"/>
  <circle cx="520" cy="290" r="36" fill="#ffd27a" filter="url(#bloom)"/>
  <circle cx="520" cy="290" r="13" fill="#fff4dc"/>
  <ellipse cx="520" cy="290" rx="130" ry="2.5" fill="#ffd9a8" opacity="0.7"/>

  <!-- far confetti -->
  <g>
    <animateTransform attributeName="transform" type="translate" values="0,-10; 0,14; 0,-10" dur="9s" repeatCount="indefinite"/>
    ${confetti(110, 520, true, 0.7)}
  </g>

  <!-- back row -->
  ${back.map((p) => person(p, '#0b1330')).join('')}
  <rect x="0" y="420" width="${W}" height="200" fill="#0a1440" opacity="0.35" filter="url(#haze)"/>

  <!-- front row -->
  ${front.map((p) => person(p, '#020309')).join('')}

  <!-- near confetti -->
  <g>
    <animateTransform attributeName="transform" type="translate" values="0,0; 0,22; 0,0" dur="7s" repeatCount="indefinite"/>
    ${confetti(50, 700, false, 1.3)}
  </g>
  ${confetti(14, 760, true, 2.4)}

  ${finish}
</svg>`;
}

mkdirSync(new URL('../assets/', import.meta.url), { recursive: true });
writeFileSync(new URL('../assets/lounge.svg', import.meta.url), lounge());
writeFileSync(new URL('../assets/crowd.svg', import.meta.url), crowd());
console.log('Wrote assets/lounge.svg and assets/crowd.svg');
