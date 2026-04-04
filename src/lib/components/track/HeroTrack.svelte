<!-- src/lib/components/HeroTrack.svelte -->
<script lang="ts">
	import type { Track } from '$lib/types';
	import { formatCompact, getYTThumbUrl } from '$lib/utils';
	import { player } from '$lib/stores/player.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { scrollText } from '$lib/actions';
	import RankBadge from './RankBadge.svelte';
	import TrackMenu from './TrackMenu.svelte';
	import PlayButton from './PlayButton.svelte';
	import Icon from '../ui/Icon.svelte';

	let { track, tracks }: { track: Track; tracks: Track[] } = $props();

	const heroThumb = $derived(
		track.ytMusicId ? getYTThumbUrl(track.ytMusicId) : ''
	);
	const isActive = $derived(player.isCurrentTrack(track) && player.isPlaying);
	const isFav = $derived(track.spotifyId ? favorites.has(track.spotifyId) : false);

	function handleTitleClick() {
		if (!track.ytMusicId) return;
		player.isCurrentTrack(track) ? player.togglePlay() : player.playTrack(track, tracks);
	}

	function toggleFav() {
		if (!track.spotifyId) return;
		const added = favorites.toggle(track.spotifyId);
		toast.show(added ? 'Added to favorites' : 'Removed from favorites');
	}
</script>

<div
	class="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/15 via-surface-alt to-surface-alt border border-accent/20 p-5 sm:p-6 mb-6 animate-fade-in"
>
	<div
		class="absolute -top-4 -right-2 text-[8rem] font-black text-white/[0.03] leading-none select-none pointer-events-none"
		aria-hidden="true"
	>
		#1
	</div>

	<div class="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-4">
		<div class="flex items-center gap-4 flex-1 min-w-0">
			{#if heroThumb}
				<img
					src={heroThumb}
					alt=""
					class="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover bg-white/5 shadow-lg"
				/>
			{:else}
				<div
					class="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center"
				>
					<span class="text-accent font-black text-xl">#1</span>
				</div>
			{/if}

			<button
				onclick={handleTitleClick}
				class="flex-1 min-w-0 text-left group/hero
					{track.ytMusicId ? 'cursor-pointer' : ''}"
			>
				<div class="flex items-center gap-2 mb-1">
					<span class="text-[10px] font-semibold uppercase tracking-widest text-accent/80">Top Track</span>
					<RankBadge change={track.change} />
					{#if isFav}
						<Icon name="heart-filled" class="w-3 h-3 text-red-400" />
					{/if}
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
				<p class="text-2xl font-bold text-white tabular-nums font-mono">
					{formatCompact(track.streams)}
				</p>
				<p class="text-[11px] text-gray-500">streams this week</p>
			</div>
			<div class="flex items-center gap-2">
				{#if track.spotifyId}
					<button
						onclick={toggleFav}
						class="w-7 h-7 flex items-center justify-center rounded-full transition-all cursor-pointer flex-shrink-0
							   {isFav ? 'bg-red-400/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}"
						title={isFav ? 'Remove from favorites' : 'Add to favorites'}
						aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
					>
						<Icon name={isFav ? 'heart-filled' : 'heart'} class="w-3.5 h-3.5" />
					</button>
				{/if}
				<PlayButton {track} allTracks={tracks} />
				<TrackMenu {track} />
			</div>
		</div>
	</div>
</div>