// scripts/scrape.ts
import { parse, type HTMLElement } from 'node-html-parser';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { countries } from '../src/lib/config/countries';

// ── YTMusic Setup (handle CJS/ESM mismatch) ──

let YTMusic: any;
try {
	const mod = await import('ytmusic-api');
	YTMusic = (mod as any).default?.default || (mod as any).default || mod;
} catch {
	YTMusic = null;
}

// ── Types ──

interface Track {
	rank: number;
	change: string;
	title: string;
	artist: string;
	spotifyId: string;
	ytMusicId: string;
	streams: number;
	peak: number;
	weeks: number;
}

// ── Helpers ──

const randomDelay = (min: number, max: number) =>
	new Promise((r) => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));

async function withRetry<T>(op: () => Promise<T>, retries = 3, baseDelay = 1000): Promise<T> {
	for (let i = 0; i < retries; i++) {
		try {
			return await op();
		} catch (err) {
			if (i === retries - 1) throw err;
			console.log(`      ⚠ Retry ${i + 1}/${retries} failed, waiting...`);
			await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, i)));
		}
	}
	throw new Error('Unreachable');
}

const BASE_URL = 'https://kworb.net/spotify/country';
const DATA_DIR = join(import.meta.dir, '..', 'src', 'lib', 'data');

/** Cache YTMusic lookups across countries to avoid duplicate searches */
const ytCache = new Map<string, string>();

function ytCacheKey(artist: string, title: string): string {
	return `${artist.toLowerCase().trim()}|||${title.toLowerCase().trim()}`;
}

async function searchYTMusicId(
	ytmusic: any,
	artist: string,
	title: string
): Promise<string> {
	if (!ytmusic) return '';

	const key = ytCacheKey(artist, title);
	if (ytCache.has(key)) return ytCache.get(key)!;

	try {
		const query = `${artist} ${title}`;
		const results = (await withRetry(() => ytmusic.searchSongs(query), 3, 500)) as any[];

		// Handle different response shapes across versions
		const first = results?.[0];
		const videoId = first?.videoId || first?.id || '';

		ytCache.set(key, videoId);

		if (!videoId) {
			console.log(`      ⚠ No YTM result for: ${query}`);
		}

		return videoId;
	} catch (err) {
		console.log(`      ⚠ YTM search failed entirely for "${artist} - ${title}":`, (err as Error).message);
		ytCache.set(key, '');
		return '';
	}
}

function findColIndex(headers: string[], ...candidates: string[]): number {
	for (const c of candidates) {
		const idx = headers.findIndex((h) => h.toLowerCase().includes(c.toLowerCase()));
		if (idx !== -1) return idx;
	}
	return -1;
}

function findExactColIndex(headers: string[], exact: string): number {
	return headers.findIndex((h) => h.toLowerCase().trim() === exact.toLowerCase());
}

function parseChange(raw: string): string {
	const trimmed = raw.trim();
	if (!trimmed || trimmed === '0' || trimmed === '--' || trimmed === '—') return '0';
	if (trimmed.toUpperCase() === 'NEW') return 'NEW';
	if (trimmed.toUpperCase() === 'RE') return 'RE';
	const num = parseInt(trimmed);
	if (isNaN(num)) return trimmed;
	return num > 0 ? `+${num}` : `${num}`;
}

function parseNumber(raw: string): number {
	return parseInt(raw.replace(/,/g, '').trim()) || 0;
}

