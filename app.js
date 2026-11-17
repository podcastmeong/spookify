'use strict';
/* Spookify — Kiroween 2026, Costume Contest.
   Pure client-side app: photo upload, 6 Halloween canvas effects,
   procedural horror-story generator, PNG download, copy story.
   No backend, no external assets. */

/* ---------------- utilities ---------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* ---------------- state ---------------- */
const state = {
  image: null,          // HTMLImageElement (upload or sample)
  imageName: 'sample scene',
  effectId: 'blood-moon',
  intensity: 0.85,      // 0..1
  story: null,
};
const MAX_EDGE = 1200;

const stage = document.getElementById('stage');
const ctx = stage.getContext('2d');
const supportsFilter = 'filter' in ctx;

/* ---------------- overlay helpers ---------------- */
function vignette(c, w, h, strength) {
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,' + strength.toFixed(2) + ')');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}
function grain(c, w, h, rng, amount) {
  c.save();
  c.globalAlpha = amount;
  const n = Math.floor(w * h / 900);
  for (let i = 0; i < n; i++) {
    const v = Math.floor(rng() * 255);
    c.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
    c.fillRect(rng() * w, rng() * h, 1.4, 1.4);
  }
  c.restore();
}
function drawMoon(c, w, h, x, y, r, color, glow) {
  const g = c.createRadialGradient(x, y, r * 0.2, x, y, r * 2.2);
  g.addColorStop(0, glow);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color; c.fill();
  // craters
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.beginPath(); c.arc(x - r * 0.3, y - r * 0.2, r * 0.18, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.25, y + r * 0.3, r * 0.13, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.1, y - r * 0.45, r * 0.1, 0, Math.PI * 2); c.fill();
}
function drawBat(c, x, y, s, alpha) {
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = '#0a0a0a';
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x - s * 0.9, y - s * 0.9, x - s * 1.8, y - s * 0.15);
  c.quadraticCurveTo(x - s * 1.1, y + s * 0.1, x - s * 0.7, y + s * 0.35);
  c.quadraticCurveTo(x - s * 0.35, y + s * 0.1, x, y + s * 0.25);
  c.quadraticCurveTo(x + s * 0.35, y + s * 0.1, x + s * 0.7, y + s * 0.35);
  c.quadraticCurveTo(x + s * 1.1, y + s * 0.1, x + s * 1.8, y - s * 0.15);
  c.quadraticCurveTo(x + s * 0.9, y - s * 0.9, x, y);
  c.fill();
  c.restore();
}
function drawBats(c, w, h, rng, count, alpha) {
  for (let i = 0; i < count; i++) {
    drawBat(c, w * (0.08 + rng() * 0.84), h * (0.06 + rng() * 0.4),
      w * (0.012 + rng() * 0.02), alpha * (0.6 + rng() * 0.4));
  }
}
function drawFog(c, w, h, rng, color, bands, alpha) {
  for (let i = 0; i < bands; i++) {
    const y = h * (0.15 + rng() * 0.75);
    const bh = h * (0.05 + rng() * 0.09);
    const g = c.createLinearGradient(0, y - bh, 0, y + bh);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, color.replace('A', (alpha * (0.5 + rng() * 0.5)).toFixed(2)));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, y - bh, w, bh * 2);
  }
}
function drawGhost(c, w, h, alpha) {
  const gx = w * 0.68, gy = h * 0.42, s = h * 0.26;
  c.save();
  c.globalAlpha = alpha;
  const g = c.createRadialGradient(gx, gy, s * 0.1, gx, gy, s * 1.1);
  g.addColorStop(0, 'rgba(240,248,255,0.85)');
  g.addColorStop(1, 'rgba(240,248,255,0)');
  c.fillStyle = g;
  c.fillRect(gx - s * 1.1, gy - s * 1.1, s * 2.2, s * 2.2);
  c.fillStyle = 'rgba(235,242,250,0.92)';
  c.beginPath();
  c.moveTo(gx, gy - s * 0.85);
  c.bezierCurveTo(gx + s * 0.7, gy - s * 0.85, gx + s * 0.62, gy - s * 0.1, gx + s * 0.55, gy + s * 0.55);
  c.quadraticCurveTo(gx + s * 0.28, gy + s * 0.3, gx, gy + s * 0.62);
  c.quadraticCurveTo(gx - s * 0.28, gy + s * 0.3, gx - s * 0.55, gy + s * 0.55);
  c.bezierCurveTo(gx - s * 0.62, gy - s * 0.1, gx - s * 0.7, gy - s * 0.85, gx, gy - s * 0.85);
  c.fill();
  c.fillStyle = '#0a0a12';
  c.beginPath(); c.ellipse(gx - s * 0.2, gy - s * 0.28, s * 0.09, s * 0.13, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(gx + s * 0.2, gy - s * 0.28, s * 0.09, s * 0.13, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(gx, gy + s * 0.02, s * 0.07, s * 0.11, 0, 0, Math.PI * 2); c.fill();
  c.restore();
}
function drawPumpkin(c, w, h, alpha) {
  const px = w * 0.82, py = h * 0.86, s = w * 0.11;
  c.save();
  c.globalAlpha = alpha;
  const g = c.createRadialGradient(px, py, s * 0.1, px, py, s * 1.8);
  g.addColorStop(0, 'rgba(255,140,30,0.55)');
  g.addColorStop(1, 'rgba(255,140,30,0)');
  c.fillStyle = g;
  c.fillRect(px - s * 1.8, py - s * 1.8, s * 3.6, s * 3.6);
  c.fillStyle = '#e86a00';
  c.beginPath(); c.ellipse(px, py, s, s * 0.82, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ff8c1a';
  c.beginPath(); c.ellipse(px - s * 0.45, py, s * 0.42, s * 0.78, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(px + s * 0.45, py, s * 0.42, s * 0.78, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2d5a1b';
  c.fillRect(px - s * 0.06, py - s * 1.05, s * 0.12, s * 0.4);
  c.fillStyle = '#1a0d00';
  c.beginPath(); c.moveTo(px - s * 0.55, py - s * 0.35); c.lineTo(px - s * 0.25, py - s * 0.05); c.lineTo(px - s * 0.55, py + s * 0.1); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(px + s * 0.55, py - s * 0.35); c.lineTo(px + s * 0.25, py - s * 0.05); c.lineTo(px + s * 0.55, py + s * 0.1); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(px - s * 0.5, py + s * 0.35); c.lineTo(px - s * 0.2, py + s * 0.55); c.lineTo(px, py + s * 0.35); c.lineTo(px + s * 0.2, py + s * 0.55); c.lineTo(px + s * 0.5, py + s * 0.35); c.lineTo(px, py + s * 0.62); c.closePath(); c.fill();
  c.restore();
}
function drawCobweb(c, w, h, alpha) {
  c.save();
  c.globalAlpha = alpha;
  c.strokeStyle = 'rgba(220,220,220,0.75)';
  c.lineWidth = 1;
  const corners = [[0, 0, 1, 1], [w, 0, -1, 1]];
  for (const [cx, cy, dx, dy] of corners) {
    const R = Math.min(w, h) * 0.32;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 2) * (i / 5) * (dx > 0 ? 1 : 1);
      const ex = cx + Math.cos(dx > 0 ? a : Math.PI - a) * R;
      const ey = cy + Math.sin(a) * R * dy;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(ex, ey); c.stroke();
    }
    for (let ring = 1; ring <= 3; ring++) {
      const r = R * ring / 3;
      c.beginPath();
      for (let i = 0; i <= 5; i++) {
        const a = (Math.PI / 2) * (i / 5);
        const ex = cx + Math.cos(dx > 0 ? a : Math.PI - a) * r;
        const ey = cy + Math.sin(a) * r * dy;
        if (i === 0) c.moveTo(ex, ey); else c.lineTo(ex, ey);
      }
      c.stroke();
    }
  }
  c.restore();
}

/* ---------------- effects ---------------- */
function gradeStr(parts) { return parts.join(' '); }
const EFFECTS = {
  'blood-moon': {
    name: 'Blood Moon',
    blurb: 'A giant blood-red moon rises over your photo. Nothing good happens after this.',
    grade: function (t) {
      return gradeStr([
        'brightness(' + lerp(1, 0.82, t).toFixed(2) + ')',
        'contrast(' + lerp(1, 1.18, t).toFixed(2) + ')',
        'saturate(' + lerp(1, 0.75, t).toFixed(2) + ')',
        'sepia(' + (0.4 * t).toFixed(2) + ')',
        'hue-rotate(' + (-18 * t).toFixed(0) + 'deg)',
      ]);
    },
    overlay: function (c, w, h, rng, t) {
      drawMoon(c, w, h, w * 0.76, h * 0.24, Math.min(w, h) * 0.16, '#c1121f', 'rgba(193,18,31,' + (0.5 * t).toFixed(2) + ')');
      drawBats(c, w, h, rng, 5, 0.9 * t);
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(120,0,10,' + (0.12 * t).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(0,0,0,' + (0.25 * t).toFixed(2) + ')');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      vignette(c, w, h, 0.55 * t);
    },
  },
  'fog': {
    name: 'Fog of the Damned',
    blurb: 'Thick grey fog rolls in. Something is moving inside it — you just cannot see it yet.',
    grade: function (t) {
      return gradeStr([
        'brightness(' + lerp(1, 1.05, t).toFixed(2) + ')',
        'contrast(' + lerp(1, 0.82, t).toFixed(2) + ')',
        'saturate(' + lerp(1, 0.35, t).toFixed(2) + ')',
      ]);
    },
    overlay: function (c, w, h, rng, t) {
      drawFog(c, w, h, rng, 'rgba(200,205,210,A)', 6, 0.55 * t);
      drawFog(c, w, h, rng, 'rgba(160,165,175,A)', 4, 0.4 * t);
      vignette(c, w, h, 0.3 * t);
      grain(c, w, h, rng, 0.05 * t);
    },
  },
  'pumpkin': {
    name: 'Pumpkin Glow',
    blurb: 'Warm jack-o\'-lantern light spills across the photo. The pumpkin is smiling. Too wide.',
    grade: function (t) {
      return gradeStr([
        'brightness(' + lerp(1, 1.02, t).toFixed(2) + ')',
        'contrast(' + lerp(1, 1.1, t).toFixed(2) + ')',
        'saturate(' + lerp(1, 1.45, t).toFixed(2) + ')',
        'sepia(' + (0.25 * t).toFixed(2) + ')',
        'hue-rotate(' + (-8 * t).toFixed(0) + 'deg)',
      ]);
    },
    overlay: function (c, w, h, rng, t) {
      drawPumpkin(c, w, h, 0.95 * t);
      const g = c.createRadialGradient(w * 0.82, h * 0.86, 10, w * 0.82, h * 0.86, Math.max(w, h) * 0.6);
      g.addColorStop(0, 'rgba(255,140,30,' + (0.22 * t).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(255,140,30,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      // embers
      c.save();
      for (let i = 0; i < 14; i++) {
        c.globalAlpha = (0.25 + rng() * 0.5) * t;
        c.fillStyle = '#ffb347';
        c.beginPath(); c.arc(rng() * w, rng() * h * 0.7, 1 + rng() * 2.2, 0, Math.PI * 2); c.fill();
      }
      c.restore();
      vignette(c, w, h, 0.35 * t);
    },
  },
  'mansion': {
    name: 'Haunted Mansion',
    blurb: 'Cold green candlelight, dust and cobwebs. This house has not been empty for a hundred years.',
    grade: function (t) {
      return gradeStr([
        'brightness(' + lerp(1, 0.8, t).toFixed(2) + ')',
        'contrast(' + lerp(1, 1.15, t).toFixed(2) + ')',
        'saturate(' + lerp(1, 0.7, t).toFixed(2) + ')',
        'sepia(' + (0.3 * t).toFixed(2) + ')',
        'hue-rotate(' + (55 * t).toFixed(0) + 'deg)',
      ]);
    },
    overlay: function (c, w, h, rng, t) {
      drawCobweb(c, w, h, 0.8 * t);
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(20,60,40,' + (0.14 * t).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(0,0,0,' + (0.3 * t).toFixed(2) + ')');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      grain(c, w, h, rng, 0.09 * t);
      vignette(c, w, h, 0.6 * t);
    },
  },
  'vampire': {
    name: 'Vampire Night',
    blurb: 'Deep red shadows, pale moonlight, a swarm of bats. Do not invite anyone in.',
    grade: function (t) {
      return gradeStr([
        'brightness(' + lerp(1, 0.78, t).toFixed(2) + ')',
        'contrast(' + lerp(1, 1.25, t).toFixed(2) + ')',
        'saturate(' + lerp(1, 0.85, t).toFixed(2) + ')',
        'sepia(' + (0.35 * t).toFixed(2) + ')',
        'hue-rotate(' + (-25 * t).toFixed(0) + 'deg)',
      ]);
    },
    overlay: function (c, w, h, rng, t) {
      drawMoon(c, w, h, w * 0.2, h * 0.2, Math.min(w, h) * 0.09, '#e8dcc8', 'rgba(232,220,200,' + (0.35 * t).toFixed(2) + ')');
      drawBats(c, w, h, rng, 11, 0.95 * t);
      const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
      g.addColorStop(0, 'rgba(80,0,0,0)');
      g.addColorStop(1, 'rgba(80,0,0,' + (0.5 * t).toFixed(2) + ')');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      vignette(c, w, h, 0.55 * t);
    },
  },
  'ghost': {
    name: 'Ghostly Apparition',
    blurb: 'A pale figure drifts out of the mist. It is looking at the camera. It knows your name.',
    grade: function (t) {
      return gradeStr([
        'brightness(' + lerp(1, 1.12, t).toFixed(2) + ')',
        'contrast(' + lerp(1, 0.9, t).toFixed(2) + ')',
        'saturate(' + lerp(1, 0.4, t).toFixed(2) + ')',
        'hue-rotate(' + (15 * t).toFixed(0) + 'deg)',
      ]);
    },
    overlay: function (c, w, h, rng, t) {
      drawFog(c, w, h, rng, 'rgba(210,225,240,A)', 4, 0.4 * t);
      drawGhost(c, w, h, 0.9 * t);
      const g = c.createRadialGradient(w * 0.68, h * 0.42, 10, w * 0.68, h * 0.42, Math.max(w, h) * 0.55);
      g.addColorStop(0, 'rgba(190,215,255,' + (0.18 * t).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(190,215,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      vignette(c, w, h, 0.3 * t);
    },
  },
};

/* ---------------- sample photo ---------------- */
function makeSamplePhoto() {
  const c = document.createElement('canvas');
  c.width = 960; c.height = 720;
  const x = c.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, '#0b1026'); sky.addColorStop(0.55, '#1c1440'); sky.addColorStop(1, '#3a1c40');
  x.fillStyle = sky; x.fillRect(0, 0, 960, 720);
  const rng = mulberry32(20261031);
  for (let i = 0; i < 120; i++) {
    x.globalAlpha = 0.3 + rng() * 0.7;
    x.fillStyle = '#fff';
    x.fillRect(rng() * 960, rng() * 380, 1.6, 1.6);
  }
  x.globalAlpha = 1;
  drawMoon(x, 960, 720, 730, 150, 62, '#f5eeda', 'rgba(245,238,218,0.4)');
  // hills
  x.fillStyle = '#120e1e';
  x.beginPath(); x.moveTo(0, 520); x.quadraticCurveTo(240, 430, 480, 520); x.quadraticCurveTo(720, 600, 960, 500); x.lineTo(960, 720); x.lineTo(0, 720); x.closePath(); x.fill();
  // crooked house
  x.fillStyle = '#0a0714';
  x.beginPath(); x.moveTo(330, 520); x.lineTo(330, 400); x.lineTo(420, 340); x.lineTo(510, 400); x.lineTo(510, 520); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(420, 340); x.lineTo(470, 300); x.lineTo(500, 330); x.lineTo(470, 350); x.closePath(); x.fill();
  x.fillStyle = '#ffca6a';
  x.fillRect(370, 440, 34, 44); x.fillRect(440, 440, 34, 44); x.fillRect(405, 480, 30, 40);
  x.fillStyle = '#0a0714';
  x.fillRect(370, 458, 34, 4); x.fillRect(440, 458, 34, 4);
  // bare tree
  x.strokeStyle = '#0a0714'; x.lineWidth = 9; x.lineCap = 'round';
  x.beginPath(); x.moveTo(660, 560); x.lineTo(660, 380); x.stroke();
  x.lineWidth = 5;
  const branches = [[660, 430, 590, 360], [660, 400, 730, 330], [660, 460, 600, 400], [660, 380, 700, 320]];
  for (const [x1, y1, x2, y2] of branches) { x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); }
  // ground fog
  drawFog(x, 960, 720, mulberry32(7), 'rgba(180,190,205,A)', 3, 0.35);
  const img = new Image();
  img.src = c.toDataURL('image/png');
  return img;
}

/* ---------------- render ---------------- */
function render() {
  if (!state.image) return;
  const img = state.image;
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(2, Math.round(img.naturalWidth * scale));
  const h = Math.max(2, Math.round(img.naturalHeight * scale));
  if (stage.width !== w || stage.height !== h) { stage.width = w; stage.height = h; }
  const effect = EFFECTS[state.effectId];
  const t = state.intensity;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (supportsFilter) { ctx.filter = effect.grade(t); }
  ctx.drawImage(img, 0, 0, w, h);
  ctx.filter = 'none';
  const seed = hashString(state.effectId + '|' + state.imageName + '|' + Math.round(t * 100));
  effect.overlay(ctx, w, h, mulberry32(seed), t);
  ctx.restore();
  const blurb = document.getElementById('effect-blurb');
  if (blurb) blurb.textContent = effect.blurb;
}

/* ---------------- story generator ---------------- */
const STORY = {
  names: ['Mara', 'Elias', 'June', 'Theo', 'Ada', 'Silas', 'Nadia', 'Felix', 'Rosa', 'Caleb'],
  places: ['Blackwood Manor', 'the old mill on Hollow Creek', 'the abandoned cinema on 5th Street', 'the lighthouse at Widow\'s Point', 'the derelict greenhouse', 'the chapel in the pines', 'the cellar under the bakery', 'the empty schoolhouse'],
  objects: ['a brass key that was warm to the touch', 'a cracked mirror that showed the room a second too late', 'a music box playing a tune nobody had wound', 'a photograph of people who had never lived here', 'a pocket watch ticking backwards', 'a child\'s drawing of the house — dated tomorrow', 'a wedding ring with someone else\'s initials', 'a letter addressed to the reader, in the reader\'s own handwriting'],
  entities: ['the Hollow Man', 'the Widow in Grey', 'the Pale Child', 'the Thing Behind the Door', 'the Gardener Who Never Left', 'the Choir of the Drowned'],
  times: ['midnight', '3 a.m.', 'dusk', 'the hour between dog and wolf', 'the last minute of Halloween'],
  sounds: ['a knock from inside the wall', 'footsteps on the stairs that nobody was climbing', 'a lullaby hummed in a voice like dry leaves', 'the piano playing itself, one key at a time', 'whispering that stopped the moment the lights came on'],
  twists: [
    'the photo had been taken that night — and in it, the reader was already standing behind themself.',
    'the house had been empty for a hundred years. The footprints in the dust were fresh.',
    'when the sun rose, the photograph was blank. The thing in it had finally found a way out.',
    'the reader understood, too late, that the story was not about the house at all. It was about the person reading it.',
    'the mirror showed the room exactly as it was — except the reader was not in it anymore.',
  ],
  titleTemplates: [
    'The {place} {noun}',
    'What the {objectShort} Saw',
    'The Night {name} Found {objectShort}',
    'Do Not Answer the {soundShort}',
    '{entity} Is Waiting',
  ],
};
function buildStory(rng) {
  const name = pick(rng, STORY.names);
  const place = pick(rng, STORY.places);
  const object = pick(rng, STORY.objects);
  const entity = pick(rng, STORY.entities);
  const time = pick(rng, STORY.times);
  const sound = pick(rng, STORY.sounds);
  const twist = pick(rng, STORY.twists);
  const objectShort = object.replace(/^(a|an|the)\s+/i, '').split(' that ')[0].split(' of ')[0];
  const soundShort = sound.replace(/^(a|the)\s+/i, '').split(' that ')[0];
  const titleTpl = pick(rng, STORY.titleTemplates);
  const placeTitle = place.replace(/^(the)\s+/i, '');
  const title = titleTpl
    .replace('{place}', placeTitle.charAt(0).toUpperCase() + placeTitle.slice(1))
    .replace('{noun}', pick(rng, ['Haunting', 'Secret', 'Silence', 'Curse', 'Guest', 'Photograph']))
    .replace('{objectShort}', objectShort.charAt(0).toUpperCase() + objectShort.slice(1))
    .replace('{name}', name)
    .replace('{soundShort}', soundShort)
    .replace('{entity}', entity);
  const p1 = name + ' had not meant to stop at ' + place + '. It was ' + time + ', the rain had turned the road to black glass, and the old building was the only light for miles. The door was unlocked. In places like this, the door is always unlocked.';
  const p2 = 'Inside, on a table covered in dust, lay ' + object + '. ' + name + ' picked it up before thinking — the way you pick up something that belongs to you. The air in the room changed. Somewhere above, ' + sound + '.';
  const p3 = '"Who is there?" ' + name + ' called, and the house answered the only way it knew how: with silence, and then with ' + sound + ' again, closer this time. On the wall, the shadows were standing in the wrong places. And then ' + name + ' saw ' + entity + ', waiting at the end of the hall, patient as a photograph.';
  const p4 = 'There was no running. There never is, in stories like this. Because ' + twist;
  return { title: title, paragraphs: [p1, p2, p3, p4] };
}
function storyText(story) {
  return story.title + '\n\n' + story.paragraphs.join('\n\n');
}
function generateStory() {
  const rng = mulberry32((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
  state.story = buildStory(rng);
  renderStory();
}
function renderStory() {
  const titleEl = document.getElementById('story-title');
  const bodyEl = document.getElementById('story-body');
  if (!state.story) return;
  titleEl.textContent = state.story.title;
  bodyEl.innerHTML = '';
  for (const p of state.story.paragraphs) {
    const pe = document.createElement('p');
    pe.textContent = p;
    bodyEl.appendChild(pe);
  }
}

/* ---------------- export ---------------- */
function downloadPNG() {
  const btn = document.getElementById('download-btn');
  btn.disabled = true;
  stage.toBlob(function (blob) {
    btn.disabled = false;
    if (!blob || blob.size < 100) {
      alert('Failed to create PNG. Please try again.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spookify-halloween.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }, 'image/png');
}
function copyStory() {
  const status = document.getElementById('copy-status');
  const text = state.story ? storyText(state.story) : '';
  function done(ok) {
    status.textContent = ok ? '✓ Story copied to clipboard!' : 'Copy failed — select the story text manually.';
    if (ok) {
      setTimeout(function () { status.textContent = ''; }, 3000);
    }
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallbackCopy(text, done); });
  } else {
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  done(ok);
}

/* ---------------- photo input ---------------- */
function loadImageFile(file) {
  const errorEl = document.getElementById('upload-error');
  if (!file || !file.type || file.type.indexOf('image/') !== 0) {
    errorEl.textContent = 'That file is not an image. Please choose a JPG, PNG, WebP or GIF file.';
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      state.image = img;
      state.imageName = file.name || 'uploaded photo';
      document.getElementById('photo-name').textContent = 'Photo: ' + state.imageName;
      render();
      generateStory();
    };
    img.onerror = function () {
      errorEl.textContent = 'Failed to load image. The file may be corrupted.';
      errorEl.hidden = false;
    };
    img.src = e.target.result;
  };
  reader.onerror = function () {
    errorEl.textContent = 'Failed to read file. Please try again.';
    errorEl.hidden = false;
  };
  reader.readAsDataURL(file);
}
function loadSample() {
  const img = makeSamplePhoto();
  img.onload = function () {
    state.image = img;
    state.imageName = 'sample scene';
    document.getElementById('photo-name').textContent = 'Sample scene loaded';
    document.getElementById('upload-error').hidden = true;
    render();
    generateStory();
  };
}

/* ---------------- events ---------------- */
function bindEvents() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  dropZone.addEventListener('click', function () { fileInput.click(); });
  dropZone.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener('change', function () { loadImageFile(fileInput.files[0]); });
  ['dragenter', 'dragover'].forEach(function (ev) {
    dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.remove('drag-over'); });
  });
  dropZone.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadImageFile(e.dataTransfer.files[0]);
    }
  });
  document.getElementById('sample-btn').addEventListener('click', loadSample);
  const effectBtns = Array.prototype.slice.call(document.querySelectorAll('.effect-btn'));
  effectBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.effectId = btn.getAttribute('data-effect');
      effectBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      render();
      generateStory();
    });
  });
  const slider = document.getElementById('intensity');
  slider.addEventListener('input', function () {
    state.intensity = slider.value / 100;
    document.getElementById('intensity-value').textContent = slider.value + '%';
    render();
  });
  document.getElementById('download-btn').addEventListener('click', downloadPNG);
  document.getElementById('new-story-btn').addEventListener('click', generateStory);
  document.getElementById('copy-btn').addEventListener('click', copyStory);
}

