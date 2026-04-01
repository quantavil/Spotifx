<!-- src/lib/components/ChartTable.svelte -->
<script lang="ts">
	import type { Track } from '$lib/types';
	import { formatCompact, highlightText } from '$lib/utils';
	import RankBadge from './RankBadge.svelte';
	import ListenLinks from './ListenLinks.svelte';

	let { tracks, searchQuery }: { tracks: Track[]; searchQuery: string } = $props();

	type SortKey = 'rank' | 'change' | 'streams' | 'peak' | 'weeks';
	let sortKey: SortKey = $state('rank');
	let sortAsc = $state(true);

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = key === 'rank' || key === 'peak';
		}
	}

	function sortIndicator(key: SortKey): string {
		if (sortKey !== key) return '';
		return sortAsc ? ' ↑' : ' ↓';
	}

	function parseChange(c: string) {
		c = c.trim();
		if (c === 'NEW') return 10000;
		if (c === 'RE') return 9999;
		if (c === '0' || c === '' || c === '--') return 0;
		const num = parseInt(c);
		return isNaN(num) ? 0 : num;
	}

	const processed = $derived.by(() => {
		const q = searchQuery.toLowerCase().trim();
		let list = tracks;

		if (q) {
			list = list.filter(
				(t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
			);
		}

		const dir = sortAsc ? 1 : -1;
		return [...list].sort((a, b) => {
			const av = sortKey === 'change' ? parseChange(a.change) : (a[sortKey] as number);
			const bv = sortKey === 'change' ? parseChange(b.change) : (b[sortKey] as number);
			return dir * (av - bv);
		});
	});

	const query = $derived(searchQuery.trim());
</script>

<div
	class="bg-surface-alt rounded-lg border border-white/10 overflow-hidden animate-fade-in"
	style="animation-delay:160ms"
>
	<div class="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
		<span class="text-xs text-gray-500">
			{processed.length}
			{processed.length !== tracks.length ? `of ${tracks.length}` : ''}
			tracks
		</span>
		{#if sortKey !== 'rank' || !sortAsc}
			<button
				onclick={() => {
					sortKey = 'rank';
					sortAsc = true;
				}}
				class="text-[11px] text-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
			>
				Reset sort
			</button>
		{/if}
	</div>

	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-white/10 text-gray-400 text-[11px] uppercase tracking-wider">
					<th class="text-left px-4 py-3 w-12">
						<button
							onclick={() => toggleSort('rank')}
							class="hover:text-white transition-colors cursor-pointer"
						>
							#{sortIndicator('rank')}
						</button>
					</th>
					<th class="text-left px-2 py-3 w-12">
						<button
							onclick={() => toggleSort('change')}
							class="hover:text-white transition-colors cursor-pointer"
						>
							Δ{sortIndicator('change')}
						</button>
					</th>
					<th class="text-left px-2 py-3">Title · Artist</th>
					<th class="text-right px-2 py-3">
						<button
							onclick={() => toggleSort('streams')}
							class="inline-block hover:text-white transition-colors cursor-pointer"
						>
							Streams{sortIndicator('streams')}
						</button>
					</th>
					<th class="text-right px-2 py-3 hidden md:table-cell">
						<button
							onclick={() => toggleSort('peak')}
							class="inline-block hover:text-white transition-colors cursor-pointer"
						>
							Peak{sortIndicator('peak')}
						</button>
					</th>
					<th class="text-right px-2 py-3 hidden md:table-cell">
						<button
							onclick={() => toggleSort('weeks')}
							class="inline-block hover:text-white transition-colors cursor-pointer"
						>
							Days{sortIndicator('weeks')}
						</button>
					</th>
					<th class="px-4 py-3 w-20 text-right">Listen</th>
				</tr>
			</thead>
			<tbody>
				{#each processed as track (track.spotifyId || `r${track.rank}-${track.title}`)}
					<tr
						class="border-b border-white/5 hover:bg-surface-hover transition-colors even:bg-white/[0.015]"
					>
						<td class="px-4 py-3 text-gray-500 font-mono text-xs tabular-nums">
							{track.rank}
						</td>

						<td class="px-2 py-3">
							<RankBadge change={track.change} />
						</td>

						<td class="px-2 py-3 max-w-xs">
							<div class="truncate">
								<span class="font-medium text-white">
									{#each highlightText(track.title, query) as part}
										{#if part.match}
											<mark class="bg-accent/25 text-white rounded-sm px-0.5"
												>{part.text}</mark
											>
										{:else}{part.text}{/if}
									{/each}
								</span>
								<span class="text-gray-600 mx-1">·</span>
								<span class="text-xs text-gray-400">
									{#each highlightText(track.artist, query) as part}
										{#if part.match}
											<mark class="bg-accent/25 text-white rounded-sm px-0.5"
												>{part.text}</mark
											>
										{:else}{part.text}{/if}
									{/each}
								</span>
							</div>
						</td>

						<td class="px-2 py-3 text-right font-mono text-xs tabular-nums text-gray-300">
							{formatCompact(track.streams)}
						</td>

						<td
							class="px-2 py-3 text-right font-mono text-xs tabular-nums text-gray-500 hidden md:table-cell"
						>
							{track.peak}
						</td>

						<td
							class="px-2 py-3 text-right font-mono text-xs tabular-nums text-gray-500 hidden md:table-cell"
						>
							{track.weeks}
						</td>

						<td class="px-4 py-3 text-right">
							<ListenLinks
								spotifyId={track.spotifyId}
								ytMusicId={track.ytMusicId}
								title={track.title}
								artist={track.artist}
							/>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="px-4 py-16 text-center">
							<div class="text-gray-600">
								{#if searchQuery}
									<p class="text-lg mb-1">No matches</p>
									<p class="text-sm">Try a different search term</p>
								{:else}
									<p class="text-lg mb-1">No chart data</p>
									<p class="text-sm">Check back later</p>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>