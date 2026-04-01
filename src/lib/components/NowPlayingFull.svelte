<!-- src/lib/components/NowPlayingFull.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatTime, formatCompact, getYTThumbUrl, trackToHue } from '$lib/utils';
	import { fly } from 'svelte/transition';
	import { scrollText } from '$lib/actions';
	import Icon from './Icon.svelte';

	let seeking = $state(false);
	let seekBarEl: HTMLDivElement | undefined = $state();

	const track = $derived(player.currentTrack);
	const hue = $derived(track ? trackToHue(track.artist, track.title) : 140);
	const thumbUrl = $derived(track?.ytMusicId ? getYTThumbUrl(track.ytMusicId, 'hqdefault') : '');
	const isFav = $derived(track?.spotifyId ? favorites.has(track.spotifyId) : false);

	function seekFromPointer(e: PointerEvent) {
		if (!seekBarEl) return;
		const rect = seekBarEl.getBoundingClientRect();
		const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		player.currentTime = frac * player.duration;
	}

	function onPointerDown(e: PointerEvent) {
		seeking = true;
		seekBarEl?.setPointerCapture(e.pointerId);
		seekFromPointer(e);
	}

	function onPointerMove(e: PointerEvent) {
		if (seeking) seekFromPointer(e);
	}

	function onPointerUp(e: PointerEvent) {
		if (!seeking) return;
		seeking = false;
		seekFromPointer(e);
		if (player.duration > 0) player._onSeek?.(player.currentTime);
	}

	function toggleFav() {
		if (!track?.spotifyId) return;
		const added = favorites.toggle(track.spotifyId);
		toast.show(added ? 'Added to favorites' : 'Removed from favorites');
	}

	function openQueue() {
		player.fullScreenOpen = false;
		player.queueOpen = true;
	}
</script>

{#if player.fullScreenOpen && track}
	<div
		class="fixed inset-0 z-[55] flex flex-col overflow-hidden"
		style="background: linear-gradient(180deg, hsl({hue} 40% 12%) 0%, hsl({hue} 20% 6%) 100%);"
		transition:fly={{ y: 600, duration: 300 }}
	>
		<!-- Top bar -->
		<div class="flex items-center justify-between px-4 py-3 flex-shrink-0">
			<button
				onclick={() => player.toggleFullScreen()}
				class="text-gray-400 hover:text-white transition-colors cursor-pointer p-2"
				aria-label="Close full screen"
			>
				<Icon name="chevron-down" class="w-6 h-6" />
			</button>
			<span class="text-xs text-gray-500 uppercase tracking-widest font-medium">Now Playing</span>
			<button
				onclick={openQueue}
				class="text-gray-400 hover:text-white transition-colors cursor-pointer p-2"
				aria-label="Open queue"
			>
				<Icon name="queue" class="w-5 h-5" />
			</button>
		</div>

		<!-- Artwork -->
		<div class="flex-1 flex items-center justify-center px-8 py-4 min-h-0">
			{#key track.ytMusicId}
				<div class="animate-fade-in w-full max-w-xs sm:max-w-sm aspect-square">
					{#if thumbUrl}
						<img
							src={thumbUrl}
							alt=""
							class="w-full h-full object-cover rounded-2xl shadow-2xl"
						/>
					{:else}
						<div class="w-full h-full rounded-2xl bg-white/5 flex items-center justify-center">
							<Icon name="music" class="w-16 h-16 text-gray-600" />
						</div>
					{/if}
				</div>
			{/key}
		</div>

		<!-- Track info -->
		<div class="px-6 mb-3 flex-shrink-0">
			{#key track.ytMusicId}
				<div class="animate-fade-in flex items-start justify-between gap-3">
					<div class="min-w-0 flex-1">
						<div class="scroll-text is-active" use:scrollText>
							<span class="text-xl font-bold text-white">{track.title}</span>
						</div>
						<p class="text-sm text-gray-400 truncate mt-0.5">{track.artist}</p>
						<p class="text-[11px] text-gray-500 font-mono tabular-nums mt-1">
							{formatCompact(track.streams)} streams · Peak #{track.peak} · {track.weeks} days
						</p>
					</div>
					{#if track.spotifyId}
						<button
							onclick={toggleFav}
							class="p-2 transition-colors cursor-pointer flex-shrink-0
								   {isFav ? 'text-red-400' : 'text-gray-500 hover:text-white'}"
							aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
						>
							<Icon name={isFav ? 'heart-filled' : 'heart'} class="w-6 h-6" />
						</button>
					{/if}
				</div>
			{/key}
		</div>

		<!-- Seek bar -->
		<div class="px-6 mb-2 flex-shrink-0">
			<div
				bind:this={seekBarEl}
				class="h-2 bg-white/10 rounded-full cursor-pointer group relative touch-none"
				role="slider"
				tabindex={0}
				aria-label="Seek"
				aria-valuenow={Math.round(player.progress)}
				aria-valuemin={0}
				aria-valuemax={100}
				onpointerdown={onPointerDown}
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
				onlostpointercapture={() => (seeking = false)}
			>
				<div
					class="h-full bg-white rounded-full transition-[width]"
					class:duration-100={!seeking}
					style="width:{player.progress}%"
				></div>
				<div
					class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg
						   transition-opacity pointer-events-none"
					style="left:calc({player.progress}% - 8px)"
				></div>
			</div>
			<div class="flex justify-between mt-1.5">
				<span class="text-[11px] text-gray-500 font-mono tabular-nums">{formatTime(player.currentTime)}</span>
				<span class="text-[11px] text-gray-500 font-mono tabular-nums">{formatTime(player.duration)}</span>
			</div>
		</div>

		<!-- Controls -->
		<div class="flex items-center justify-center gap-4 sm:gap-6 px-6 pb-6 pt-2 flex-shrink-0">
			<button
				onclick={() => player.toggleShuffle()}
				class="p-2 rounded-full transition-colors cursor-pointer
					   {player.shuffled ? 'text-accent' : 'text-gray-400 hover:text-white'}"
				aria-label="Toggle shuffle"
			>
				<Icon name="shuffle" class="w-5 h-5" />
			</button>

			<button
				onclick={() => player.prev()}
				class="p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
				aria-label="Previous"
			>
				<Icon name="skip-back" class="w-7 h-7" />
			</button>

			<button
				onclick={() => player.togglePlay()}
				class="p-4 bg-white rounded-full text-black hover:scale-105 active:scale-95 transition-transform cursor-pointer"
				aria-label={player.isPlaying ? 'Pause' : 'Play'}
			>
				{#if player.buffering}
					<svg class="w-7 h-7 animate-spin" viewBox="0 0 24 24" fill="none">
						<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
						<path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
					</svg>
				{:else}
					<Icon name={player.isPlaying ? 'pause' : 'play'} class="w-7 h-7" />
				{/if}
			</button>

			<button
				onclick={() => player.next()}
				class="p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
				aria-label="Next"
			>
				<Icon name="skip-forward" class="w-7 h-7" />
			</button>

			<button
				onclick={() => player.cycleRepeat()}
				class="p-2 rounded-full transition-colors cursor-pointer
					   {player.repeat !== 'off' ? 'text-accent' : 'text-gray-400 hover:text-white'}"
				aria-label="Cycle repeat"
			>
				<Icon name={player.repeat === 'one' ? 'repeat-one' : 'repeat'} class="w-5 h-5" />
			</button>
		</div>
	</div>
{/if}