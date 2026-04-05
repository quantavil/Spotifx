<!-- src/routes/chart/[country]/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { player } from '$lib/stores/player.svelte';
	import { trackToHue } from '$lib/utils';
	import ChartTable from '$lib/components/charts/ChartTable.svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import HeroTrack from '$lib/components/track/HeroTrack.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	let { data }: { data: PageData } = $props();
	let searchQuery = $state('');

	const heroTrack = $derived(data.chart.tracks[0] ?? null);
	const playableCount = $derived(data.chart.tracks.filter((t) => t.ytMusicId).length);

	const formattedDate = $derived(
		new Date(data.chart.lastUpdated).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	);

	// Gradient hue: use playing track if available, else hero track
	const pageHue = $derived(
		player.currentTrack
			? trackToHue(player.currentTrack.artist, player.currentTrack.title)
			: heroTrack
				? trackToHue(heroTrack.artist, heroTrack.title)
				: 140
	);
</script>

<svelte:head>
	<title>{data.chart.countryName} Weekly Chart · Spotifx</title>
	<meta
		name="description"
		content="Top {data.chart.tracks.length} Spotify tracks in {data.chart.countryName} for the week of {data.chart.weekDate}"
	/>
	<meta property="og:title" content="{data.chart.countryName} Weekly Chart · Spotifx" />
	<meta
		property="og:description"
		content="Top {data.chart.tracks.length} Spotify tracks in {data.chart.countryName}"
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<!-- Gradient bleed zone -->
<div class="gradient-zone" style="--page-hue: {pageHue};">
	<div class="gradient-bg"></div>

	<div class="relative z-[1]">
		<!-- Page title -->
		<div class="mb-5 animate-fade-in">
			<h1 class="text-2xl sm:text-3xl font-bold text-white mb-1">
				{data.chart.countryName}
				<span class="text-gray-500 font-normal">Weekly Chart</span>
			</h1>
			<p class="text-sm text-gray-400">
				Week of {data.chart.weekDate} · Updated {formattedDate}
			</p>
		</div>

		<!-- Hero track -->
		{#if heroTrack}
			<HeroTrack track={heroTrack} tracks={data.chart.tracks} />
		{/if}

		<!-- Play controls -->
		{#if playableCount > 0}
			<div class="flex items-center gap-3 mb-1 animate-fade-in" style="animation-delay:100ms">
				<button
					onclick={() => player.playAll(data.chart.tracks)}
					class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-black text-sm font-bold
						   hover:scale-105 hover:bg-[#1ed760] active:scale-95 transition-all cursor-pointer shadow-lg shadow-accent/20"
				>
					<Icon name="play" />
					Play All
				</button>
				<button
					onclick={() => player.playAll(data.chart.tracks, true)}
					class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.07]
						   text-white text-sm font-semibold hover:bg-white/[0.12]
						   active:scale-95 transition-all cursor-pointer"
				>
					<Icon name="shuffle" />
					Shuffle
				</button>
				<span class="text-xs text-gray-500 hidden sm:inline">{data.chart.tracks.length} tracks · {playableCount} playable</span>
			</div>
		{/if}
	</div>
</div>

<!-- Search + Table zone (below gradient) -->
<div class="mt-2">
	<SearchBar bind:value={searchQuery} />
	<ChartTable tracks={data.chart.tracks} {searchQuery} />
</div>

<style>
	.gradient-zone {
		position: relative;
		margin: -1.25rem -1rem 0;
		padding: 1.25rem 1rem 1.5rem;
	}

	@media (min-width: 640px) {
		.gradient-zone {
			margin: -1.25rem -1.25rem 0;
			padding: 1.25rem 1.25rem 1.5rem;
		}
	}

	.gradient-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			hsla(var(--page-hue), 40%, 16%, 0.9) 0%,
			hsla(var(--page-hue), 30%, 12%, 0.5) 45%,
			transparent 100%
		);
		transition: background 0.8s ease;
		pointer-events: none;
	}
</style>