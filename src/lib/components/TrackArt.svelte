<!-- src/lib/components/TrackArt.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import type { Track } from '$lib/types';
	import Icon from './Icon.svelte';

	let { track, allTracks, size = 'sm' }: {
		track: Track;
		allTracks: Track[];
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	const isActive = $derived(player.isCurrentTrack(track));
	const isThisPlaying = $derived(isActive && player.isPlaying);
	const thumbUrl = $derived(
		track.ytMusicId ? `https://i.ytimg.com/vi/${track.ytMusicId}/default.jpg` : ''
	);
	const sizeClass = $derived(
		size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-12 h-12' : 'w-10 h-10'
	);
	const iconClass = $derived(
		size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
	);

	function handleClick(e: Event) {
		e.stopPropagation();
		if (!track.ytMusicId) return;
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
		class="relative flex-shrink-0 {sizeClass} rounded overflow-hidden group/art cursor-pointer"
		title="{isThisPlaying ? 'Pause' : 'Play'} {track.title}"
		aria-label="{isThisPlaying ? 'Pause' : 'Play'} {track.title}"
	>
		<img src={thumbUrl} alt="" class="w-full h-full object-cover bg-white/5" loading="lazy" />
		<div
			class="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity
				{isActive ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100'}"
		>
			<Icon name={isThisPlaying ? 'pause' : 'play'} class="{iconClass} text-white" />
		</div>
		{#if isActive}
			<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
		{/if}
	</button>
{:else}
	<div class="flex-shrink-0 {sizeClass} rounded bg-white/5 flex items-center justify-center">
		<Icon name="music" class="w-4 h-4 text-gray-600" />
	</div>
{/if}