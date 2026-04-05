<script lang="ts">
	import type { Track } from '$lib/types';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import Icon from './Icon.svelte';

	let { 
		track, 
		class: className = '',
		iconClass = 'w-3.5 h-3.5',
		showText = false,
		onToggled
	}: { 
		track: Track;
		class?: string;
		iconClass?: string;
		showText?: boolean;
		onToggled?: () => void;
	} = $props();

	const isFav = $derived(track.spotifyId ? favorites.has(track.spotifyId) : false);

	function toggleFav(e: Event) {
		e.stopPropagation();
		if (!track.spotifyId) return;
		const added = favorites.toggle(track.spotifyId);
		toast.show(added ? 'Added to favorites' : 'Removed from favorites');
		if (onToggled) onToggled();
	}
</script>

{#if track.spotifyId}
	<button
		onclick={toggleFav}
		class="{className} {isFav && !showText ? 'text-red-400' : ''}"
		title={isFav ? 'Remove from favorites' : 'Add to favorites'}
		aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
	>
		<Icon name={isFav ? 'heart-filled' : 'heart'} class="{iconClass} {isFav && showText ? 'text-red-400' : ''}" />
		{#if showText}
			{isFav ? 'Remove Favorite' : 'Add to Favorites'}
		{/if}
	</button>
{/if}
