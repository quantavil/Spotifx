# Project: Spotifx

## Overview
A hobby music charts dashboard displaying weekly Spotify streaming data for multiple countries (Global, US, GB, IN, etc.). Data is scraped from kworb.net, stored as static JSON, and deployed as a static SvelteKit site to Cloudflare Pages.

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
│   │   │   ├── ChartTable.svelte
│   │   │   ├── CountrySelector.svelte
│   │   │   ├── HeroTrack.svelte     # Top track gradient display
│   │   │   ├── ListenLinks.svelte
│   │   │   ├── RankBadge.svelte
│   │   │   └── SearchBar.svelte     # Search with debouncing
│   │   ├── config/
│   │   │   └── countries.ts         # Country code/name/slug definitions
│   │   ├── data/                    # Scraped JSON (global/us/gb/in)
│   │   │   ├── gb.json
│   │   │   ├── global.json
│   │   │   ├── in.json
│   │   │   └── us.json
│   │   ├── types.ts                 # Track + ChartData interfaces
│   │   └── utils.ts                 # Shared utilities (formatters, highlights)
│   └── routes/
│       ├── +error.svelte
│       ├── +layout.svelte           # Header (CountrySelector) + footer
│       ├── +layout.ts               # prerender: true
│       ├── +page.svelte             # Redirect stub
│       ├── +page.ts                 # Redirects to /chart/global
│       └── chart/[country]/
│           ├── +page.svelte         # Dashboard showing HeroTrack, ChartStats, and ChartTable
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

## Critical Information
- Data source is kworb.net.
- Outbound links only; no native player or Spotify API auth.

## Insights
- **Triple redundant redirect bug:** Previous versions had redirect logic spanning `+page.svelte` (client-side), `+page.ts` (SSR), and `_redirects` (build-time). Cleaned up by stripping out the onMount hook and leaving just server/static redirects.
- **Kworb schema mapping:** The `weeks` data point represents "Days" the track has been on chart. The label was updated from "Wks" to "Days" to avoid user confusion.
- **Animation and rendering considerations:** Using Svelte's `animate:flip` paired with transition states on tables causes jank. Raw CSS transitions over component states are preferred for stable performance. Relative time formatting (`timeAgo`) caused hydration issues, so absolute time rendering has been adopted.
- **Mobile responsiveness and format alignment:** Removed `flex-col` stacking in mobile `HeroTrack.svelte` and replaced it with a `flex-row` setup grouping the Rank Badge and Track info to maximize vertical efficiency. Also standardized on `formatCompact()` for all generic stream displays across `HeroTrack` and `ChartTable` for visual consistency.
