<!-- src/lib/components/ChartStats.svelte -->
<script lang="ts">
	import type { Track } from '$lib/types';
	import { formatCompact } from '$lib/utils';
	import StatCard from './StatCard.svelte';

	let { tracks }: { tracks: Track[] } = $props();

	const stats = $derived.by(() => {
		const totalStreams = tracks.reduce((sum, t) => sum + t.streams, 0);
		const newEntries = tracks.filter((t) => t.change === 'NEW' || t.change === 'RE').length;

		let biggestMover: Track | null = null;
		let biggestMove = 0;
		for (const t of tracks) {
			const num = parseInt(t.change);
			if (!isNaN(num) && num > biggestMove) {
				biggestMove = num;
				biggestMover = t;
			}
		}

		return { totalStreams, newEntries, biggestMover, biggestMove };
	});
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-fade-in" style="animation-delay:80ms">
	<StatCard label="Total Streams">
		<p class="text-lg font-bold text-white tabular-nums font-mono">
			{formatCompact(stats.totalStreams)}
		</p>
	</StatCard>

	<StatCard label="Tracks">
		<p class="text-lg font-bold text-white tabular-nums font-mono">{tracks.length}</p>
	</StatCard>

	<StatCard label="New Entries">
		<p class="text-lg font-bold text-rank-new tabular-nums font-mono">{stats.newEntries}</p>
	</StatCard>

	<StatCard label="Biggest Mover">
		{#if stats.biggestMover}
			<p class="text-sm font-bold text-rank-up truncate" title={stats.biggestMover.title}>
				▲{stats.biggestMove}
				<span class="font-normal text-gray-300">{stats.biggestMover.title}</span>
			</p>
		{:else}
			<p class="text-sm text-gray-600">—</p>
		{/if}
	</StatCard>
</div>