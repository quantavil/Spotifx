<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import Icon from '../ui/Icon.svelte';

	const isFav = $derived(
		player.currentTrack?.spotifyId
			? favorites.has(player.currentTrack.spotifyId)
			: false
	);

	function toggleFav() {
		if (!player.currentTrack?.spotifyId) return;
		const added = favorites.toggle(player.currentTrack.spotifyId);
		toast.show(added ? 'Added to favorites' : 'Removed from favorites');
	}
</script>

<div class="flex items-center justify-end gap-1 sm:gap-1.5">
	<!-- Desktop controls -->
	<div class="hidden sm:flex items-center gap-1">
		{#if player.currentTrack?.spotifyId}
			<button
				onclick={toggleFav}
				class="p-1.5 transition-colors cursor-pointer {isFav ? 'text-red-400' : 'text-gray-500 hover:text-white'}"
				title={isFav ? 'Remove from favorites' : 'Add to favorites'}
				aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
			>
				<Icon name={isFav ? 'heart-filled' : 'heart'} class="w-4 h-4" />
			</button>
		{/if}

		<button
			onclick={() => player.toggleFullScreen()}
			class="p-1.5 text-gray-500 hover:text-white transition-colors cursor-pointer"
			title="Expand player (F)"
			aria-label="Fullscreen player"
		>
			<Icon name="fullscreen" class="w-4 h-4" />
		</button>

		<button
			onclick={() => player.toggleQueue()}
			class="p-1.5 transition-colors cursor-pointer {player.queueOpen ? 'text-accent' : 'text-gray-500 hover:text-white'}"
			title="Queue (Q)"
			aria-label="Toggle queue"
		>
			<Icon name="queue" class="w-4 h-4" />
		</button>

		<div class="flex items-center gap-1 pl-2 ml-1 border-l border-white/[0.06]">
			<button
				onclick={() => player.setVolume(player.volume > 0 ? 0 : 80)}
				class="text-gray-500 hover:text-white transition-colors cursor-pointer p-1"
				aria-label={player.volume > 0 ? 'Mute' : 'Unmute'}
			>
				<Icon name={player.volume === 0 ? 'volume-mute' : player.volume < 50 ? 'volume-low' : 'volume-high'} class="w-4 h-4" />
			</button>
			<input
				type="range"
				min="0"
				max="100"
				value={player.volume}
				oninput={(e) => player.setVolume(parseInt(e.currentTarget.value))}
				class="w-[88px] vol-slider"
				style="--vol-pct: {player.volume}%"
				aria-label="Volume"
			/>
		</div>
	</div>

	<!-- Mobile controls -->
	<div class="flex sm:hidden items-center gap-0.5">
		{#if player.currentTrack?.spotifyId}
			<button
				onclick={toggleFav}
				class="p-1.5 transition-colors cursor-pointer {isFav ? 'text-red-400' : 'text-gray-600'}"
				aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
			>
				<Icon name={isFav ? 'heart-filled' : 'heart'} class="w-4 h-4" />
			</button>
		{/if}

		<button
			onclick={() => player.toggleQueue()}
			class="p-1.5 transition-colors cursor-pointer {player.queueOpen ? 'text-accent' : 'text-gray-600 hover:text-white'}"
			aria-label="Toggle queue"
		>
			<Icon name="queue" class="w-4 h-4" />
		</button>
	</div>
</div>
