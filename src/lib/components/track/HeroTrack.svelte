<!-- src/lib/components/track/HeroTrack.svelte -->
<script lang="ts">
	import type { Track } from '$lib/types';
	import { formatCompact } from '$lib/utils';
	import { player } from '$lib/stores/player.svelte';
	import { scrollText } from '$lib/actions';
	import RankBadge from './RankBadge.svelte';
	import TrackMenu from './TrackMenu.svelte';
	import PlayButton from './PlayButton.svelte';
	import TrackThumbnail from '../ui/TrackThumbnail.svelte';
	import FavoriteButton from '../ui/FavoriteButton.svelte';

	let { track, tracks }: { track: Track; tracks: Track[] } = $props();

	const isActive = $derived(player.isCurrentTrack(track) && player.isPlaying);

	function handleTitleClick() {
		if (!track.ytMusicId) return;
		player.playOrToggle(track, tracks);
	}
</script>

<div class="mb-5 animate-fade-in" style="animation-delay:40ms">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div class="flex items-center gap-4 flex-1 min-w-0">
			<TrackThumbnail 
				{track} 
				quality="default"
				class="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shadow-2xl shadow-black/50"
				iconClass="w-8 h-8 text-gray-600"
			/>

			<button
				onclick={handleTitleClick}
				class="flex-1 min-w-0 text-left group/hero
					{track.ytMusicId ? 'cursor-pointer' : ''}"
			>
				<div class="flex items-center gap-2 mb-1">
					<span class="text-[10px] font-semibold uppercase tracking-widest text-accent/80">Top Track</span>
					<RankBadge change={track.change} />
				</div>
				<div class="scroll-text {isActive ? 'is-active' : ''}" use:scrollText>
					<span class="text-xl sm:text-2xl font-bold text-white transition-colors
						{track.ytMusicId ? 'group-hover/hero:text-accent' : ''}">{track.title}</span>
				</div>
				<p class="text-sm text-gray-400 truncate mt-0.5">{track.artist}</p>
			</button>
		</div>

		<div class="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
			<div class="text-left sm:text-right">
				<p class="text-2xl sm:text-3xl font-bold text-white tabular-nums font-mono">
					{formatCompact(track.streams)}
				</p>
				<p class="text-[11px] text-gray-500">streams this week</p>
			</div>
			<div class="flex items-center gap-2">
				<FavoriteButton 
					{track} 
					class="w-8 h-8 flex items-center justify-center rounded-full transition-all flex-shrink-0 bg-white/10 text-white hover:bg-white/20 hover:text-red-400"
					iconClass="w-3.5 h-3.5"
				/>
				<PlayButton {track} allTracks={tracks} />
				<TrackMenu {track} />
			</div>
		</div>
	</div>
</div>