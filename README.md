<p align="center">
  <img src="public/logo.svg" alt="SensoryReader" width="480" />
</p>

<p align="center">
  <strong>Speed reading with Optimal Recognition Point alignment</strong>
</p>

---

A single-word-at-a-time speed reading tool using **Optimal Recognition Point (ORP)** alignment. Words flash at configurable WPM in a fixed focal zone, eliminating eye saccade for faster reading with better comprehension.

Two versions included:
- **Full app** -- React + TypeScript + Vite with all features
- **Standalone** -- single HTML file for tablets and touch devices, no server needed

No backend required -- everything runs in the browser.

## Quick Start

```bash
# Full app
npm install
npm run dev
# Open http://localhost:5173/

# Standalone (no install needed)
# Open standalone.html in any browser
# Or via dev server: http://localhost:5173/standalone.html
```

## Features

### Core Reading Engine
- **ORP Alignment** -- each word is positioned so the optimal recognition point (roughly 25% from the left) always lands at the same screen pixel. Your eyes never need to move.
- **Configurable WPM** -- 100 to 1000 words per minute via slider, +/- buttons, or keyboard arrows. All WPM controls stay in sync across the playback bar, settings panel, and keyboard.
- **Chunk Mode** -- display 1, 2, or 3 words at a time. Chunks are ORP-centered for balanced visual weight. Changing chunk size instantly updates the display.
- **Adaptive Slowdown** -- automatically pauses longer on complex words (7+ characters)
- **Punctuation Pauses** -- configurable delay multipliers for commas, periods, semicolons, colons, question marks, exclamation marks, and dashes
- **Ramp-Up Mode** -- starts 20% slower and accelerates to target WPM over 10 seconds

### Input Sources
- **Paste Text** -- paste any text directly
- **File Upload** -- drag-and-drop zone or click to upload. Accepts PDF, TXT, and MD files. PDF text extraction preserves line and word structure using pdf.js with a locally bundled worker (no CDN dependency).
- **URL Fetch** -- fetch article text from any URL (uses Vite dev proxy to handle CORS)
- **Sample Library** -- 10 classic texts from Project Gutenberg (Meditations, Letters from a Stoic, The Prince, Enchiridion, Confessions, City of God, Discourses on Livy, The Imitation of Christ, King James Bible, Discourses) plus a built-in Welcome Guide
- **Recent History** -- resume previous reading sessions with saved positions and cached text

### Display
- **Draggable Text Marquee** -- drag the text display anywhere on screen. Resize it by grabbing edges or the corner handle. Subtle grip indicators appear on hover.
- **Draggable Playback Controls** -- move the control bar anywhere. Buttons and sliders remain fully clickable during drag.
- **Panel Shapes** -- None (transparent), Rectangle, Pill, Circle, or Star (CSS clip-path)
- **Text Background** -- configurable color, opacity, and backdrop blur on the marquee
- **Panel Opacity** -- control the overall marquee transparency
- **Text Opacity** -- fade text independently
- **ORP Highlight** -- the pivot character is highlighted in a configurable accent color
- **Emphasis Styles** -- long words (7+ chars), proper nouns, and post-colon words can be rendered with size boost, bold, italic, color flash, or glow effects
- **Progress Bar** -- bar, dot, or hidden. Renders at the top of the reader area.
- **Reading Guide Line** -- optional horizontal line at the focal point

### Backgrounds
- **Solid Color** -- color picker
- **Image** -- upload any image with blur radius and brightness controls
- **YouTube** -- paste any YouTube URL or video ID for ambient video background. Features:
  - On-screen playback controls: play/pause, rewind/forward 10s, restart
  - Mute/unmute toggle button
  - Volume slider (0-100%)
  - Controls are draggable -- move them anywhere, default position is bottom-right
  - Iframe scaled up to hide YouTube chrome
- **Overlay** -- configurable overlay color and opacity layered between the background and content

