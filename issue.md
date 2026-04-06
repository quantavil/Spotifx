# Spotifx - Active Issues & Action Plan

This document outlines the verified architectural, structural, and UX issues within the Spotifx codebase, and specifies exactly what changes are required to resolve them.

---

## 1. Dead Code (Unused Components)

**The Issue:** 
`ChartStats.svelte` and `StatCard.svelte` are lingering in the `src/lib/components/charts/` directory but are entirely unused by any active routes or components (statistics were removed from the layout). Dead code increases cognitive load, degrades search functionality, and creates accumulating technical debt.

**Required Changes:**
- **[DELETE]** `src/lib/components/charts/ChartStats.svelte`
- **[DELETE]** `src/lib/components/charts/StatCard.svelte`

---

## 2. Cold-Start Latency on First Play

**The Issue:** 
In `MusicPlayer.svelte`, the YouTube Iframe API (`https://www.youtube.com/iframe_api`) is loaded exactly when the user clicks "Play" for the first time. Because this script is roughly ~200kb, appending it and waiting for `onYouTubeIframeAPIReady` introduces a noticeable latency delay (a "cold-start") before the very first track begins playing.

**Required Changes:**
- **[MODIFY]** `src/lib/components/player/MusicPlayer.svelte`
- Refactor the player lifecycle on `onMount` to execute `loadYTApi()` invisibly in the background. Use `requestIdleCallback` (or a short `setTimeout`) 2-3 seconds after the player component mounts. This pre-warms the iframe so it's instantly ready when the user actually initiates playback.

---

## 3. DOM Rendering Drag (Lack of Virtualization)

**The Issue:** 
In `ChartTable.svelte`, search filtering and data rendering use an `#each processed as track` loop that forces Svelte to redraw all 200+ rows into the DOM at once. While Svelte handles this well on desktop, rendering massive unvirtualized node lists degrades performance, causing layout stuttering and scrolling lag on lower-tier mobile hardware.

**Required Changes:**
- **[MODIFY]** `src/lib/components/charts/ChartTable.svelte`
- Wrap the `#each` block in a viewport virtualizer. Only the rows currently visible on the screen (plus a small buffer) should be rendered to the DOM at any given time.

