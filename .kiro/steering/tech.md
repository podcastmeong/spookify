# Spookify — Technology Steering

## Stack
- Pure static web app: `index.html` + `styles.css` + `app.js`. No build step,
  no framework, no backend, no npm dependencies at runtime.
- Canvas 2D API for all image effects (`ctx.filter` for colour grades,
  layered drawing for moons, fog, bats, ghosts, cobwebs, pumpkins).
- FileReader / drag-and-drop for photo upload. `canvas.toBlob()` for PNG
  download. `navigator.clipboard` (with textarea fallback) for copy.
- Seeded PRNG (mulberry32) so each render of an effect is stable and the
  downloaded PNG matches the preview.

## Constraints
- Must work from a static host (GitHub Pages) and from `file://`.
- No external assets: no CDN fonts, no remote images. All art is drawn
  procedurally on canvas. This keeps the app fast and offline-capable.
- Output canvas capped at 1200px on the long edge (quality vs. performance).
- No `eval`, no inline event handlers, no third-party scripts.
- Must pass `node --check app.js` and the in-app self-test (`?selftest=1`).

## Browser support
- Modern Chromium, Firefox, Safari, Edge (Canvas 2D + `ctx.filter`).
- Degradation: if `ctx.filter` is unavailable, effects still render via
  overlay drawing only.