function extractWeekDate(root: HTMLElement): string {
	const sources = [
		root.querySelector('title')?.text || '',
		root.querySelector('h1')?.text || '',
		root.querySelector('h2')?.text || '',
		root.querySelector('h3')?.text || ''
	];
	for (const s of sources) {
		const m = s.match(/(\d{4}-\d{2}-\d{2})/);
		if (m) return m[1];
		const m2 = s.match(/(\w{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
		if (m2) {
			const d = new Date(`${m2[1]} ${m2[2]}, ${m2[3]}`);
			if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
		}
	}
	return new Date().toISOString().split('T')[0];
}

// ── Init YTMusic ──

async function initYTMusic(): Promise<any | null> {
	if (!YTMusic) {
		console.warn('⚠️  ytmusic-api not available (import failed)\n');
		return null;
	}

	try {
		console.log('🎵 Initializing YouTube Music API…');
		console.log('   Constructor type:', typeof YTMusic, YTMusic?.name || '(anonymous)');

		const yt = new YTMusic();
		await yt.initialize();

		// Verify it actually works with a test search
		const test = await yt.searchSongs('test');
		if (!Array.isArray(test)) {
			console.warn('⚠️  YTMusic searchSongs returned non-array — skipping\n');
			return null;
		}

		console.log(`✅ YouTube Music API ready (test search returned ${test.length} results)\n`);
		return yt;
	} catch (err) {
		console.warn('⚠️  YouTube Music API init failed — scraping without YTM links');
		console.warn('   Error:', (err as Error).message, '\n');
		return null;
	}
}

// ── Scrape one country ──

async function scrapeCountry(
	country: { code: string; name: string; slug: string },
	ytmusic: any | null
): Promise<void> {
	const url = `${BASE_URL}/${country.slug}.html`;
	console.log(`⏳ ${country.name} → ${url}`);

	const res = await withRetry(
		() =>
			fetch(url, {
				headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MusicChartsDash/1.0)' }
			}).then((r) => {
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				return r;
			}),
		3,
		2000
	);

	const html = await res.text();
	const root = parse(html);
	const table = root.querySelector('table');
	if (!table) throw new Error('No table found');

	const allRows = table.querySelectorAll('tr');
	const headerCells = allRows[0]?.querySelectorAll('th, td') || [];
	const headers = headerCells.map((c) => c.text.trim());

	const streamsExact = findExactColIndex(headers, 'streams');

	const COL = {
		pos: findColIndex(headers, 'pos', '#'),
		change: findColIndex(headers, 'p+', '+/-', 'change'),
		track: findColIndex(headers, 'artist', 'title', 'track'),
		days: findColIndex(headers, 'days', 'wks', 'weeks'),
		peak: findColIndex(headers, 'pk', 'peak'),
		streams: streamsExact !== -1 ? streamsExact : findColIndex(headers, 'streams')
	};

	if (COL.pos === -1) COL.pos = 0;
	if (COL.change === -1) COL.change = 1;
	if (COL.track === -1) COL.track = 2;
	if (COL.days === -1) COL.days = 3;
	if (COL.peak === -1) COL.peak = 4;
	if (COL.streams === -1) COL.streams = 6;

	const weekDate = extractWeekDate(root);
	const tracks: Track[] = [];

	for (let i = 1; i < allRows.length && tracks.length < 200; i++) {
		const cells = allRows[i].querySelectorAll('td');
		if (cells.length < 5) continue;

		const rank = parseInt(cells[COL.pos]?.text.trim());
		if (isNaN(rank)) continue;

		const change = parseChange(cells[COL.change]?.text || '');

		const trackCell = cells[COL.track];

		let spotifyId = '';
		let artist = '';
		let title = '';

		if (trackCell) {
			const trackText = trackCell.text.trim();
			const sepIdx = trackText.indexOf(' - ');
			if (sepIdx !== -1) {
				artist = trackText.substring(0, sepIdx).trim();
				title = trackText.substring(sepIdx + 3).trim();
			} else {
				artist = '';
				title = trackText;
			}

			const trackLinks = trackCell.querySelectorAll('a');
			for (const a of trackLinks) {
				const href = a.getAttribute('href') || '';
				const m = href.match(/\/track\/(.+?)\.html/);
				if (m) {
					spotifyId = m[1];
					break;
				}
			}
		}

		const streams = parseNumber(cells[COL.streams]?.text || '0');
		const peak = parseNumber(cells[COL.peak]?.text || '0');
		const weeks = parseNumber(cells[COL.days]?.text || '0');

		tracks.push({ rank, change, title, artist, spotifyId, ytMusicId: '', streams, peak, weeks });
	}

	// ── Enrich with YouTube Music IDs ──
	if (ytmusic) {
		console.log(`   🎵 Resolving YTMusic IDs for ${tracks.length} tracks…`);
		let resolved = 0;
		let cached = 0;
		for (let i = 0; i < tracks.length; i++) {
			const track = tracks[i];
			if (!track.artist || !track.title) continue;

			const key = ytCacheKey(track.artist, track.title);
			const wasCached = ytCache.has(key);

			track.ytMusicId = await searchYTMusicId(ytmusic, track.artist, track.title);

			if (track.ytMusicId) resolved++;
			if (wasCached) cached++;

			// Progress every 25 tracks
			if ((i + 1) % 25 === 0) {
				console.log(`      Progress: ${i + 1}/${tracks.length} (${resolved} resolved, ${cached} from cache)`);
			}

			// Rate limit only for non-cached lookups
			if (!wasCached) {
				await randomDelay(300, 800);
			}
		}
		console.log(`   ✅ YTMusic: ${resolved}/${tracks.length} resolved (${cached} cached, ${ytCache.size} total unique)`);
	} else {
		console.log('   ⏭ Skipping YTMusic enrichment (API unavailable)');
	}

	const data = {
		country: country.code,
		countryName: country.name,
		weekDate,
		lastUpdated: new Date().toISOString(),
		tracks
	};

	const outPath = join(DATA_DIR, `${country.code}.json`);
	writeFileSync(outPath, JSON.stringify(data, null, 2));
	console.log(`   ✅ ${tracks.length} tracks → ${outPath}\n`);
}

// ── Main ──

async function main() {
	mkdirSync(DATA_DIR, { recursive: true });

	const ytmusic = await initYTMusic();

	for (const country of countries) {
		try {
			await scrapeCountry(country, ytmusic);
		} catch (err) {
			console.error(`   ❌ Failed to scrape ${country.code} after retries:`, (err as Error).message);
		}
		await randomDelay(1500, 3000);
	}

	console.log(`\n🎉 Done! (${ytCache.size} unique YTMusic lookups cached)`);
}

main();