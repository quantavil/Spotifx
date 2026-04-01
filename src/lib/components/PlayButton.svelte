<!-- src/lib/components/PlayButton.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import type { Track } from '$lib/types';
	import Icon from './Icon.svelte';

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
			<Icon name="pause" class="w-3 h-3" />
		{:else}
			<Icon name="play" class="w-3 h-3 ml-0.5" />
		{/if}
	</button>
{/if}