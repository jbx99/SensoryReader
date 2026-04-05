Here's a comprehensive MVP outline for your speed reading tool — I'll render the architecture visually and follow with the full feature breakdown.---

## Speed Reader — MVP Outline

### 1. Core Concept

A single-word-at-a-time speed reading tool using the **Optimal Recognition Point (ORP)** method — the slight left-of-center position in a word where the eye locks on fastest. Words flash at configurable WPM in a fixed focal zone. Every visual and behavioral parameter is user-configurable, with preset profiles for instant switching.

---

### 2. Input Layer

The reader accepts text from four sources: direct paste, plain text or PDF file upload, URL fetch (extracts article body), and a recent history sidebar for resuming sessions. Text preprocessing strips HTML artifacts, normalizes whitespace, and segments the corpus into tokens (words) and sentence boundaries (used by the adaptive timing engine).

---

### 3. Reader Engine

This is the brain of the tool — a timing controller that advances a word pointer through the token array at the configured interval.

**Timing controller** fires word display events at the computed delay (`60000 / WPM` ms), with optional overrides: longer pauses after punctuation (commas, periods, semicolons), configurable multipliers per punctuation type, and a ramp-up mode that starts 20% slower and accelerates to target WPM over the first 10 seconds.

**Emphasis detector** scans ahead for long words (7+ chars), proper nouns, and words following colons — flagging them for visual emphasis in the display layer.

**Chunk mode** lets users display 1, 2, or 3 words simultaneously when comprehension at high WPM requires grouping.

**ORP alignment** computes the pivot character for each word (roughly `floor(length / 4) + 1`) and horizontally aligns every word so that pivot character always lands at the same screen pixel — eliminating eye saccade entirely.

---

### 4. Display Layer

The display zone is the fullscreen focal area — a centered text stage with everything else subordinate to it.

**Word display** renders the current word in a fixed-height, fixed-width frame. The ORP character is highlighted in a user-chosen accent color (default: red). Letter spacing and baseline are locked so the focal point never moves.

**Emphasis styles** include: increase font size by 10–20%, bold weight, italics, brief color flash, or a glow pulse. These apply to flagged words from the emphasis detector. Users configure which styles activate and their intensity.

**Background engine** is a distinct subsystem with four modes. Solid color renders a plain background from a color picker with opacity control over the text panel. Custom image accepts any uploaded image with controls for blur radius, brightness dim, and parallax scrolling speed. Video clip loops an uploaded `.mp4` or `.webm` behind the text with mute enforced and playback synchronized to reading state (pauses when reading pauses). All background modes share an overlay layer: a colored/frosted glass panel behind the word display with configurable opacity, border radius, and padding — ensuring text always remains legible regardless of background content.

---

### 5. Configuration Panel

The settings drawer is accessible via keyboard shortcut or sidebar toggle and is organized into four groups.

**Speed settings** expose WPM (slider, 100–1500 with labeled stops at 250/400/600/900), chunk size (1–3 words), punctuation pause multipliers, adaptive slowdown for long words, and ramp-up mode toggle.

**Typography settings** expose font family (system fonts + a curated list of reading-optimized options: OpenDyslexic, Atkinson Hyperlegible, Source Serif, JetBrains Mono), font size (18–96px), weight (regular vs medium vs bold base), ORP highlight color, letter spacing, and word case transform (none / uppercase / lowercase).

**Background settings** expose the four background modes, plus controls specific to each: for video, playback speed multiplier and opacity; for images, zoom level, pan offset, and whether the image blurs at session start and sharpens gradually (a focus-induction effect).

**Display settings** cover the text panel shape (none / pill / rectangle), panel opacity, screen mode (windowed / fullscreen / focus strip — a narrow horizontal band), progress bar style (minimal dot / full bar / none), and reading guide line (a horizontal underline that stays fixed at eye level).

---

### 6. Presets System

Presets serialize the entire configuration object (speed + typography + background + display) to JSON. The MVP ships with six built-in profiles:

* **Focus** — 300 WPM, large serif, solid dark background, gentle pause on punct.
* **Sprint** — 600 WPM, sans-serif, no emphasis, minimal UI.
* **Cinematic** — 250 WPM, large weight, video background, slow ramp-up.
* **Dyslexia-friendly** — OpenDyslexic font, 260 WPM, high contrast, wider letter spacing.
* **Night mode** — dark amber panel, warm text color, reduced brightness background.
* **Custom** — blank template users build from scratch.

Users can save, rename, duplicate, delete, and export presets as `.json` files. Import accepts the same format. A per-document preference flag lets the tool remember which preset was active when a given document was last opened.

---

### 7. Playback Controls

The control bar (auto-hides in fullscreen, reappears on mouse move) includes: Play/Pause (spacebar), Rewind 5 seconds (left arrow), Skip to next sentence (right arrow), a word-position scrubber (click to jump), a live WPM display with +/- nudge buttons (±25 WPM), word count / estimated time remaining, and a focus mode toggle that hides all chrome except the word display.

---

### 8. Persistence Layer

For the MVP, all state is persisted to localStorage: current reading position per document (keyed by content hash), saved presets, last-used background assets (cached as blob URLs), and basic usage stats (total words read, average WPM, sessions). A future v2 layer would replace this with cloud sync and cross-device continuity.

---

### 9. Tech Stack Recommendation

Since this is a frontend-heavy tool, a single-page React app is well-suited — `useRef` for the timing loop (not `useState`, to avoid re-render jitter), `Canvas` or CSS transforms for ORP alignment, and the File API for asset ingestion. Video background playback uses a `<video>` element behind a CSS `z-index` stack. For PDF parsing, `pdf.js` handles extraction client-side. No backend is required for the MVP — everything runs in-browser.

---

### 10. MVP Scope Boundary

Out of scope for v1: text-to-speech sync, AI-generated summaries, collaborative reading, annotation/highlighting, browser extension, and mobile app. These are natural v2 targets once the core reading loop is validated.