/* ---------------- self-test (?selftest=1) ---------------- */
function canvasIsNonBlank() {
  const data = ctx.getImageData(0, 0, stage.width, stage.height).data;
  const seen = new Set();
  let opaque = 0;
  for (let i = 0; i < data.length; i += 401 * 4) {
    seen.add(data[i] + ',' + data[i + 1] + ',' + data[i + 2]);
    if (data[i + 3] > 200) opaque++;
  }
  return seen.size >= 5 && opaque > 0;
}
function runSelfTest() {
  const box = document.getElementById('selftest-results');
  box.hidden = false;
  const results = [];
  function check(name, ok) { results.push((ok ? 'PASS' : 'FAIL') + ': ' + name); }
  return new Promise(function (resolve) {
    // 1. sample photo loaded
    check('sample photo loaded', !!state.image && state.image.naturalWidth > 0);
    // 2. all effects render non-blank
    const effectIds = Object.keys(EFFECTS);
    let effectsOk = true;
    for (const id of effectIds) {
      state.effectId = id;
      render();
      if (!canvasIsNonBlank()) { effectsOk = false; }
    }
    check('all ' + effectIds.length + ' effects render non-blank', effectsOk);
    state.effectId = 'blood-moon';
    render();
    // 3. story generation
    generateStory();
    const words = state.story ? storyText(state.story).split(/\s+/).length : 0;
    check('story has title + 4 paragraphs', !!state.story && state.story.title.length > 3 && state.story.paragraphs.length === 4);
    check('story is at least 150 words (' + words + ')', words >= 150);
    // 4. story regenerates differently
    const first = storyText(state.story);
    generateStory();
    check('regenerated story differs', storyText(state.story) !== first);
    // 5. PNG blob export
    stage.toBlob(function (blob) {
      check('PNG blob created (' + (blob ? blob.size : 0) + ' bytes)', !!blob && blob.size > 1000);
      // 6. controls present
      const ids = ['file-input', 'drop-zone', 'sample-btn', 'intensity', 'download-btn', 'new-story-btn', 'copy-btn', 'story-title', 'story-body'];
      check('all controls present', ids.every(function (id) { return !!document.getElementById(id); }));
      check('6 effect buttons present', document.querySelectorAll('.effect-btn').length === 6);
      const passed = results.filter(function (r) { return r.indexOf('PASS') === 0; }).length;
      box.textContent = results.join('\n') + '\n' + passed + '/' + results.length + ' passed';
      document.title = 'SELFTEST: ' + passed + '/' + results.length + ' passed';
      resolve(passed === results.length);
    }, 'image/png');
  });
}

/* ---------------- init ---------------- */
bindEvents();
loadSample();
if (new URLSearchParams(window.location.search).get('selftest') === '1') {
  // wait for the sample image to load, then test
  const wait = setInterval(function () {
    if (state.image && state.image.complete && state.image.naturalWidth > 0) {
      clearInterval(wait);
      runSelfTest();
    }
  }, 100);
}
