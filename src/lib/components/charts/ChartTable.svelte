<!-- src/lib/components/ChartTable.svelte -->
<script lang="ts">
	import type { Track } from '$lib/types';
	import { formatCompact, highlightText } from '$lib/utils';
	import { player } from '$lib/stores/player.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { scrollText } from '$lib/actions';
	import RankBadge from '../track/RankBadge.svelte';
	import TrackArt from '../track/TrackArt.svelte';
	import TrackMenu from '../track/TrackMenu.svelte';
	import Icon from '../ui/Icon.svelte';

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

	function changeToSortWeight(c: string) {
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
			const av = sortKey === 'change' ? changeToSortWeight(a.change) : (a[sortKey] as number);
			const bv = sortKey === 'change' ? changeToSortWeight(b.change) : (b[sortKey] as number);
			return dir * (av - bv);
		});
	});

	const query = $derived(searchQuery.trim());

	function playTrack(e: Event, track: Track) {
		if (!track.ytMusicId) return;
		e.stopPropagation();
		player.isCurrentTrack(track) ? player.togglePlay() : player.playTrack(track, tracks);
	}
</script>

<div
	class="overflow-hidden animate-fade-in"
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
				onclick={() => { sortKey = 'rank'; sortAsc = true; }}
				class="text-[11px] text-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
			>
				Reset sort
			</button>
		{/if}
	</div>

	<div class="overflow-x-auto">
		<table class="w-full text-sm table-fixed">
			<thead>
				<tr class="border-b border-white/[0.06] text-gray-500 text-[11px] uppercase tracking-wider">
					<th class="text-left px-2 sm:px-3 py-3 w-9 sm:w-12">
						<button onclick={() => toggleSort('rank')} class="hover:text-white transition-colors cursor-pointer">
							#{sortIndicator('rank')}
						</button>
					</th>
					<th class="text-center px-0.5 sm:px-1 py-3 w-6 sm:w-10">
						<button onclick={() => toggleSort('change')} class="hover:text-white transition-colors cursor-pointer">
							Δ{sortIndicator('change')}
						</button>
					</th>
					<th class="text-left px-2 py-3">Track</th>
					<th class="text-center px-1 sm:px-2 py-3 w-14 sm:w-20">
						<button onclick={() => toggleSort('streams')} class="inline-block hover:text-white transition-colors cursor-pointer">
							Streams{sortIndicator('streams')}
						</button>
					</th>
					<th class="text-center px-1 sm:px-2 py-3 w-10 sm:w-16 hidden md:table-cell">
						<button onclick={() => toggleSort('peak')} class="inline-block hover:text-white transition-colors cursor-pointer">
							Peak{sortIndicator('peak')}
						</button>
					</th>
					<th class="text-center px-1 sm:px-2 py-3 w-10 sm:w-16 hidden md:table-cell">
						<button onclick={() => toggleSort('weeks')} class="inline-block hover:text-white transition-colors cursor-pointer">
							Days{sortIndicator('weeks')}
						</button>
					</th>
					<th class="py-3 px-1.5 sm:px-2 w-14 sm:w-20">
						<span class="sr-only">Actions</span>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each processed as track (track.spotifyId || `r${track.rank}-${track.title}`)}
					{@const isActive = player.isCurrentTrack(track) && player.isPlaying}
					{@const isCurrentTrack = player.isCurrentTrack(track)}
					{@const trackFav = track.spotifyId ? favorites.has(track.spotifyId) : false}
					<tr
						class="group border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors
							{isActive ? '!bg-accent/10 border-accent/20' : ''}"
					>
						<!-- Rank / Equalizer -->
						<td class="px-2 sm:px-3 py-2.5 align-middle">
							{#if isCurrentTrack}
								<div class="flex items-end gap-[2px] h-4 justify-center">
									{#each [0, 1, 2] as bar}
										<div
											class="eq-bar {isActive ? 'is-playing' : ''}"
											style={isActive
												? `animation-delay:${bar * 0.2}s`
												: `height:${bar === 1 ? '8px' : '4px'}`}
										></div>
									{/each}
								</div>
							{:else}
								<span class="text-gray-500 font-mono text-xs tabular-nums">{track.rank}</span>
							{/if}
						</td>

						<td class="px-0.5 sm:px-1 py-2.5 align-middle text-center">
							<RankBadge change={track.change} />
						</td>

						<td class="px-2 py-2.5 overflow-hidden">
							<div class="flex items-center gap-2.5">
								<TrackArt {track} allTracks={tracks} />

								<button
									onclick={(e) => playTrack(e, track)}
									class="flex-1 min-w-0 text-left group/title
										{track.ytMusicId ? 'cursor-pointer' : ''}"
								>
									<div class="flex items-center gap-1.5">
										<div
											class="scroll-text flex-1 min-w-0 {isActive ? 'is-active' : ''}"
											use:scrollText
										>
											<span class="text-sm font-medium text-white transition-colors
												{track.ytMusicId ? 'group-hover/title:text-accent' : ''}">
												{#each highlightText(track.title, query) as part}
													{#if part.match}<mark class="bg-accent/25 text-white rounded-sm px-0.5">{part.text}</mark>{:else}{part.text}{/if}
												{/each}
											</span>
										</div>
										{#if trackFav}
											<Icon name="heart-filled" class="w-3 h-3 text-red-400 flex-shrink-0" />
										{/if}
									</div>
									<p class="text-xs text-gray-400 truncate mt-0.5">
										{#each highlightText(track.artist, query) as part}
											{#if part.match}<mark class="bg-accent/25 text-white rounded-sm px-0.5">{part.text}</mark>{:else}{part.text}{/if}
										{/each}
									</p>
								</button>
							</div>
						</td>

						<td class="px-1 sm:px-2 py-2.5 text-center font-mono text-xs tabular-nums text-gray-300 align-middle">
							{formatCompact(track.streams)}
						</td>

						<td class="px-1 sm:px-2 py-2.5 text-center font-mono text-xs tabular-nums text-gray-500 hidden md:table-cell align-middle">
							{track.peak}
						</td>

						<td class="px-1 sm:px-2 py-2.5 text-center font-mono text-xs tabular-nums text-gray-500 hidden md:table-cell align-middle">
							{track.weeks}
						</td>

						<td class="px-1.5 sm:px-2 py-2.5 align-middle">
							<div class="flex items-center justify-end gap-1">
								<TrackMenu {track} />
							</div>
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