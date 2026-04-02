# MEMORY.md
# Project: Spotifx

## Overview
A hobby music charts dashboard displaying weekly Spotify streaming data for multiple countries (Global, US, GB, IN, etc.). Data is scraped from kworb.net, stored as static JSON, and deployed as a static SvelteKit site to Cloudflare Pages. Includes an embedded YouTube Music player for in-app listening.

## Structure
.
├── .gitignore
├── LICENSE
├── MEMORY.md
├── README.md
├── bun.lock
├── combine.sh
├── package.json
├── plan.txt               # Current UI/UX plan and audit
├── scripts/
│   ├── scrape.ts          # Bun scraping script (run with: bun run scrape)
│   └── tsconfig.json      # Bun-targeted config for scripts/ only
├── src/
│   ├── app.css            # TailwindCSS v4 @theme tokens + dark theme
│   ├── app.d.ts
│   ├── app.html
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ChartStats.svelte    # Quick charts meta stats
│   │   │   ├── ChartTable.svelte    # Sortable chart table with inline PlayButton
│   │   │   ├── CountrySelector.svelte
│   │   │   ├── HeroTrack.svelte     # Top track gradient display with PlayButton
│   │   │   ├── ListenLinks.svelte   # Spotify + YTM outbound links
│   │   │   ├── MusicPlayer.svelte   # Fixed bottom player bar + hidden YT iframe + queue panel
│   │   │   ├── PlayButton.svelte    # Inline per-track play/pause trigger
│   │   │   ├── RankBadge.svelte
│   │   │   └── SearchBar.svelte     # Search with debouncing
│   │   ├── config/
│   │   │   └── countries.ts         # Country code/name/slug definitions
│   │   ├── data/                    # Scraped JSON (global/us/gb/in)
│   │   │   ├── gb.json
│   │   │   ├── global.json
│   │   │   ├── in.json
│   │   │   └── us.json
│   │   ├── stores/
│   │   │   ├── player.svelte.ts     # Reactive player state (queue, shuffle, repeat, progress, localStorage)
│   │   │   ├── mediaSession.ts      # Media Session API wrapper (metadata, position, handlers)
│   │   │   ├── toast.svelte.ts      # Toast notification store
│   │   │   └── favorites.svelte.ts  # Favorites (spotifyId set, localStorage)
│   │   ├── types.ts                 # Track + ChartData interfaces
│   │   └── utils.ts                 # Shared utilities (formatters, highlights, trackToHue)
│   └── routes/
│       ├── +error.svelte
│       ├── +layout.svelte           # Header + CountrySelector + MusicPlayer mount + footer
│       ├── +layout.ts               # prerender: true
│       ├── +page.svelte             # Redirect stub
│       ├── +page.ts                 # Redirects to /chart/global
│       └── chart/[country]/
│           ├── +page.svelte         # Dashboard: HeroTrack, ChartStats, Play All/Shuffle, ChartTable
│           └── +page.ts             # Loads JSON from $lib/data/{country}.json
├── static/
│   ├── _redirects
│   └── favicon.svg
├── svelte.config.js
├── test-kworb.js
├── tsconfig.json          # SvelteKit root config — excludes scripts/
└── vite.config.ts

## Conventions
- SvelteKit 2 with Svelte 5 (Runes syntax).
- TailwindCSS v4 — no tailwind.config.js, uses CSS-based @theme in app.css.
- Bun for runtime and package management.
- Static adapter for deployment.
- `bun run scrape` — runs scripts/scrape.ts via Bun directly.

## Dependencies & Setup
- Bun runtime required.
- GitHub Actions for daily scraping and deployment.
- No extra npm deps for player — YouTube IFrame API loaded via <script> tag on demand.

## Critical Information
- Data source is kworb.net.
- Player uses YouTube IFrame API (lazy-loaded ~200KB on first play interaction).
- ytMusicId per track is resolved during scraping via ytmusic-api and cached across countries.

## Player Architecture

### Data Model
- **`QueueEntry`** — extends `Track` with `_qid: number` (auto-incrementing unique ID per queue insertion). Ensures stable Svelte `{#each}` keys even with duplicate tracks. Created via `toEntry(track)` / `toEntries(tracks)` helper functions in the store.

### Components
- **`player.svelte.ts`** — Singleton Svelte 5 runes class (`PlayerState`). Manages queue of `QueueEntry[]`, currentIndex, shuffle (Fisher-Yates), repeat (off/all/one), progress, volume. Exposes:
  - Callback slots (`_onPlay`, `_onPause`, `_onResume`, `_onSeek`, `_onVolume`) wired by MusicPlayer on mount.
  - Explicit `play()` and `pause()` methods (not just `togglePlay()`) for correct MediaSession integration.
  - `seek(fraction)` guards against `duration <= 0`.
  - Persists volume, shuffle, and repeat to localStorage and hydrates on construction.

