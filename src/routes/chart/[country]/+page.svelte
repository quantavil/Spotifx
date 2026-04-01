<!-- src/routes/chart/[country]/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { player } from '$lib/stores/player.svelte';
	import ChartTable from '$lib/components/ChartTable.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import HeroTrack from '$lib/components/HeroTrack.svelte';
	import ChartStats from '$lib/components/ChartStats.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data }: { data: PageData } = $props();
	let searchQuery = $state('');
	let copied = $state(false);

	const heroTrack = $derived(data.chart.tracks[0] ?? null);
	const playableCount = $derived(data.chart.tracks.filter((t) => t.ytMusicId).length);

	const formattedDate = $derived(
		new Date(data.chart.lastUpdated).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			/* clipboard API blocked — ignore */
		}
	}
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

<div>
	<!-- Header row -->
	<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-white mb-1">
				{data.chart.countryName}
				<span class="text-gray-500 font-normal">Weekly Chart</span>
			</h1>
			<p class="text-sm text-gray-500">
				Week of {data.chart.weekDate} · Updated {formattedDate}
			</p>
		</div>
		<button
			onclick={copyLink}
			class="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
				   bg-surface-alt border border-white/10 text-gray-400 hover:text-white hover:border-white/20
				   transition-colors cursor-pointer"
		>
			{#if copied}
				<Icon name="check" class="w-3.5 h-3.5 text-accent" />
				Copied!
			{:else}
				<Icon name="link" class="w-3.5 h-3.5" />
				Share
			{/if}
		</button>
	</div>

	<!-- Hero #1 track -->
	{#if heroTrack}
		<HeroTrack track={heroTrack} tracks={data.chart.tracks} />
	{/if}

	<!-- Stats grid -->
	{#if data.chart.tracks.length > 0}
		<ChartStats tracks={data.chart.tracks} />
	{/if}

	<!-- Play All / Shuffle -->
	{#if playableCount > 0}
		<div class="flex items-center gap-3 mb-4 animate-fade-in" style="animation-delay:120ms">
			<button
				onclick={() => player.playAll(data.chart.tracks)}
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-black text-sm font-semibold
					   hover:opacity-90 active:scale-95 transition-all cursor-pointer"
			>
				<Icon name="play" />
				Play All
			</button>
			<button
				onclick={() => player.playAll(data.chart.tracks, true)}
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-alt border border-white/10
					   text-gray-300 text-sm hover:text-white hover:border-white/20
					   active:scale-95 transition-all cursor-pointer"
			>
				<Icon name="shuffle" />
				Shuffle
			</button>
			<span class="text-xs text-gray-600">{playableCount} playable</span>
		</div>
	{/if}

	<!-- Search + Table -->
	<SearchBar bind:value={searchQuery} />
	<ChartTable tracks={data.chart.tracks} {searchQuery} />
</div>