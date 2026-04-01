<!-- src/routes/chart/[country]/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import ChartTable from '$lib/components/ChartTable.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import HeroTrack from '$lib/components/HeroTrack.svelte';
	import ChartStats from '$lib/components/ChartStats.svelte';

	let { data }: { data: PageData } = $props();
	let searchQuery = $state('');
	let copied = $state(false);

	const heroTrack = $derived(data.chart.tracks[0] ?? null);

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
				<svg class="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path d="M5 13l4 4L19 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
				Copied!
			{:else}
				<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				Share
			{/if}
		</button>
	</div>

	<!-- Hero #1 track -->
	{#if heroTrack}
		<HeroTrack track={heroTrack} />
	{/if}

	<!-- Stats grid -->
	{#if data.chart.tracks.length > 0}
		<ChartStats tracks={data.chart.tracks} />
	{/if}

	<!-- Search + Table -->
	<SearchBar bind:value={searchQuery} />
	<ChartTable tracks={data.chart.tracks} {searchQuery} />
</div>