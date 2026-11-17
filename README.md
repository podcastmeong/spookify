# Spookify 🎃

Turn any photo into a Halloween portrait — plus an original horror story
to go with it. Built for **Kiroween 2026** (Devpost), Costume Contest
category. 100% client-side: no account, no server, no tracking. Your
photo never leaves your device.

## What it does

1. **Upload a photo** (or use the built-in sample night scene).
2. **Pick one of six Halloween effects** — Blood Moon, Fog of the
   Damned, Pumpkin Glow, Haunted Mansion, Vampire Night, Ghostly
   Apparition — and tune the intensity.
3. **Get an original horror story** (title + four paragraphs) generated
   procedurally in the browser. Hit "New story" for another one.
4. **Download the portrait as PNG** and **copy the story** to share.

## Run it

No build step, no dependencies. Open `index.html` in any modern browser,
or serve the folder with any static server:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Self-test

```sh
node --check app.js
```

Open `index.html?selftest=1` in a browser: the page runs an automated
check (sample photo, all 6 effects render, story generation, PNG export,
controls present) and prints PASS/FAIL lines.

## Project layout

```
index.html   styles.css   app.js   README.md   LICENSE
.kiro/
  steering/  product.md, tech.md, structure.md
  specs/spookify/  requirements.md, design.md, tasks.md
  hooks/  on-save-check.json
```

The `.kiro/` directory is the Kiro spec-driven development record: the
requirements, design and task list the app was built from. Kiro (IDE /
CLI / Web) reads these files.

## Contest submission (Kiroween 2026, Devpost)

- Category: **Costume Contest**
- Deadline: Friday, 4 December 2026, 2:00 PM Pacific Time
  (Saturday, 5 December 2026, 05:00 WIB)
- Submission needs: a live app URL (GitHub Pages), a public GitHub repo
  with `/.kiro` at the root and an open-source license, a demo video
  under 3 minutes on public YouTube, and a text description.
- Prizes: 1st $30,000 · 2nd $20,000 · 3rd $10,000 · each category
  $5,000 · $20,000 in bonus prizes.
- Eligibility: residents of Indonesia are **not** on the excluded list
  in the official rules (updated 16 November 2026).

## License

MIT — see `LICENSE`.
