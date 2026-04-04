<!-- src/lib/components/MusicPlayer.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import {
		setupMediaHandlers,
		updatePlaybackState,
		updatePositionState
	} from '$lib/stores/mediaSession';
	import { formatTime, getYTThumbUrl, trackToHue } from '$lib/utils';
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import { scrollText } from '$lib/actions';
	import Icon from './Icon.svelte';
	import QueuePanel from './QueuePanel.svelte';

	let ytPlayer: any = null;
	let progressInterval: ReturnType<typeof setInterval> | null = null;
	let apiLoaded = false;
	let apiLoading = false;
	let pendingVideoId: string | null = null;
	let playerReady = false;
	let wantedPlaying = false;
	let seeking = $state(false);
	let consecutiveErrors = 0;
	let progressBarEl: HTMLDivElement | undefined = $state();
	let positionTick = 0;

	let hoverTime = $state('');
	let hoverX = $state(0);
	let hovering = $state(false);

	const thumbUrl = $derived(
		player.currentTrack?.ytMusicId
			? getYTThumbUrl(player.currentTrack.ytMusicId)
			: ''
	);

	const dynamicHue = $derived(
		player.currentTrack
			? trackToHue(player.currentTrack.artist, player.currentTrack.title)
			: 140
	);

	const isFav = $derived(
		player.currentTrack?.spotifyId
			? favorites.has(player.currentTrack.spotifyId)
			: false
	);

	// ── YouTube IFrame API ──

	function loadYTApi() {
		if (apiLoaded || apiLoading || typeof window === 'undefined') return;

		if ((window as any).YT?.Player) {
			apiLoaded = true;
			createPlayer();
			return;
		}

		apiLoading = true;

		if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			document.head.appendChild(tag);
		}

		(window as any).onYouTubeIframeAPIReady = () => {
			apiLoading = false;
			apiLoaded = true;
			createPlayer();
		};
	}

	function createPlayer() {
		if (ytPlayer || !apiLoaded) return;
		ytPlayer = new (window as any).YT.Player('yt-hidden-player', {
			height: '1',
			width: '1',
			playerVars: {
				autoplay: 0,
				controls: 0,
				disablekb: 1,
				fs: 0,
				modestbranding: 1,
				rel: 0,
				iv_load_policy: 3,
				playsinline: 1,
				origin: window.location.origin
			},
			events: {
				onReady: onPlayerReady,
				onStateChange: onPlayerStateChange,
				onError: onPlayerError
			}
		});
	}

	function onPlayerReady() {
		playerReady = true;
		ytPlayer.setVolume(player.volume);

		if (pendingVideoId && wantedPlaying) {
			ytPlayer.loadVideoById(pendingVideoId);
		}
		pendingVideoId = null;
	}

	function onPlayerStateChange(event: any) {
		if (!playerReady) return;
		const YT = (window as any).YT;
		switch (event.data) {
			case YT.PlayerState.PLAYING:
				player.isPlaying = true;
				player.buffering = false;
				consecutiveErrors = 0;
				updatePlaybackState(true);
				startProgressPolling();
				break;
			case YT.PlayerState.PAUSED:
				player.isPlaying = false;
				player.buffering = false;
				updatePlaybackState(false);
				stopProgressPolling();
				break;
			case YT.PlayerState.BUFFERING:
				player.buffering = true;
				break;
			case YT.PlayerState.ENDED:
				stopProgressPolling();
				player.next();
				break;
		}
	}

	function onPlayerError(event: any) {
		if (!playerReady) return;

		const code = event?.data;
		consecutiveErrors++;

		if (code === 101 || code === 150) {
			toast.show("This track can't be played in an embedded player");
		} else if (code === 100) {
			toast.show('Track not found');
		}

		if (consecutiveErrors > 5) {
			player.isPlaying = false;
			player.buffering = false;
			wantedPlaying = false;
			toast.show('Playback error — too many failures');
			return;
		}

		player.next();
	}

	function startProgressPolling() {
		stopProgressPolling();
		positionTick = 0;
		progressInterval = setInterval(() => {
			if (!ytPlayer || !playerReady || seeking) return;
			try {
				player.currentTime = ytPlayer.getCurrentTime() || 0;
				player.duration = ytPlayer.getDuration() || 0;
				positionTick++;
				if (positionTick % 8 === 0) {
					updatePositionState(player.currentTime, player.duration);
				}
			} catch {
				/* player destroyed */
			}
		}, 250);
	}

	function stopProgressPolling() {
		if (progressInterval) {
			clearInterval(progressInterval);
			progressInterval = null;
		}
	}

	// ── Seek bar ──

	function seekFromPointer(e: PointerEvent) {
		if (!progressBarEl || player.duration <= 0) return;
		const rect = progressBarEl.getBoundingClientRect();
		const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		player.currentTime = frac * player.duration;
	}

	function onPointerDown(e: PointerEvent) {
		seeking = true;
		try {
			progressBarEl?.setPointerCapture(e.pointerId);
		} catch {
			/* disconnected element or invalid pointer */
		}
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

	function onBarHover(e: MouseEvent) {
		if (!progressBarEl || player.duration <= 0) return;
		const rect = progressBarEl.getBoundingClientRect();
		const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		hoverX = e.clientX - rect.left;
		hoverTime = formatTime(frac * player.duration);
		hovering = true;
	}

	// ── Keyboard ──

	function handleKeydown(e: KeyboardEvent) {
		const tag = (e.target as HTMLElement)?.tagName;
		if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
			if (e.key === 'Escape') {
				(e.target as HTMLElement)?.blur();
				if (player.fullScreenOpen) player.fullScreenOpen = false;
				else if (player.queueOpen) player.queueOpen = false;
			}
			return;
		}

		if (e.key === 'Escape') {
			if (player.fullScreenOpen) {
				player.fullScreenOpen = false;
				return;
			} else if (player.queueOpen) {
				player.queueOpen = false;
				return;
			}
		}

		if (e.key === '?') {
			e.preventDefault();
			player.toggleShortcuts();
			return;
		}

		if (!player.visible) return;

		switch (e.code) {
			case 'Space':
				e.preventDefault();
				player.togglePlay();
				break;
			case 'ArrowRight':
				e.preventDefault();
				if (player.duration > 0) {
					const t = Math.min(player.currentTime + 10, player.duration);
					player.currentTime = t;
					player._onSeek?.(t);
				}
				break;
			case 'ArrowLeft':
				e.preventDefault();
				if (player.duration > 0) {
					const t = Math.max(player.currentTime - 10, 0);
					player.currentTime = t;
					player._onSeek?.(t);
				}
				break;
			case 'ArrowUp':
				e.preventDefault();
				player.setVolume(Math.min(player.volume + 5, 100));
				break;
			case 'ArrowDown':
				e.preventDefault();
				player.setVolume(Math.max(player.volume - 5, 0));
				break;
			case 'KeyM':
				player.setVolume(player.volume > 0 ? 0 : 80);
				break;
			case 'KeyQ':
				player.toggleQueue();
				break;
			case 'KeyN':
				player.next();
				break;
			case 'KeyP':
				player.prev();
				break;
			case 'KeyS':
				player.toggleShuffle();
				break;
			case 'KeyR':
				player.cycleRepeat();
				break;
			case 'KeyF':
				if (player.currentTrack) player.toggleFullScreen();
				break;
		}
	}

	function toggleFav() {
		if (!player.currentTrack?.spotifyId) return;
		const added = favorites.toggle(player.currentTrack.spotifyId);
		toast.show(added ? 'Added to favorites' : 'Removed from favorites');
	}

	// ── Visibility change ──

	function handleVisibilityChange() {
		if (!document.hidden && wantedPlaying && ytPlayer && playerReady) {
			try {
				const YT = (window as any).YT;
				if (ytPlayer.getPlayerState?.() !== YT?.PlayerState?.PLAYING) {
					ytPlayer.playVideo();
				}
			} catch {
				/* player may be destroyed */
			}
		}
	}

	// ── Lifecycle ──

	onMount(() => {
		player._onPlay = (videoId: string) => {
			wantedPlaying = true;
			consecutiveErrors = 0;

			if (!apiLoaded) {
				pendingVideoId = videoId;
				loadYTApi();
				return;
			}
			if (!playerReady) {
				pendingVideoId = videoId;
				return;
			}
			ytPlayer.loadVideoById(videoId);
		};

		player._onPause = () => {
			wantedPlaying = false;
			try {
				ytPlayer?.pauseVideo();
			} catch {
				/* noop */
			}
		};

		player._onResume = () => {
			wantedPlaying = true;
			try {
				ytPlayer?.playVideo();
			} catch {
				/* noop */
			}
		};

		player._onSeek = (time: number) => {
			try {
				ytPlayer?.seekTo(time, true);
			} catch {
				/* noop */
			}
		};

		player._onVolume = (vol: number) => {
			try {
				ytPlayer?.setVolume(vol);
			} catch {
				/* noop */
			}
		};

		setupMediaHandlers({
			play: () => player.play(),
			pause: () => player.pause(),
			prev: () => player.prev(),
			next: () => player.next(),
			seekTo: (time) => {
				player.currentTime = time;
				player._onSeek?.(time);
			}
		});

		if (player.currentTrack && player.isPlaying) {
			player._onPlay(player.currentTrack.ytMusicId);
		}

		document.addEventListener('visibilitychange', handleVisibilityChange);
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}

		stopProgressPolling();

		playerReady = false;
		wantedPlaying = false;

		player._onPlay = null;
		player._onPause = null;
		player._onResume = null;
		player._onSeek = null;
		player._onVolume = null;

		const ref = ytPlayer;
		ytPlayer = null;
		try {
			ref?.destroy();
		} catch {
			/* noop */
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed pointer-events-none"
	style="left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;"
	aria-hidden="true"
>
	<div id="yt-hidden-player"></div>
</div>

{#if player.visible}
	{#if player.queueOpen}
		<QueuePanel />
	{/if}

	<div
		class="fixed bottom-0 left-0 right-0 z-50 player-bar"
		class:queue-open={player.queueOpen}
		transition:fly={{ y: 80, duration: 250 }}
	>
		<!-- Player background -->
		<div
			class="border-t border-white/[0.06] backdrop-blur-2xl transition-colors duration-700"
			style="background: linear-gradient(135deg, hsla({dynamicHue}, 40%, 8%, 0.97) 0%, rgba(18,18,18,0.97) 60%, hsla({dynamicHue}, 25%, 6%, 0.97) 100%);"
		>
			<!-- Progress bar -->
			<div
				bind:this={progressBarEl}
				class="h-1 bg-white/[0.08] cursor-pointer group/bar relative touch-none hover:h-1.5 transition-all"
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
				onmousemove={onBarHover}
				onmouseleave={() => (hovering = false)}
			>
				<div
					class="h-full bg-accent transition-[width] rounded-r-full"
					class:duration-100={!seeking}
					style="width:{player.progress}%"
				></div>
				<div
					class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg
						   opacity-100 sm:opacity-0 sm:group-hover/bar:opacity-100 transition-opacity pointer-events-none"
					style="left:calc({player.progress}% - 6px)"
				></div>

				{#if hovering && player.duration > 0 && !seeking}
					<div
						class="absolute -top-8 bg-black/90 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap font-mono"
						style="left:{hoverX}px;transform:translateX(-50%)"
					>
						{hoverTime}
					</div>
				{/if}
			</div>

			<!-- Main controls: 3-column grid on desktop, flex on mobile -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="player-grid items-center px-3 sm:px-4 py-2 sm:py-2.5 gap-2 sm:gap-4 cursor-pointer"
				onclick={(e) => {
					const target = e.target;
					if (target instanceof Element && !target.closest('button:not(.info-btn), input, a')) {
						player.toggleFullScreen();
					}
				}}
			>
				<!-- Left: Track info -->
				<button
					class="info-btn flex items-center gap-2.5 sm:gap-3 min-w-0 text-left cursor-pointer group/info"
				>
					{#key player.currentTrack?.ytMusicId}
						<div class="animate-fade-in flex items-center gap-2.5 sm:gap-3 min-w-0" style="animation-duration:0.25s">
							<div class="relative flex-shrink-0">
								{#if thumbUrl}
									<img
										src={thumbUrl}
										alt=""
										class="w-11 h-11 sm:w-12 sm:h-12 rounded-md object-cover bg-white/5 shadow-md"
										loading="lazy"
									/>
								{:else}
									<div class="w-11 h-11 sm:w-12 sm:h-12 rounded-md bg-white/5 flex items-center justify-center">
										<Icon name="music" class="w-5 h-5 text-gray-600" />
									</div>
								{/if}
								<div class="absolute inset-0 rounded-md bg-black/0 group-hover/info:bg-black/40 transition-colors flex items-center justify-center">
									<Icon name="fullscreen" class="w-4 h-4 text-white opacity-0 group-hover/info:opacity-100 transition-opacity" />
								</div>
							</div>

							<div class="min-w-0">
								<div class="scroll-text is-active" use:scrollText>
									<span class="text-[13px] sm:text-sm font-semibold text-white group-hover/info:text-accent transition-colors">
										{player.currentTrack?.title ?? ''}
									</span>
								</div>
								<p class="text-[11px] sm:text-xs text-gray-400 truncate">
									{player.currentTrack?.artist ?? ''}
								</p>
							</div>
						</div>
					{/key}
				</button>

				<!-- Center: Transport controls -->
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

				<!-- Right: Secondary controls -->
				<div class="flex items-center justify-end gap-1 sm:gap-1.5">
					<!-- Desktop controls -->
					<div class="hidden sm:flex items-center gap-1">
						{#if player.currentTrack?.spotifyId}
							<button
								onclick={toggleFav}
								class="p-1.5 transition-colors cursor-pointer
									   {isFav ? 'text-red-400' : 'text-gray-500 hover:text-white'}"
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
							class="p-1.5 transition-colors cursor-pointer
								   {player.queueOpen ? 'text-accent' : 'text-gray-500 hover:text-white'}"
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
								class="p-1.5 transition-colors cursor-pointer
									   {isFav ? 'text-red-400' : 'text-gray-600'}"
								aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
							>
								<Icon name={isFav ? 'heart-filled' : 'heart'} class="w-4 h-4" />
							</button>
						{/if}

						<button
							onclick={() => player.toggleQueue()}
							class="p-1.5 transition-colors cursor-pointer
								   {player.queueOpen ? 'text-accent' : 'text-gray-600 hover:text-white'}"
							aria-label="Toggle queue"
						>
							<Icon name="queue" class="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.player-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
	}

	.player-bar {
		transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@media (min-width: 640px) {
		.player-bar.queue-open {
			right: 380px;
		}
	}
</style>