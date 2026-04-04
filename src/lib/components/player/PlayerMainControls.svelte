<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { formatTime } from '$lib/utils';
	import Icon from '../ui/Icon.svelte';
</script>

<div class="flex items-center justify-center gap-1 sm:gap-1.5 flex-col sm:flex-row">
	<div class="flex items-center justify-center gap-1 sm:gap-2">
		<button
			onclick={() => player.toggleShuffle()}
			class="hidden sm:block p-1.5 transition-colors cursor-pointer
				   {player.shuffled ? 'text-accent' : 'text-gray-500 hover:text-white'}"
			title="Shuffle (S)"
			aria-label="Toggle shuffle"
		>
			<Icon name="shuffle" class="w-4 h-4" />
		</button>

		<button
			onclick={() => player.prev()}
			class="p-1.5 sm:p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
			title="Previous"
			aria-label="Previous track"
		>
			<Icon name="skip-back" class="w-5 h-5" />
		</button>

		<button
			onclick={() => player.togglePlay()}
			class="p-2.5 bg-white rounded-full text-black hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg"
			title={player.isPlaying ? 'Pause' : 'Play'}
			aria-label={player.isPlaying ? 'Pause' : 'Play'}
		>
			{#if player.buffering}
				<svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
					<path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
				</svg>
			{:else}
				<Icon name={player.isPlaying ? 'pause' : 'play'} class="w-5 h-5" />
			{/if}
		</button>

		<button
			onclick={() => player.next()}
			class="p-1.5 sm:p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
			title="Next"
			aria-label="Next track"
		>
			<Icon name="skip-forward" class="w-5 h-5" />
		</button>

		<button
			onclick={() => player.cycleRepeat()}
			class="hidden sm:block p-1.5 transition-colors cursor-pointer
				   {player.repeat !== 'off' ? 'text-accent' : 'text-gray-500 hover:text-white'}"
			title="Repeat (R)"
			aria-label="Cycle repeat"
		>
			<Icon name={player.repeat === 'one' ? 'repeat-one' : 'repeat'} class="w-4 h-4" />
		</button>
	</div>

	<!-- Time display below controls on desktop -->
	<div class="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-500 font-mono tabular-nums">
		<span>{formatTime(player.currentTime)}</span>
		<span class="text-gray-600">/</span>
		<span>{formatTime(player.duration)}</span>
	</div>
</div>
