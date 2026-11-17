# Spookify — Implementation Tasks (Kiro spec)

Status: tasks 1–7 are implemented in this repo following this spec.
Task 8 (Kiro agent execution) is BLOCKED on sign-in: `kiro-cli` 3.4.0
is installed and `kiro-cli whoami` reports "Not logged in". Signing in
needs Cipta's Google / GitHub / AWS Builder ID in a browser. Once he is
signed in, run `kiro-cli` in this folder and ask it to execute the tasks
below against this spec, then re-run the self-test.

- [x] 1. Scaffold project: index.html, styles.css, app.js, README.md,
  LICENSE (MIT), .gitignore, .kiro/ steering + specs + hooks.
  - _Requirements: 5.1, 5.2, 5.3_
- [x] 2. Implement photo input: file picker, drag-and-drop, sample
  scene generator, non-image error handling, default sample on load.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
- [x] 3. Implement canvas render pipeline: cover-fit draw, per-effect
  colour grade via ctx.filter, overlay helpers (vignette, grain, moon,
  bats, fog, ghost, pumpkin, cobweb), intensity slider.
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
- [x] 4. Implement all 6 effects with distinct grades + overlays.
  - _Requirements: 2.2_
- [x] 5. Implement procedural horror story generator: banks, 4-paragraph
  structure, title templates, regenerate + auto-generate on photo /
  effect change.
  - _Requirements: 3.1, 3.2, 3.3_
- [x] 6. Implement export: Download PNG (spookify-halloween.png),
  Copy story (clipboard + fallback), confirmation messages.
  - _Requirements: 3.4, 4.1, 4.2, 4.3_
- [x] 7. Implement self-test (?selftest=1) covering upload, all effects,
  story, PNG blob, controls. Verify with headless Chromium + screenshot.
  - _Requirements: 6.1, 6.2_
- [x] 8. (After Cipta signs in to Kiro) Run `kiro-cli` in this folder:
  ask it to review this spec and the code, fix any gaps, and re-run the
  self-test. Then commit to the public GitHub repo.
  - DONE 17 Nov 2026 ~15:05 WIB: Cipta signed in (Builder ID
    masduki1189@gmail.com). `kiro-cli chat --no-interactive
    --model claude-haiku-4.5` reviewed spec + code (first attempt failed
    with transient ModelRegistryUnavailableError; retry with pinned
    model worked). Agent fixed 5 issues: (1) copy status clears after
    3s, (2) download button disabled during export, (3) reader.onerror
    + img.onerror handlers, (4) PNG blob validation >100 bytes before
    download, (5) canvas max-width:100% + image-rendering:auto.
    Spec verified complete and consistent with code; concept unchanged.
    Re-tests after fixes: self-test 8/8, CDP 6/6 — all green.
  - _Requirements: 5.3, 6.1, 6.2_
- [ ] 9. Deploy to GitHub Pages, record the 3-minute demo video, submit
  on Devpost (needs Cipta's Devpost + GitHub accounts).
  - _Requirements: 5.3_
