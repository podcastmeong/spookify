# Spookify — Requirements (Kiro spec)

## Introduction
Spookify is a client-side web app for Kiroween 2026 (Devpost), Costume
Contest category. A user uploads a photo, applies a Halloween effect,
receives a procedurally generated horror story, and downloads the result.
The app must be demonstrable end-to-end in a <3 minute video.

## Glossary
- **Effect**: a named Halloween look applied to the photo on canvas
  (Blood Moon, Fog of the Damned, Pumpkin Glow, Haunted Mansion,
  Vampire Night, Ghostly Apparition).
- **Story**: a generated horror micro-story: one title + four short
  paragraphs, assembled from template banks at runtime.
- **Stage**: the preview canvas showing the current photo + effect.

## Requirements

### Requirement 1 — Photo input
**User Story:** As a user, I want to load a photo into Spookify, so that I
can turn it into a Halloween portrait.

#### Acceptance Criteria
1. WHEN the user picks a file with the file input, THEN the photo SHALL
   appear on the stage within 1 second.
2. WHEN the user drops an image file onto the drop zone, THEN the photo
   SHALL load the same way as via the file input.
3. WHEN the user clicks "Use sample photo", THEN a procedurally drawn
   night scene SHALL load on the stage without any file.
4. WHEN the loaded file is not an image, THEN an error message SHALL be
   shown and the previous photo SHALL stay on the stage.
5. WHEN no photo is loaded, THEN the stage SHALL show the sample scene
   by default so the app is never empty.

### Requirement 2 — Halloween effects
**User Story:** As a user, I want to choose a Halloween effect, so that my
photo looks genuinely spooky.

#### Acceptance Criteria
1. WHEN the user selects an effect, THEN the stage SHALL re-render with
   that effect applied and the effect button SHALL show as active.
2. The app SHALL offer at least 4 effects, each visibly different:
   Blood Moon, Fog of the Damned, Pumpkin Glow, Haunted Mansion,
   Vampire Night, Ghostly Apparition (6 total).
3. WHEN the user moves the intensity slider (0–100%), THEN the strength
   of the effect overlays SHALL change smoothly and the preview SHALL
   update live.
4. WHEN the user changes the effect or intensity, THEN the downloaded
   PNG SHALL match the preview exactly (same seed, same render).

### Requirement 3 — Horror story generator
**User Story:** As a user, I want a short horror story inspired by my
photo, so that I can share it with the portrait.

#### Acceptance Criteria
1. WHEN a photo is loaded or the effect changes, THEN a story SHALL be
   generated automatically (title + 4 paragraphs).
2. WHEN the user clicks "New story", THEN a different story SHALL be
   generated (different title and at least 2 paragraphs different).
3. Each story SHALL be at least 150 words and SHALL read coherently
   (setting, discovery, escalation, twist ending).
4. WHEN the user clicks "Copy story", THEN the full story text SHALL be
   placed on the clipboard and a confirmation SHALL appear.

### Requirement 4 — Export
**User Story:** As a user, I want to download my Halloween portrait, so
that I can use it as a profile picture or party invite.

#### Acceptance Criteria
1. WHEN the user clicks "Download PNG", THEN a PNG file of the current
   stage SHALL download (max 1200px long edge).
2. WHEN the user clicks "Download PNG" with no photo loaded, THEN the
   sample scene with the current effect SHALL download instead.
3. The downloaded file SHALL be named `spookify-halloween.png`.

### Requirement 5 — Static, offline-capable app
**User Story:** As the developer, I want the app to run from any static
host, so that it can be deployed on GitHub Pages for the contest.

#### Acceptance Criteria
1. The app SHALL consist only of `index.html`, `styles.css`, `app.js`
   (plus docs) with zero runtime dependencies and zero external assets.
2. The app SHALL work from `file://` and from a static host.
3. The repo SHALL contain a public GitHub URL, an MIT LICENSE, a
   README, and a `.kiro/` directory with specs, steering and hooks.

### Requirement 6 — Self-test
**User Story:** As the developer, I want an automated self-test, so that
I can prove every feature works before recording the demo video.

#### Acceptance Criteria
1. WHEN the page is opened with `?selftest=1`, THEN the app SHALL run
   the self-test and list PASS/FAIL lines in `#selftest-results`.
2. The self-test SHALL cover: sample photo load, all 6 effects render
   non-blank, story generation (title + 4 paragraphs), PNG blob
   creation, and presence of all controls.
