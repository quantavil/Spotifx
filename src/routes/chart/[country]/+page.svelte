<!-- src/routes/chart/[country]/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { player } from '$lib/stores/player.svelte';
	import { trackToHue, formatCompact } from '$lib/utils';
	import ChartTable from '$lib/components/charts/ChartTable.svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import TrackThumbnail from '$lib/components/ui/TrackThumbnail.svelte';
	import FavoriteButton from '$lib/components/ui/FavoriteButton.svelte';
	import TrackMenu from '$lib/components/track/TrackMenu.svelte';

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

	$effect(() => {
		if (heroTrack) {
			player.contextHue = trackToHue(heroTrack.artist, heroTrack.title);
		}
		return () => {
			player.contextHue = null;
		};
	});
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
<div class="gradient-zone" style="--page-hue: {player.hue};">
	<div class="gradient-bg"></div>

	<div class="relative z-[1] flex items-center gap-4 sm:gap-6 text-left animate-fade-in">
		<!-- Cover Artwork -->
		{#if heroTrack}
			<div class="flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-xl overflow-hidden shadow-2xl shadow-black/60 relative group bg-white/5">
				<TrackThumbnail 
					track={heroTrack} 
					quality="hqdefault"
					loading="eager"
					class="w-full h-full object-cover"
				/>
				<div class="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
			</div>
		{/if}

		<!-- Details & Controls -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
				<span>Weekly Chart</span>
				{#if heroTrack}
					<span class="text-white/20">·</span>
					<span class="text-accent">#1 Today</span>
				{/if}
			</div>

			<h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-1.5 sm:mb-2">
				{data.chart.countryName}
			</h1>

			{#if heroTrack}
				<p class="text-xs sm:text-sm text-gray-300 mb-3 truncate">
					<span class="text-accent font-medium">Top Track:</span> 
					<span class="text-white font-bold">{heroTrack.title}</span> 
					<span class="text-gray-400">by {heroTrack.artist}</span>
					<span class="text-gray-500 font-mono hidden sm:inline">({formatCompact(heroTrack.streams)} streams)</span>
				</p>
			{/if}

			<!-- Play Actions -->
			{#if playableCount > 0}
				<div class="flex items-center gap-1.5 sm:gap-2.5">
					<button
						onclick={() => player.playAll(data.chart.tracks)}
						class="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent text-black text-[11px] sm:text-xs font-bold
							   hover:scale-105 hover:bg-[#1ed760] active:scale-95 transition-all cursor-pointer shadow-lg shadow-accent/20"
					>
						<Icon name="play" class="w-3.5 h-3.5" />
						Play
					</button>
					<button
						onclick={() => player.playAll(data.chart.tracks, true)}
						class="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/[0.07]
							   text-white text-[11px] sm:text-xs font-semibold hover:bg-white/[0.12]
							   active:scale-95 transition-all cursor-pointer"
					>
						<Icon name="shuffle" class="w-3.5 h-3.5" />
						Shuffle
					</button>

					{#if heroTrack}
						<div class="flex items-center gap-0.5 border-l border-white/10 pl-1.5 sm:pl-2 ml-0.5 sm:ml-1">
							<FavoriteButton 
								track={heroTrack} 
								class="p-1.5 sm:p-2 transition-colors cursor-pointer text-gray-400 hover:text-red-400 rounded-full hover:bg-white/5"
								iconClass="w-3.5 h-3.5 sm:w-4 sm:h-4"
							/>
							<TrackMenu track={heroTrack} />
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Search + Table zone (below gradient) -->
<div class="mt-4">
	<div class="flex items-center justify-between mb-3 text-[11px] sm:text-xs text-gray-500 font-medium">
		<span>Week of {data.chart.weekDate} · Updated {formattedDate}</span>
	</div>
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
