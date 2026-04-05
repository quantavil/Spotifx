<!-- src/lib/components/NowPlayingFull.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatTime, formatCompact, getYTThumbUrl, trackToHue } from '$lib/utils';
	import { fly } from 'svelte/transition';
	import { scrollText } from '$lib/actions';
	import Icon from '../ui/Icon.svelte';

	const track = $derived(player.currentTrack);
	const hue = $derived(track ? trackToHue(track.artist, track.title) : 140);
	const thumbUrl = $derived(track?.ytMusicId ? getYTThumbUrl(track.ytMusicId, 'hqdefault') : '');
	const isFav = $derived(track?.spotifyId ? favorites.has(track.spotifyId) : false);

	function toggleFav() {
		if (!track?.spotifyId) return;
		const added = favorites.toggle(track.spotifyId);
		toast.show(added ? 'Added to favorites' : 'Removed from favorites');
	}

	function openQueue() {
		player.fullScreenOpen = false;
		player.queueOpen = true;
	}

	$effect(() => {
		if (!player.fullScreenOpen) return;

		history.pushState({ playerOpen: true }, '');

		const onPopState = () => {
			player.fullScreenOpen = false;
		};

		window.addEventListener('popstate', onPopState);

		return () => {
			window.removeEventListener('popstate', onPopState);
			if (history.state && history.state.playerOpen) {
				history.back();
			}
		};
	});
</script>

