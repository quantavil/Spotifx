# Spotifx

A hobby music charts dashboard displaying weekly Spotify streaming data across multiple regions (Global, US, GB, IN, etc.). 

## Overview
Spotifx is a static SvelteKit site that provides an interactive dashboard to view Spotify charts. The data is scraped from [kworb.net](https://kworb.net/), processed into static JSON files via a Bun script, and deployed to Cloudflare Pages.

## Features
- **Global & Regional Charts:** View top streamed tracks for various countries.
- **Fast & Static:** Fully pre-rendered static site using SvelteKit 2 and Svelte 5.
- **Deep Integrations & UX:** Includes highlight tracking, dynamic stats bar (total streams, entries, biggest movers), search debouncing, keyboard shortcuts, and a responsive Hero track display with compact stream formatting.
- **Modern Styling:** Built with TailwindCSS v4 natively using `@theme`.
- **Automated Scraping:** Daily data updates via GitHub Actions.

## Tech Stack
- **Framework:** SvelteKit (Svelte 5 Runes)
- **Styling:** TailwindCSS v4
- **Runtime & Scripts:** Bun
- **Hosting:** Cloudflare Pages

## Player Architecture
Spotifx features a custom, gapless Music Player built on top of the YouTube IFrame API:
- **Streaming Quality:** YouTube's API does not support native "audio-only" streaming. To save bandwidth, we constrain the player to `1x1` pixels, which signals YouTube's Adaptive Bitrate (ABR) algorithm to stream the lowest available video quality (typically 144p). The audio quality remains standard (usually ~128kbps AAC/Opus).
- **Hidden Video Location:** The actual YouTube iframe is mounted completely off-screen (`left: -9999px`, `top: -9999px`) inside a `fixed`, `pointer-events-none` container in `MusicPlayer.svelte`. The UI you interact with is 100% custom Svelte/Tailwind.
- **Handling Ads:** spotifx passes `modestbranding: 1` and `rel: 0`, and ignores annotations (`iv_load_policy: 3`). However, as per YouTube's embedded policies, ads may still occasionally play depending on the copyright holder of the track.
- **Error Recovery:** Tracks that restrict external embedding (YouTube Error 101/150) are automatically skipped. If the player hits 5 consecutive errors, it pauses safely to prevent infinite skip loops.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) is required to run the scripts and install dependencies.

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Spotifx
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Scrape the latest data (populates `src/lib/data/`):
   ```bash
   bun run scrape
   ```
4. Start the development server:
   ```bash
   bun run dev
   ```

## Deployment 
Spotifx is built as a static site using `@sveltejs/adapter-static`. It must be deployed to **Cloudflare Pages** (not Workers) as it requires no server-side rendering.

1. In your Cloudflare Dashboard, go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**
2. Select your repository. 
3. Configure the build settings:
   - **Framework preset:** SvelteKit
   - **Build command:** `bun run build`
   - **Build output directory:** `build`
4. Set the `BUN_VERSION` environment variable to ensure Cloudflare uses Bun. 
5. Deploy. Cloudflare Pages will automatically serve the static files from the `build` directory.

## Project Structure
- `scripts/scrape.ts` - The data scraping pipeline.
- `src/lib/data/` - Locally stored static JSON chart data.
- `src/routes/` - SvelteKit frontend implementation.
- `src/lib/components/` - Svelte components (ChartTable, CountrySelector, etc.).

## License
Refer to the [LICENSE](./LICENSE) file for details.
