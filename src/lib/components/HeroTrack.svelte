<!-- src/lib/components/HeroTrack.svelte -->
<script lang="ts">
	import type { Track } from '$lib/types';
	import { formatCompact } from '$lib/utils';
	import ListenLinks from './ListenLinks.svelte';
	import RankBadge from './RankBadge.svelte';

	let { track }: { track: Track } = $props();
</script>

<div
	class="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/15 via-surface-alt to-surface-alt border border-accent/20 p-5 sm:p-6 mb-6 animate-fade-in"
>
	<!-- Watermark -->
	<div
		class="absolute -top-4 -right-2 text-[8rem] font-black text-white/[0.03] leading-none select-none pointer-events-none"
		aria-hidden="true"
	>
		#1
	</div>

	<div class="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-4">
		<div class="flex items-center gap-4 flex-1 min-w-0">
			<!-- Rank badge -->
			<div
				class="flex-shrink-0 w-14 h-14 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center"
			>
				<span class="text-accent font-black text-xl">#1</span>
			</div>

			<!-- Track info -->
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-1">
					<span class="text-[10px] font-semibold uppercase tracking-widest text-accent/80"
						>Top Track</span
					>
					<RankBadge change={track.change} />
				</div>
				<h2 class="text-xl sm:text-2xl font-bold text-white truncate">{track.title}</h2>
				<p class="text-sm text-gray-400 truncate">{track.artist}</p>
			</div>
		</div>

		<!-- Streams + links -->
		<div class="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
			<div class="text-left sm:text-right">
				<p class="text-2xl font-bold text-white tabular-nums font-mono">
					{formatCompact(track.streams)}
				</p>
				<p class="text-[11px] text-gray-500">streams this week</p>
			</div>
			<ListenLinks
				spotifyId={track.spotifyId}
				ytMusicId={track.ytMusicId}
				title={track.title}
				artist={track.artist}
			/>
		</div>
	</div>
</div>