{#if player.fullScreenOpen && track}
	<div
		class="fixed inset-0 sm:bottom-0 sm:right-[24rem] z-[55] sm:z-40 flex flex-col overflow-hidden sm:pb-[5.5rem]"
		style="background: linear-gradient(180deg, hsl({hue} 45% 14%) 0%, hsl({hue} 30% 5%) 50%, hsl({hue} 15% 3%) 100%);"
		transition:fly={{ y: 600, duration: 300 }}
	>
		<!-- Top bar -->
		<div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
			<button
				onclick={() => player.toggleFullScreen()}
				class="text-gray-400 hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-white/5"
				aria-label="Close full screen"
			>
				<Icon name="chevron-down" class="w-6 h-6" />
			</button>
			<span class="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-medium">Now Playing</span>
			<button
				onclick={openQueue}
				class="text-gray-400 hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-white/5"
				aria-label="Open queue"
			>
				<Icon name="queue" class="w-5 h-5" />
			</button>
		</div>

		<!-- Artwork -->
		<div class="flex-1 flex items-center justify-center px-8 sm:px-12 py-4 min-h-0">
			{#key track.ytMusicId}
				<div class="animate-fade-in w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square relative">
					<!-- Glow shadow behind artwork -->
					{#if thumbUrl}
						<div
							class="absolute inset-4 rounded-3xl blur-3xl opacity-30"
							style="background: hsl({hue} 60% 30%);"
						></div>
						<img
							src={thumbUrl}
							alt=""
							class="w-full h-full object-cover rounded-2xl shadow-2xl relative z-10"
						/>
					{:else}
						<div class="w-full h-full rounded-2xl bg-white/5 flex items-center justify-center relative z-10">
							<Icon name="music" class="w-16 h-16 text-gray-600" />
						</div>
					{/if}
				</div>
			{/key}
		</div>

		<!-- Track info -->
		<div class="px-6 sm:px-8 mb-4 flex-shrink-0 max-w-lg mx-auto w-full">
			{#key track.ytMusicId}
				<div class="animate-fade-in flex items-start justify-between gap-3">
					<div class="min-w-0 flex-1">
						<div class="scroll-text is-active" use:scrollText>
							<span class="text-xl sm:text-2xl font-bold text-white">{track.title}</span>
						</div>
						<p class="text-sm sm:text-base text-gray-400 truncate mt-1">{track.artist}</p>
						<p class="text-[11px] text-gray-600 font-mono tabular-nums mt-1.5">
							{formatCompact(track.streams)} streams · Peak #{track.peak} · {track.weeks} days
						</p>
					</div>
					<div class="flex items-center gap-0.5 flex-shrink-0 pt-1 sm:hidden">
						{#if track.ytMusicId}
							<a
								href={`https://music.youtube.com/watch?v=${track.ytMusicId}`}
								target="_blank"
								rel="noopener noreferrer"
								class="p-2 transition-colors cursor-pointer text-gray-500 hover:text-white rounded-full hover:bg-white/5"
								title="Open in YouTube Music"
								aria-label="Open in YouTube Music"
							>
								<Icon name="youtube" class="w-5 h-5" />
							</a>
						{/if}
						{#if track.spotifyId}
							<a
								href={`https://open.spotify.com/track/${track.spotifyId}`}
								target="_blank"
								rel="noopener noreferrer"
								class="p-2 transition-colors cursor-pointer text-gray-500 hover:text-white rounded-full hover:bg-white/5"
								title="Open in Spotify"
								aria-label="Open in Spotify"
							>
								<Icon name="spotify" class="w-5 h-5" />
							</a>
							<button
								onclick={toggleFav}
								class="p-2 transition-colors cursor-pointer rounded-full hover:bg-white/5
									   {isFav ? 'text-red-400' : 'text-gray-500 hover:text-white'}"
								title={isFav ? 'Remove from favorites' : 'Add to favorites'}
								aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
							>
								<Icon name={isFav ? 'heart-filled' : 'heart'} class="w-5 h-5" />
							</button>
						{/if}
					</div>
				</div>
			{/key}
		</div>

		<!-- Seek bar -->
		<div class="px-6 sm:px-8 mb-2 flex-shrink-0 max-w-lg mx-auto w-full sm:hidden">
			<input
				type="range"
				min="0"
				max={player.duration || 1}
				value={player.currentTime}
				oninput={(e) => {
					const time = parseFloat(e.currentTarget.value);
					player.currentTime = time;
					player._onSeek?.(time);
				}}
				class="seek-slider"
				style="--seek-pct: {player.progress}%"
				aria-label="Seek"
			/>
			<div class="flex justify-between mt-1">
				<span class="text-[11px] text-gray-500 font-mono tabular-nums">{formatTime(player.currentTime)}</span>
				<span class="text-[11px] text-gray-500 font-mono tabular-nums">{formatTime(player.duration)}</span>
			</div>
		</div>

		<!-- Controls -->
		<div class="flex items-center justify-center gap-5 sm:gap-7 px-6 pb-4 pt-1 flex-shrink-0 sm:hidden">
			<button
				onclick={() => player.toggleShuffle()}
				class="p-2 transition-colors cursor-pointer
					   {player.shuffled ? 'text-accent' : 'text-gray-500 hover:text-white'}"
				aria-label="Toggle shuffle"
			>
				<Icon name="shuffle" class="w-5 h-5 sm:w-6 sm:h-6" />
			</button>

			<button
				onclick={() => player.prev()}
				class="p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
				aria-label="Previous"
			>
				<Icon name="skip-back" class="w-7 h-7 sm:w-8 sm:h-8" />
			</button>

			<button
				onclick={() => player.togglePlay()}
				class="p-4 sm:p-5 bg-white rounded-full text-black hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-xl"
				aria-label={player.isPlaying ? 'Pause' : 'Play'}
			>
				{#if player.buffering}
					<svg class="w-7 h-7 sm:w-8 sm:h-8 animate-spin" viewBox="0 0 24 24" fill="none">
						<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
						<path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
					</svg>
				{:else}
					<Icon name={player.isPlaying ? 'pause' : 'play'} class="w-7 h-7 sm:w-8 sm:h-8" />
				{/if}
			</button>

			<button
				onclick={() => player.next()}
				class="p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
				aria-label="Next"
			>
				<Icon name="skip-forward" class="w-7 h-7 sm:w-8 sm:h-8" />
			</button>

			<button
				onclick={() => player.cycleRepeat()}
				class="p-2 transition-colors cursor-pointer
					   {player.repeat !== 'off' ? 'text-accent' : 'text-gray-500 hover:text-white'}"
				aria-label="Cycle repeat"
			>
				<Icon name={player.repeat === 'one' ? 'repeat-one' : 'repeat'} class="w-5 h-5 sm:w-6 sm:h-6" />
			</button>
		</div>

	</div>
{/if}