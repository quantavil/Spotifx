<!-- src/lib/components/NowPlayingFull.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { formatTime, formatCompact } from '$lib/utils';
	import { fly } from 'svelte/transition';
	import { scrollText } from '$lib/actions';
	import Icon from '../ui/Icon.svelte';
	import TrackThumbnail from '../ui/TrackThumbnail.svelte';
	import FavoriteButton from '../ui/FavoriteButton.svelte';
	import PlaybackControls from './PlaybackControls.svelte';

	const track = $derived(player.currentTrack);

	function openQueue() {
		player.fullScreenOpen = false;
		player.queueOpen = true;
	}

	$effect(() => {
		if (!player.fullScreenOpen) return;

		history.pushState({ playerOpen: true }, '');

		let popped = false;
		const onPopState = () => {
			popped = true;
			player.fullScreenOpen = false;
		};

		window.addEventListener('popstate', onPopState);

		return () => {
			window.removeEventListener('popstate', onPopState);
			if (!popped && !player.fullScreenOpen && history.state && history.state.playerOpen) {
				history.back();
			}
		};
	});
</script>

{#if player.fullScreenOpen && track}
	<div
		class="fixed inset-0 sm:bottom-0 sm:right-[24rem] z-[55] sm:z-40 flex flex-col overflow-hidden sm:pb-[5.5rem]"
		style="background: linear-gradient(180deg, hsl({player.hue} 45% 14%) 0%, hsl({player.hue} 30% 5%) 50%, hsl({player.hue} 15% 3%) 100%);"
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
					{#if track.ytMusicId}
						<div
							class="absolute inset-4 rounded-3xl blur-3xl opacity-30"
							style="background: hsl({player.hue} 60% 30%);"
						></div>
					{/if}
					<TrackThumbnail
						track={track}
						quality="hqdefault"
						class="w-full h-full object-cover rounded-2xl shadow-2xl relative z-10 bg-white/5"
						iconClass="w-16 h-16 text-gray-600"
					/>
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
							<FavoriteButton
								{track}
								class="p-2 transition-colors cursor-pointer rounded-full hover:bg-white/5 text-gray-500 hover:text-white"
								iconClass="w-5 h-5"
							/>
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
		<PlaybackControls size="lg" class="px-6 pb-4 pt-1 flex-shrink-0 sm:hidden" />

	</div>
{/if}