### Presets
Ships with 7 built-in presets:
- **Welcome** -- 250 WPM, ramp-up, YouTube background, system sans-serif. Loads with the feature overview text.
- **Focus** -- 300 WPM, large Georgia serif, solid dark blue background, gentle punctuation pauses
- **Sprint** -- 600 WPM, sans-serif, no emphasis effects, minimal progress dot, no panel shape
- **Cinematic** -- 250 WPM, bold 64px text, YouTube video background, pill panel shape, slow ramp-up
- **Dyslexia-friendly** -- OpenDyslexic font, 260 WPM, high contrast, 0.08em letter spacing, green ORP highlight
- **Night Mode** -- dark amber background, warm orange ORP highlight, high overlay opacity
- **Custom** -- blank starting point with default settings

Preset management:
- **Rename** any preset (built-in or custom) via prompt dialog
- **Save** current settings over an existing custom preset (floppy disk icon)
- **Duplicate** any preset as a new custom one
- **Export** presets as downloadable JSON files
- **Import** preset JSON files from others
- **Delete** custom presets (built-in presets cannot be deleted)

### Settings Panel
Left sidebar with 4 tabs:
- **Library** -- load text from paste, file upload (drag-and-drop), sample library, or recent history. The full input interface lives here.
- **Presets** -- view, switch, rename, save, duplicate, export, import, and delete presets
- **Text** -- speed settings (WPM slider with labeled stops, chunk size, adaptive slowdown, ramp-up, expandable punctuation pause multipliers) and typography (font family from 6 options, font size 18-96px, weight, ORP highlight color picker, letter spacing, text transform, emphasis style chips)
- **Visual** -- background mode selector (Solid/Image/YouTube), per-mode controls, overlay color and opacity, screen mode, panel shape selector, panel opacity, progress bar style, guide line toggle, text opacity, text background color/opacity/backdrop blur

Settings panel features:
- **Auto-hide** -- checkbox at top. When enabled, the sidebar automatically closes when playback starts, same as clicking the toggle button.
- **Opacity slider** -- controls the sidebar background transparency via a pseudo-element, so text and controls remain fully readable at any opacity level
- **Collapsible** -- toggle with the gear icon in the toolbar or the Escape key

### Playback Controls
- **Draggable** -- move the control bar anywhere on screen. Default position: centered, below the marquee.
- **Play/Pause** (Space or tap marquee), **Rewind 5s** (Left Arrow), **Skip Sentence** (Right Arrow)
- **WPM Slider** -- full range 100-1000, step 25, synced with settings panel and keyboard
- **WPM Nudge** -- +/- 25 WPM buttons
- **Position Scrubber** -- click or drag to jump to any word position
- **Word Count & Time Remaining** -- live display with minutes:seconds format
- **Auto-hide** -- toolbar and controls fade after 3s of mouse inactivity. Thin 8px trigger strips at top and bottom edges bring them back on hover.

### Screen Modes
- **Windowed** -- normal view
- **Fullscreen** -- uses browser Fullscreen API, synced with config setting and toolbar button
- **Focus Strip** -- constrains the reader stage to a narrow 180px horizontal band centered vertically

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Space | Play / Pause |
| Left Arrow | Rewind 5 seconds |
| Right Arrow | Skip to next sentence |
| Up Arrow | +25 WPM |
| Down Arrow | -25 WPM |
| + / = | +25 WPM |
| - | -25 WPM |
| F | Toggle fullscreen |
| Escape | Toggle settings panel |

### Persistence
All state is saved to localStorage:
- Reading position per document (keyed by content hash using djb2)
- Custom presets
- Recent document history (up to 20 entries) with cached text (up to 5 documents) for instant resume
- Usage statistics (total words read, average WPM, session count)

## Standalone Version

`standalone.html` is a single self-contained HTML file with no dependencies -- open it directly in any browser.

Optimized for **tablets and touch devices**:
- **44px+ touch targets** on all buttons and controls
- **Tap the marquee** to play/pause
- **Bottom-sheet settings drawer** -- slides up from the bottom, scrollable, swipe down to close
- **Safe area insets** for notched devices (iPad, iPhone) via `env(safe-area-inset-*)`
- **6px thick sliders** for easy thumb control
- **56px play button**, 48px transport buttons
- **No build step** -- works offline, no server needed
- **CORS proxy fallback** for Gutenberg sample texts

Includes: ORP alignment, WPM 100-1000, chunk sizes, adaptive slowdown, ramp-up, 5 presets, 6 sample texts, solid and YouTube backgrounds, overlay opacity, panel opacity, font/size/color controls, paste text, file upload (TXT/MD), drag-and-drop, progress bar, scrubber, keyboard shortcuts.

