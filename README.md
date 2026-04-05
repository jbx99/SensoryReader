<p align="center">
  <img src="public/logo.svg" alt="SensoryReader" width="480" />
</p>

<p align="center">
  <strong>Speed reading with Optimal Recognition Point alignment</strong>
</p>

---

A single-word-at-a-time speed reading tool using **Optimal Recognition Point (ORP)** alignment. Words flash at configurable WPM in a fixed focal zone, eliminating eye saccade for faster reading with better comprehension.

Built with React, TypeScript, and Vite. No backend required -- everything runs in the browser.

## Features

### Core Reading Engine
- **ORP Alignment** -- each word is positioned so the optimal recognition point (roughly 25% from the left) always lands at the same screen pixel. Your eyes never need to move.
- **Configurable WPM** -- 100 to 1000 words per minute via slider, +/- buttons, or keyboard arrows
- **Chunk Mode** -- display 1, 2, or 3 words at a time. Chunks are ORP-centered for balanced visual weight.
- **Adaptive Slowdown** -- automatically pauses longer on complex words (7+ characters)
- **Punctuation Pauses** -- configurable delay multipliers for commas, periods, semicolons, colons, question marks, exclamation marks, and dashes
- **Ramp-Up Mode** -- starts 20% slower and accelerates to target WPM over 10 seconds

### Input Sources
- **Paste Text** -- paste any text directly
- **File Upload** -- drag-and-drop or click to upload PDF, TXT, or MD files. PDF text extraction preserves line and word structure via pdf.js.
- **URL Fetch** -- fetch article text from any URL (uses Vite dev proxy to handle CORS)
- **Sample Library** -- 10 classic texts from Project Gutenberg (Meditations, Letters from a Stoic, The Prince, etc.) plus a built-in Welcome Guide
- **Recent History** -- resume previous reading sessions with saved positions

### Display
- **Draggable Text Marquee** -- drag the text display anywhere on screen. Resize it by grabbing edges or corners.
- **Panel Shapes** -- None, Rectangle, Pill, Circle, or Star
- **Text Background** -- configurable color, opacity, and backdrop blur
- **Panel Opacity** -- control the overall marquee transparency
- **Text Opacity** -- fade text independently
- **ORP Highlight** -- the pivot character is highlighted in a configurable accent color
- **Emphasis Styles** -- long words, proper nouns, and post-colon words can be rendered with size boost, bold, italic, color flash, or glow effects
- **Progress Bar** -- bar, dot, or hidden
- **Reading Guide Line** -- optional horizontal line at the focal point

### Backgrounds
- **Solid Color** -- color picker
- **Image** -- upload any image with blur and brightness controls
- **YouTube** -- paste any YouTube URL for ambient video background. Includes on-screen playback controls (play/pause, rewind/forward 10s, restart), mute/unmute button, and volume slider.
- **Overlay** -- configurable overlay color and opacity between the background and content

### Presets
Ships with 7 built-in presets:
- **Welcome** -- 250 WPM, ramp-up, YouTube background, system sans-serif font
- **Focus** -- 300 WPM, large serif, solid dark background
- **Sprint** -- 600 WPM, sans-serif, no emphasis, minimal UI
- **Cinematic** -- 250 WPM, bold large text, YouTube background, slow ramp-up
- **Dyslexia-friendly** -- OpenDyslexic font, 260 WPM, high contrast, wide letter spacing
- **Night Mode** -- dark amber tones, warm text color
- **Custom** -- blank starting point

Presets support:
- **Rename** any preset (built-in or custom)
- **Save** current settings over an existing custom preset
- **Duplicate** any preset as a new custom one
- **Export/Import** presets as JSON files
- **Delete** custom presets

### Settings Panel
Left sidebar with 4 tabs:
- **Library** -- load text from paste, file, URL, samples, or history
- **Presets** -- manage and switch presets
- **Text** -- speed settings (WPM, chunk size, adaptive slowdown, ramp-up, punctuation pauses) and typography (font, size, weight, ORP color, letter spacing, transform, emphasis styles)
- **Visual** -- background mode and settings, overlay color/opacity, screen mode, panel shape/opacity, progress bar, guide line, text opacity, text background color/opacity/blur

Settings panel features:
- **Auto-hide** -- automatically closes when playback starts (checkbox at top)
- **Opacity slider** -- make the settings panel transparent to see through to the background
- **Collapsible** -- toggle with the gear icon or Escape key

### Playback Controls
- **Draggable** -- move the control bar anywhere on screen
- **Play/Pause** (Space), **Rewind 5s** (Left Arrow), **Skip Sentence** (Right Arrow)
- **WPM Slider** -- full range 100-1000, synced with settings panel
- **WPM Nudge** -- +/- 25 WPM buttons
- **Position Scrubber** -- click or drag to jump to any position
- **Word Count & Time Remaining**
- **Auto-hide** -- fades after 3s of mouse inactivity, reappears on mouse move. Thin trigger strips at top/bottom edges ensure controls are always reachable.

### Screen Modes
- **Windowed** -- normal view
- **Fullscreen** -- browser fullscreen API, synced with config
- **Focus Strip** -- narrow 180px horizontal reading band

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
- Reading position per document (keyed by content hash)
- Custom presets
- Recent document history with cached text for resume
- Usage statistics (total words read, average WPM, sessions)

## Tech Stack

- **React 19** with TypeScript
- **Vite 8** for dev server and builds
- **pdfjs-dist** for PDF text extraction (worker loaded locally, no CDN)
- No state management library -- `useRef` + `useState` + `useCallback`
- No CSS framework -- CSS custom properties and vanilla CSS
- No backend -- everything runs client-side

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

## Project Structure

```
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
    ReaderDisplay.tsx          -- ORP-aligned word rendering
    PlaybackControls.tsx       -- Transport bar with scrubber and WPM
    BackgroundEngine.tsx       -- Solid/image/YouTube backgrounds + overlay
    ConfigPanel.tsx            -- Left sidebar with all settings
    InputPanel.tsx             -- Library: paste, upload, URL, samples
    ProgressIndicator.tsx      -- Progress bar/dot display
    DraggableBox.tsx           -- Drag-to-move and resize wrapper
  styles/
    index.css                 -- All styles, CSS custom properties
```

## Architecture Notes

- **Timer in useRef**: The playback loop stores the current index in a ref and only triggers React re-renders when the displayed chunk changes. This prevents jitter at high WPM.
- **Config in ref**: WPM changes mid-playback are read from a config ref on each tick, so changes apply immediately without restarting the timer.
- **Pure engine functions**: `orp.ts`, `tokenizer.ts`, and `timing.ts` are pure functions with no React dependencies, making them independently testable.
- **Single ReaderConfig object**: Every visual and behavioral setting lives in one typed object. Presets serialize this directly -- save the object, restore the object.
- **Draggable UI**: Text marquee and playback controls use pointer events for drag/resize. Clicks on interactive children (buttons, sliders) pass through correctly via `el.closest()` checks.
