# Spookify — Design (Kiro spec)

## Overview
Single-page static app. Three columns on desktop (upload / stage /
story), stacked on mobile. Dark theme: near-black background, pumpkin
orange accents, blood-red highlights. All rendering on one `<canvas>`.

## Architecture
```
index.html  — semantic layout, no inline JS
styles.css  — CSS grid, dark theme, responsive breakpoints
app.js      — state + effects + story generator + export + self-test
```

### State (app.js)
```js
state = {
  image: HTMLImageElement | null,  // uploaded photo or sample scene
  imageName: string,
  effectId: 'blood-moon',
  intensity: 0.85,                 // 0..1
  seed: number,                    // per-render seed for overlays
  story: { title, paragraphs[] },
}
```

### Rendering pipeline (render())
1. Compute output size: fit source image into max 1200px long edge.
2. `ctx.filter = effect.grade(intensity)`; draw image cover-fit.
3. Reset filter; call `effect.overlay(ctx, w, h, rng(seed), intensity)`.
4. Vignette + grain are applied inside overlays, not globally.

### Effects (EFFECTS map)
Each effect: `{ id, name, blurb, grade(t), overlay(ctx, w, h, rng, t) }`.
Helpers: `vignette(ctx,w,h,strength)`, `grain(ctx,w,h,rng,amount)`,
`drawMoon`, `drawBats`, `drawFog`, `drawGhost`, `drawPumpkin`,
`drawCobweb`. Overlay alpha values are multiplied by intensity `t`.

| Effect | Grade | Overlay |
|---|---|---|
| Blood Moon | dark, desaturated, red sepia | giant red moon, bats, red vignette |
| Fog of the Damned | grey, low contrast | drifting fog bands, pale vignette |
| Pumpkin Glow | warm orange, high saturation | orange rim glow, jack-o'-lantern, embers |
| Haunted Mansion | cold green-teal, dark | cobwebs, dust, green vignette, grain |
| Vampire Night | deep red shadows, pale highlights | bat swarm, red moon sliver, blood vignette |
| Ghostly Apparition | pale blue, low saturation, bright | translucent ghost, mist, cold glow |

### Story generator (STORY banks + buildStory(seed))
- Banks: `names`, `places`, `objects`, `entities`, `times`, `sounds`,
  `twists`, `titles`.
- Structure: P1 setting + protagonist arrives; P2 the object in the
  photo is noticed; P3 escalation (sound / movement); P4 twist ending.
- RNG: mulberry32 seeded per generation; "New story" re-seeds.
- Output: `{ title, paragraphs: [p1, p2, p3, p4] }`, ≥150 words.

### Sample scene (makeSamplePhoto())
Procedural night scene drawn on an offscreen canvas: gradient sky,
stars, big moon, hills, a crooked house silhouette with lit windows,
a bare tree. Returned as an Image so the pipeline treats it exactly
like an upload.

### Export
- Download: `canvas.toBlob('image/png')` → object URL → `<a download>`.
- Copy: `navigator.clipboard.writeText` with hidden-textarea fallback.

### Self-test (?selftest=1)
Runs after first render: loads sample, renders each effect, checks the
canvas is non-blank (pixel sampling), builds a story, checks title +
4 paragraphs, creates a PNG blob, checks all buttons exist. Writes
`PASS`/`FAIL` lines into `#selftest-results` and sets
`document.title = 'SELFTEST: n/m passed'`.

## Error handling
- Non-image file → inline error, keep current photo.
- Clipboard denied → fallback textarea + "copy manually" hint.
- `ctx.filter` unsupported → grade skipped, overlays still render.
- Image too large → downscaled to 1200px max edge before render.
