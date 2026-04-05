<script lang="ts">
	import type { Track } from '$lib/types';
	import { getYTThumbUrl } from '$lib/utils';
	import Icon from './Icon.svelte';

	let {
		track,
		quality = 'default',
		class: className = '',
		iconClass = 'w-5 h-5 text-gray-600',
	}: { 
		track: Track | null;
		quality?: 'default' | 'mqdefault' | 'hqdefault';
		class?: string;
		iconClass?: string;
	} = $props();

	const thumbUrl = $derived(track?.ytMusicId ? getYTThumbUrl(track.ytMusicId, quality) : '');
</script>

{#if thumbUrl}
	<img src={thumbUrl} alt="" class={className} loading="lazy" />
{:else}
	<div class="flex items-center justify-center bg-white/5 {className}">
		<Icon name="music" class={iconClass} />
	</div>
{/if}
