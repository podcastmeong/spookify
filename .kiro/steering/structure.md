# Spookify — Project Structure

```
spookify/
├── index.html            # App shell: upload zone, stage, controls, story panel
├── styles.css            # Dark Halloween theme, responsive grid
├── app.js                # All logic: upload, effects, story generator, export
├── assets/               # (reserved; no external assets by design)
├── README.md             # Setup, usage, contest submission notes
├── LICENSE               # MIT
├── .gitignore
└── .kiro/
    ├── steering/
    │   ├── product.md    # What Spookify is and who it serves
    │   ├── tech.md       # Stack and constraints
    │   └── structure.md  # This file
    ├── specs/
    │   └── spookify/
    │       ├── requirements.md
    │       ├── design.md
    │       └── tasks.md
    └── hooks/
        └── on-save-check.json  # Run node --check on app.js after edits
```

## Rules
- One page, one script, one stylesheet. Keep it that way.
- Effects live in `EFFECTS` in `app.js`: each effect is an object with
  `id`, `name`, `blurb`, a `grade(t)` filter function and an `overlay(ctx,
  w, h, rng, t)` drawing function.
- Story data lives in `STORY` in `app.js`: name/place/object/entity banks
  plus paragraph templates. No story text is hard-coded as a finished
  story; every story is assembled at runtime.
- The self-test (`?selftest=1`) must stay working: it exercises upload
  (sample photo), all six effects, story generation, PNG export and copy.
