<!-- src/lib/components/PlayButton.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import type { Track } from '$lib/types';

	let { track, allTracks }: { track: Track; allTracks: Track[] } = $props();

	const isActive = $derived(player.isCurrentTrack(track));
	const isThisPlaying = $derived(isActive && player.isPlaying);

	function handleClick(e: Event) {
		e.stopPropagation();
		if (isActive) {
			player.togglePlay();
		} else {
			player.playTrack(track, allTracks);
		}
	}
</script>

{#if track.ytMusicId}
	<button
		onclick={handleClick}
		class="w-7 h-7 flex items-center justify-center rounded-full transition-all cursor-pointer flex-shrink-0
			{isActive
			? 'bg-accent text-black'
			: 'bg-white/10 text-white hover:bg-accent hover:text-black'}"
		title={isThisPlaying ? 'Pause' : `Play ${track.title}`}
		aria-label="{isThisPlaying ? 'Pause' : 'Play'} {track.title}"
	>
		{#if isThisPlaying}
			<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
				<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
			</svg>
		{:else}
			<svg class="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
				<path d="M8 5v14l11-7z" />
			</svg>
		{/if}
	</button>
{/if}