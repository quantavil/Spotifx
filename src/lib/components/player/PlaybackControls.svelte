<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { formatTime } from '$lib/utils';
	import Icon from '../ui/Icon.svelte';

	let { 
		size = 'sm', 
		showTime = false,
		class: className = '' 
	}: { 
		size?: 'sm' | 'lg'; 
		showTime?: boolean;
		class?: string;
	} = $props();

	const isLarge = $derived(size === 'lg');
</script>

<div class="flex items-center justify-center {isLarge ? 'gap-5 sm:gap-7' : 'gap-1 sm:gap-2'} {className}">
	<button
		onclick={() => player.toggleShuffle()}
		class="p-2 transition-colors cursor-pointer {player.shuffled ? 'text-accent' : 'text-gray-500 hover:text-white'} {!isLarge ? 'hidden sm:block p-1.5' : ''}"
		title="Shuffle (S)"
		aria-label="Toggle shuffle"
	>
		<Icon name="shuffle" class={isLarge ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4'} />
	</button>

	<button
		onclick={() => player.prev()}
		class="text-gray-300 hover:text-white transition-colors cursor-pointer {isLarge ? 'p-2' : 'p-1.5 sm:p-2'}"
		title="Previous"
		aria-label="Previous track"
	>
		<Icon name="skip-back" class={isLarge ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-5 h-5'} />
	</button>

	<button
		onclick={() => player.togglePlay()}
		class="bg-white rounded-full text-black hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg {isLarge ? 'p-4 sm:p-5' : 'p-2.5'}"
		title={player.isPlaying ? 'Pause' : 'Play'}
		aria-label={player.isPlaying ? 'Pause' : 'Play'}
	>
		{#if player.buffering}
			<svg class="{isLarge ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-5 h-5'} animate-spin" viewBox="0 0 24 24" fill="none">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
				<path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
			</svg>
		{:else}
			<Icon name={player.isPlaying ? 'pause' : 'play'} class={isLarge ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-5 h-5'} />
		{/if}
	</button>

	<button
		onclick={() => player.next()}
		class="text-gray-300 hover:text-white transition-colors cursor-pointer {isLarge ? 'p-2' : 'p-1.5 sm:p-2'}"
		title="Next"
		aria-label="Next track"
	>
		<Icon name="skip-forward" class={isLarge ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-5 h-5'} />
	</button>

	<button
		onclick={() => player.cycleRepeat()}
		class="p-2 transition-colors cursor-pointer {player.repeat !== 'off' ? 'text-accent' : 'text-gray-500 hover:text-white'} {!isLarge ? 'hidden sm:block p-1.5' : ''}"
		title="Repeat (R)"
		aria-label="Cycle repeat"
	>
		<Icon name={player.repeat === 'one' ? 'repeat-one' : 'repeat'} class={isLarge ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4'} />
	</button>
</div>

{#if showTime}
	<div class="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-500 font-mono tabular-nums mt-1 sm:mt-0">
		<span>{formatTime(player.currentTime)}</span>
		<span class="text-gray-600">/</span>
		<span>{formatTime(player.duration)}</span>
	</div>
{/if}