- **`MusicPlayer.svelte`** — Mounted once in `+layout.svelte`. Contains a hidden 1×1 YT iframe (positioned off-screen) and a fixed bottom bar with: drag-to-seek progress bar, thumbnail, transport controls, volume slider, queue panel toggle. Handles YouTube API lifecycle (lazy load, create, ready, state change, error). Auto-advances on track end. Key implementation details:
  - **`wantedPlaying`** flag — tracks user intent separately from `player.isPlaying`. Used to guard `pendingVideoId` loading on `onPlayerReady`, visibility change recovery, and error-state cleanup.
  - **`apiLoading`** flag + `querySelector` check — prevents duplicate YT API script injection.
  - **Consecutive-error guard** (max 5) with reset on every new `_onPlay` call.
  - **Error code handling** — reads `event.data` from YT errors, shows contextual toast for codes 100 (not found), 101/150 (embedding blocked).
  - **Drag-to-reorder** uses `ondrop` for actual reorder, `ondragend` only resets visual state (prevents accidental reorder on drag cancel/Escape).
  - **Seek safety** — `seekFromPointer` returns early when `duration <= 0`; `setPointerCapture` wrapped in try/catch.
  - **Teardown safety** — `onDestroy` nulls `ytPlayer` reference and `playerReady` flag before calling `destroy()` on saved ref; `onPlayerError`/`onPlayerStateChange` return early when `!playerReady`.
  - **Visibility change** — resumes playback when page becomes **visible** (not hidden), only if `wantedPlaying` is true.

- **`PlayButton.svelte`** — Renders only when track has `ytMusicId`. Shows play icon normally, pause icon when that track is the active playing track. Calls `player.playTrack(track, allTracks)` to set queue context.

- **Queue Panel** — Toggled from MusicPlayer, slides up from the player bar. Shows upcoming tracks with: click-to-jump, drag-to-reorder (drop-based), remove-from-queue. Uses `track._qid` as stable `{#each}` key. Current track is highlighted.

### YouTube IFrame Workarounds
| Limitation | Workaround |
|---|---|
| Audio-only | Iframe hidden off-screen (1×1 at left:-9999px), full custom UI |
| Seamless playback | `onStateChange(ENDED)` → auto `loadVideoById` next track |
| Shuffle | Fisher-Yates on queue array, current track pinned at index 0 |
| Autoplay | First play is user-gesture; subsequent `loadVideoById` auto-plays in same session |
| Styleable UI | Custom bottom bar with Tailwind, completely replaces YT controls |
| Track coverage | Tracks without `ytMusicId` hidden (no play button), error 101/150 auto-skip with toast |
| Mobile | Pointer events for touch seek, compact controls, volume hidden on small screens, `playsinline: 1` |
| Tab backgrounding | `visibilitychange` listener resumes on page visible if `wantedPlaying`; cannot override browser/OS suspension |
| Stale pending video | `onPlayerReady` guards `pendingVideoId` with `wantedPlaying` check |
| Duplicate scripts | `apiLoading` flag + DOM querySelector prevents double YT API injection |

### MediaSession Integration
- **`mediaSession.ts`** — wraps `navigator.mediaSession` with `hasAPI()` guard.
- **Handlers**: `play` → `player.play()`, `pause` → `player.pause()` (explicit, not toggle). `seekto` updates both `currentTime` and calls `_onSeek`.
- **Position state** updated every ~2s (every 8th polling tick at 250ms interval).
- Cleanup: not explicitly needed since MusicPlayer mounts once in root layout and lives for app lifetime.

### Known Limitations
- iOS pauses audio when tab backgrounds (browser limitation, no workaround without native app).
- YouTube ads still play on some videos.
- Tracks with embedding restrictions (YT error 101/150) auto-skip with user-facing toast.
- Background/lock-screen playback unreliable on mobile browsers — `wantedPlaying` + visibility recovery is best-effort.
- YouTube iframe is not equivalent to a native `<audio>` element; browsers may throttle/suspend hidden cross-origin iframes.

### localStorage Keys
- `spotifx-volume` — number 0–100
- `spotifx-shuffle` — `"true"` | `"false"`
- `spotifx-repeat` — `"off"` | `"all"` | `"one"`
- `spotifx-favorites` — JSON array of Spotify track IDs