Note: PDF support requires the full React app (pdf.js dependency). The standalone version accepts TXT and MD files.

## Tech Stack

- **React 19** with TypeScript
- **Vite 8** for dev server and builds
- **pdfjs-dist** for PDF text extraction (worker loaded locally via `?url` import, no CDN)
- No state management library -- `useRef` + `useState` + `useCallback`
- No CSS framework -- CSS custom properties and vanilla CSS
- No backend -- everything runs client-side
- **Standalone version** -- vanilla HTML/CSS/JavaScript, zero dependencies

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server starts at `http://localhost:5173/`. The app opens with the Welcome preset loaded -- press Space to start reading the feature overview.

The standalone version is available at `http://localhost:5173/standalone.html` or by opening `standalone.html` directly in a browser.

## Project Structure

```
SensoryReader/
  standalone.html               -- Single-file touch-friendly version
  public/
    logo.svg                    -- Project logo
    favicon.svg                 -- Browser favicon
  src/
    types/index.ts              -- All shared TypeScript interfaces
    engine/
      orp.ts                    -- ORP pivot calculation (pure function)
      tokenizer.ts              -- Text tokenization, sentence detection, emphasis
      timing.ts                 -- Delay math: WPM, punctuation, ramp-up
    hooks/
      useReaderEngine.ts        -- Core playback loop (useRef-based timer)
      useKeyboard.ts            -- Keyboard shortcut bindings
      useLocalStorage.ts        -- Generic typed localStorage hook
      usePersistence.ts         -- Document positions, stats, presets
      useFullscreen.ts          -- Fullscreen API wrapper
    presets/
      defaults.ts               -- 7 built-in preset configurations
      presetsManager.ts         -- CRUD, import/export presets
    input/
      parseText.ts              -- Text cleaning and content hashing
      parsePdf.ts               -- PDF extraction via pdf.js
      fetchUrl.ts               -- URL article extraction
      recentHistory.ts          -- Recent documents and text caching
    data/
      sampleLibrary.ts          -- Sample text manifest and fetcher
      welcomeText.ts            -- Built-in welcome/tutorial text
    components/
      App.tsx                   -- Root layout and state wiring
      ReaderDisplay.tsx         -- ORP-aligned word rendering
      PlaybackControls.tsx      -- Transport bar with scrubber and WPM
      BackgroundEngine.tsx      -- Solid/image/YouTube backgrounds + overlay
      ConfigPanel.tsx           -- Left sidebar with all settings
      InputPanel.tsx            -- Library: paste, upload, URL, samples
      ProgressIndicator.tsx     -- Progress bar/dot display
      DraggableBox.tsx          -- Drag-to-move and resize wrapper
    styles/
      index.css                 -- All styles, CSS custom properties
  content/
    stoic_library/              -- Sample text stubs with Gutenberg links
```

## Architecture Notes

- **Timer in useRef**: The playback loop stores the current index in a ref and only triggers React re-renders when the displayed chunk changes. This prevents jitter at high WPM.
- **Config in ref**: WPM changes mid-playback are read from a config ref on each tick, so changes apply immediately without restarting the timer. The engine propagates WPM changes back to React state via a callback to keep all UI controls in sync.
- **Pure engine functions**: `orp.ts`, `tokenizer.ts`, and `timing.ts` are pure functions with no React dependencies, making them independently testable.
- **Single ReaderConfig object**: Every visual and behavioral setting lives in one typed object. Presets serialize this directly -- save the object, restore the object.
- **Draggable UI**: Text marquee and playback controls use pointer events for drag/resize. Clicks on interactive children (buttons, sliders, SVG icons) pass through correctly via `el.closest()` checks rather than simple tag name matching.
- **Pointer-events layering**: Background content layer and reader stage use `pointer-events: none` with `auto` on direct children, allowing clicks to pass through to YouTube iframes in empty areas while keeping UI elements interactive.
- **Sidebar opacity**: Uses a `::before` pseudo-element for background with `opacity` controlled by CSS variable, so sidebar text remains readable at any transparency level.
- **Auto-center positioning**: DraggableBox supports `-1` (center), `-2` (bottom-right), and `-3` (center-x, below-center-y) as initial position values, resolving to pixel coordinates on first render.
