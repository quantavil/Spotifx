<!-- src/lib/components/MusicPlayer.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import {
		setupMediaHandlers,
		updatePlaybackState,
		updatePositionState
	} from '$lib/stores/mediaSession';
	import { trackToHue } from '$lib/utils';
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';

	import PlayerProgressBar from './PlayerProgressBar.svelte';
	import PlayerTrackInfo from './PlayerTrackInfo.svelte';
	import PlayerMainControls from './PlayerMainControls.svelte';
	import PlayerSecondaryControls from './PlayerSecondaryControls.svelte';

	let ytPlayer: any = null;
	let progressInterval: ReturnType<typeof setInterval> | null = null;
	let apiLoaded = false;
	let apiLoading = false;
	let pendingVideoId: string | null = null;
	let playerReady = false;
	let wantedPlaying = false;
	let seeking = $state(false);
	let consecutiveErrors = 0;
	let positionTick = 0;

	const dynamicHue = $derived(
		player.currentTrack
			? trackToHue(player.currentTrack.artist, player.currentTrack.title)
			: 140
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
	<div
		class="fixed bottom-0 left-0 right-0 z-50 player-bar"
		transition:fly={{ y: 80, duration: 250 }}
	>
		<!-- Player background -->
		<div
			class="border-t border-white/[0.06] backdrop-blur-2xl transition-colors duration-700"
			style="background: linear-gradient(135deg, hsla({dynamicHue}, 40%, 8%, 0.97) 0%, rgba(18,18,18,0.97) 60%, hsla({dynamicHue}, 25%, 6%, 0.97) 100%);"
		>
			<PlayerProgressBar bind:seeking />

			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="player-grid items-center px-3 sm:px-4 py-2 sm:py-2.5 gap-2 sm:gap-4 cursor-pointer"
				onclick={(e) => {
					const target = e.target;
					if (target instanceof Element && !target.closest('button:not(.info-btn), input, a')) {
						player.toggleFullScreen();
					}
				}}
			>
				<PlayerTrackInfo />
				<PlayerMainControls />
				<PlayerSecondaryControls />
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
		.player-bar {
			right: 24rem;
		}
	}
</style>