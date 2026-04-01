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
│   │   │   └── player.svelte.ts     # Reactive player state (queue, shuffle, repeat, progress, localStorage)
│   │   ├── types.ts                 # Track + ChartData interfaces
│   │   └── utils.ts                 # Shared utilities (formatters, highlights)
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

### Components
- **`player.svelte.ts`** — Singleton Svelte 5 runes class (`PlayerState`). Manages queue, currentIndex, shuffle (Fisher-Yates), repeat (off/all/one), progress, volume. Exposes callback slots (`_onPlay`, `_onPause`, `_onResume`, `_onSeek`, `_onVolume`) that MusicPlayer wires to the YouTube API on mount. Persists volume, shuffle, and repeat to localStorage and hydrates on construction.
- **`MusicPlayer.svelte`** — Mounted once in `+layout.svelte`. Contains a hidden 1×1 YT iframe (positioned off-screen) and a fixed bottom bar with: drag-to-seek progress bar, thumbnail, transport controls, volume slider, queue panel toggle. Handles YouTube API lifecycle (lazy load, create, ready, state change, error). Auto-advances on track end. Consecutive-error guard (max 5) prevents infinite skip loops. Space key toggles play/pause when no input is focused.
- **`PlayButton.svelte`** — Renders only when track has `ytMusicId`. Shows play icon normally, pause icon when that track is the active playing track. Calls `player.playTrack(track, allTracks)` to set queue context.
- **Queue Panel** — Toggled from MusicPlayer, slides up from the player bar. Shows upcoming tracks with: click-to-jump, drag-to-reorder (pointer-event based), remove-from-queue. Current track is highlighted.

### YouTube IFrame Workarounds
| Limitation | Workaround |
|---|---|
| Audio-only | Iframe hidden off-screen (1×1 at left:-9999px), full custom UI |
| Seamless playback | `onStateChange(ENDED)` → auto `loadVideoById` next track |
| Shuffle | Fisher-Yates on queue array, current track pinned at index 0 |
| Autoplay | First play is user-gesture; subsequent `loadVideoById` auto-plays in same session |
| Styleable UI | Custom bottom bar with Tailwind, completely replaces YT controls |
| Track coverage | Tracks without `ytMusicId` hidden (no play button), error 101/150 auto-skip |
| Mobile | Pointer events for touch seek, compact controls, volume hidden on small screens |

### Known Limitations
- iOS pauses audio when tab backgrounds (browser limitation, no workaround without native app).
- YouTube ads still play on some videos.
- Tracks with embedding restrictions (YT error 101/150) auto-skip.
- Background/lock-screen playback unreliable on mobile browsers.

### localStorage Keys
- `spotifx-volume` — number 0–100
- `spotifx-shuffle` — `"true"` | `"false"`
- `spotifx-repeat` — `"off"` | `"all"` | `"one"`

