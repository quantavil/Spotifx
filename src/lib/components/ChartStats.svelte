<!-- src/lib/components/ChartStats.svelte -->
<script lang="ts">
	import type { Track } from '$lib/types';
	import { formatCompact } from '$lib/utils';

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
	<div class="bg-surface-alt rounded-lg border border-white/10 p-4">
		<p class="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1">
			Total Streams
		</p>
		<p class="text-lg font-bold text-white tabular-nums font-mono">
			{formatCompact(stats.totalStreams)}
		</p>
	</div>

	<div class="bg-surface-alt rounded-lg border border-white/10 p-4">
		<p class="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1">Tracks</p>
		<p class="text-lg font-bold text-white tabular-nums font-mono">{tracks.length}</p>
	</div>

	<div class="bg-surface-alt rounded-lg border border-white/10 p-4">
		<p class="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1">New Entries</p>
		<p class="text-lg font-bold text-rank-new tabular-nums font-mono">{stats.newEntries}</p>
	</div>

	<div class="bg-surface-alt rounded-lg border border-white/10 p-4">
		<p class="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1">
			Biggest Mover
		</p>
		{#if stats.biggestMover}
			<p class="text-sm font-bold text-rank-up truncate" title={stats.biggestMover.title}>
				▲{stats.biggestMove}
				<span class="font-normal text-gray-300">{stats.biggestMover.title}</span>
			</p>
		{:else}
			<p class="text-sm text-gray-600">—</p>
		{/if}
	</div>
</div>