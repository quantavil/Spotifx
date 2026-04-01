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

## Project Structure
- `scripts/scrape.ts` - The data scraping pipeline.
- `src/lib/data/` - Locally stored static JSON chart data.
- `src/routes/` - SvelteKit frontend implementation.
- `src/lib/components/` - Svelte components (ChartTable, CountrySelector, etc.).

## License
Refer to the [LICENSE](./LICENSE) file for details.