## Insights
- **Triple redundant redirect bug:** Previous versions had redirect logic spanning `+page.svelte` (client-side), `+page.ts` (SSR), and `_redirects` (build-time). Cleaned up by stripping out the onMount hook and leaving just server/static redirects.
- **Kworb schema mapping:** The `weeks` data point represents "Days" the track has been on chart. The label was updated from "Wks" to "Days" to avoid user confusion.
- **Animation and rendering considerations:** Using Svelte's `animate:flip` paired with transition states on tables causes jank. Raw CSS transitions over component states are preferred for stable performance. Relative time formatting (`timeAgo`) caused hydration issues, so absolute time rendering has been adopted.
- **Mobile responsiveness and format alignment:** Removed `flex-col` stacking in mobile `HeroTrack.svelte` and replaced it with a `flex-row` setup grouping the Rank Badge and Track info to maximize vertical efficiency. Also standardized on `formatCompact()` for all generic stream displays across `HeroTrack` and `ChartTable` for visual consistency.
- **Player SSR safety:** PlayerState class uses $state/$derived runes and guards browser interactions. Uses `typeof window === 'undefined'` for SSR guards to avoid issues in Node 22+ (which exposes `localStorage` experimentally).
- **Data Robustness:** `loadPref` includes `isNaN` guards for numeric values and optional validation for enums (e.g., `repeat` mode) to prevent corruption from tampered `localStorage`.
- **Firefox Drag Fix:** Queue reordering requires `e.dataTransfer.setData('text/plain', '')` in `ondragstart` or Firefox silently aborts the drag operation.
- **Queue reorder:** Uses pointer events (not HTML drag-and-drop) for consistent mobile/desktop behavior. Reorder swaps items in the $state array and adjusts currentIndex if affected.
- **Mobile responsive table:** `Streams` column is `hidden sm:table-cell` to prevent horizontal overflow on <640px. `Peak`/`Days` are `hidden md:table-cell`. `#` and `Listen` columns use `px-2 sm:px-4` responsive padding. `Listen` header is `w-auto sm:w-28`.
- **Mobile player bar:** Uses 3-zone flex layout: track info (`max-w-[40%] sm:max-w-none`), controls (`flex-1 justify-center`), actions (`flex-1 justify-end`). Progress bar is `h-2 sm:h-1.5` for touch. Seek thumb is always visible on mobile (`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`).
- **HeroTrack mobile:** Keep streams+icons in compact `flex` row on mobile (not flex-col) — vertical stacking pushes 82.3M out of mobile viewport.
- **Player Stats:** Updated `MusicPlayer.svelte` to display streams, peak rank, and chart days in both the main bar and queue panel. Adjusted `max-w` to 40% to accommodate the new metadata.
- **Utility Centralization:** Extracted `formatTime` and `getYTThumbUrl` to `src/lib/utils.ts` to prevent redundant, inconsistent logic across `MusicPlayer.svelte` and `HeroTrack.svelte`.
- **Media Session API:** Integrated `navigator.mediaSession` for lock-screen controls, media keys, and system media notifications. Metadata updates on track load; playback state syncs on play/pause; position state throttled to every ~2s to avoid excessive calls. Handlers set up once in MusicPlayer's `onMount`.
- **Buffering state:** `player.buffering` flag set via YT `BUFFERING` state change. Play/pause button shows animated spinner during buffering. Resets to false on `PLAYING` or `PAUSED`.
- **Play Next / Add to Queue:** `playNext(track)` inserts after current track (removes duplicates first). `addToQueue(track)` appends to end. Both start playback immediately if queue is empty. Exposed via TrackMenu context menu (three-dot button per row).
- **Keyboard shortcuts:** Extended beyond Space — arrows for seek/volume, M mute, N/P next/prev, S shuffle, R repeat, Q queue, F fullscreen, ? help modal. All blocked when input/textarea/select focused. ShortcutsModal mounted in layout.
- **Full-screen Now Playing:** `NowPlayingFull.svelte` — overlay with large artwork, track stats, seek bar, full transport controls, favorite toggle. Opens via F key, clicking track info in player bar, or chevron-down icon on mobile. Dynamic HSL gradient background from `trackToHue()`.
- **Seek bar tooltip:** Hover over progress bar shows time position tooltip above cursor. Uses `onmousemove`/`onmouseleave` on the bar element with calculated offset.
- **Equalizer animation:** Active track in ChartTable shows 3 animated bars (CSS `@keyframes eq-bar`) instead of rank number. Bars pause at static heights when track is paused.
- **Favorites system:** `favorites.svelte.ts` — localStorage-backed `Record<string, boolean>` keyed by `spotifyId`. Toggle via TrackMenu, HeroTrack button, player bar heart, or NowPlayingFull. Small filled heart icon shown next to favorited track titles in ChartTable.
- **Smooth track transitions:** `{#key track.ytMusicId}` blocks around track info in MusicPlayer and NowPlayingFull trigger `animate-fade-in` on track change for smooth visual transitions.
- **Toast notifications:** Singleton `ToastState` with `show(msg, duration)`. Auto-dismisses. Used for shuffle/repeat toggles, queue actions, and favorite changes. Mounted once in layout as `<Toast />`.
- **Dynamic gradient:** `trackToHue(artist, title)` generates deterministic hue from string hash. Applied as `hsla()` gradient on player bar background and full-screen backdrop. Avoids CORS issues with thumbnail color extraction.
- **TrackMenu click-outside:** Uses `$effect` to add/remove window click listener only when menu is open. `requestAnimationFrame` delay prevents the opening click from immediately closing the menu.
- **localStorage keys (new):** `spotifx-favorites` — JSON array of spotifyId strings.