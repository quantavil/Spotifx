<!-- src/lib/components/MusicPlayer.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { formatCompact } from '$lib/utils';
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import { scrollText } from '$lib/actions';
	import Icon from './Icon.svelte';

	let ytPlayer: any = null;
	let progressInterval: ReturnType<typeof setInterval> | null = null;
	let apiLoaded = false;
	let pendingVideoId: string | null = null;
	let playerReady = false;
	let seeking = $state(false);
	let consecutiveErrors = 0;
	let progressBarEl: HTMLDivElement | undefined = $state();

	// ── Queue drag state ──
	let dragIndex: number | null = $state(null);
	let dragOverIndex: number | null = $state(null);

	function formatTime(s: number): string {
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	const thumbUrl = $derived(
		player.currentTrack?.ytMusicId
			? `https://i.ytimg.com/vi/${player.currentTrack.ytMusicId}/mqdefault.jpg`
			: ''
	);

	// ── YouTube IFrame API ──

	function loadYTApi() {
		if (apiLoaded || typeof window === 'undefined') return;
		if ((window as any).YT?.Player) {
			apiLoaded = true;
			createPlayer();
			return;
		}
		const tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		document.head.appendChild(tag);
		(window as any).onYouTubeIframeAPIReady = () => {
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
		if (pendingVideoId) {
			ytPlayer.loadVideoById(pendingVideoId);
			pendingVideoId = null;
		}
	}

	function onPlayerStateChange(event: any) {
		const YT = (window as any).YT;
		switch (event.data) {
			case YT.PlayerState.PLAYING:
				player.isPlaying = true;
				consecutiveErrors = 0;
				startProgressPolling();
				break;
			case YT.PlayerState.PAUSED:
				player.isPlaying = false;
				stopProgressPolling();
				break;
			case YT.PlayerState.ENDED:
				stopProgressPolling();
				player.next();
				break;
		}
	}

	function onPlayerError() {
		consecutiveErrors++;
		if (consecutiveErrors > 5) {
			player.isPlaying = false;
			return;
		}
		player.next();
	}

	function startProgressPolling() {
		stopProgressPolling();
		progressInterval = setInterval(() => {
			if (!ytPlayer || !playerReady || seeking) return;
			try {
				player.currentTime = ytPlayer.getCurrentTime() || 0;
				player.duration = ytPlayer.getDuration() || 0;
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

	// ── Seek bar pointer events ──

	function seekFromPointer(e: PointerEvent) {
		if (!progressBarEl) return;
		const rect = progressBarEl.getBoundingClientRect();
		const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		player.currentTime = frac * player.duration;
	}

	function onPointerDown(e: PointerEvent) {
		seeking = true;
		progressBarEl?.setPointerCapture(e.pointerId);
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

	// ── Queue drag-to-reorder (pointer-event based) ──

	function onDragStart(idx: number) {
		dragIndex = idx;
	}

	function onDragOver(idx: number) {
		dragOverIndex = idx;
	}

	function onDragEnd() {
		if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
			// Convert from "upcoming" relative indices to absolute queue indices
			const absFrom = player.currentIndex + 1 + dragIndex;
			const absTo = player.currentIndex + 1 + dragOverIndex;
			player.reorder(absFrom, absTo);
		}
		dragIndex = null;
		dragOverIndex = null;
	}

	// ── Keyboard ──

	function handleKeydown(e: KeyboardEvent) {
		if (!player.visible) return;
		const tag = (e.target as HTMLElement)?.tagName;
		if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(tag)) return;
		if (e.code === 'Space') {
			e.preventDefault();
			player.togglePlay();
		}
	}

	// ── Lifecycle ──

	onMount(() => {
		player._onPlay = (videoId: string) => {
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
			try { ytPlayer?.pauseVideo(); } catch { /* noop */ }
		};
		player._onResume = () => {
			try { ytPlayer?.playVideo(); } catch { /* noop */ }
		};
		player._onSeek = (time: number) => {
			try { ytPlayer?.seekTo(time, true); } catch { /* noop */ }
		};
		player._onVolume = (vol: number) => {
			try { ytPlayer?.setVolume(vol); } catch { /* noop */ }
		};

		if (player.currentTrack && player.isPlaying) {
			player._onPlay(player.currentTrack.ytMusicId);
		}
	});

	onDestroy(() => {
		stopProgressPolling();
		player._onPlay = null;
		player._onPause = null;
		player._onResume = null;
		player._onSeek = null;
		player._onVolume = null;
		try { ytPlayer?.destroy(); } catch { /* noop */ }
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Hidden YT player -->
<div
	class="fixed pointer-events-none"
	style="left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;"
	aria-hidden="true"
>
	<div id="yt-hidden-player"></div>
</div>

<!-- Player bar -->
{#if player.visible}
	<div
		class="fixed bottom-0 left-0 right-0 z-50"
		transition:fly={{ y: 80, duration: 250 }}
	>
		<!-- Queue panel -->
		{#if player.queueOpen}
			<div
				class="bg-surface/95 backdrop-blur-lg border-t border-x border-white/10 rounded-t-xl
					   max-w-6xl mx-auto max-h-[50vh] flex flex-col overflow-hidden"
				transition:fly={{ y: 40, duration: 200 }}
			>
				<div class="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
					<div>
						<h3 class="text-sm font-semibold text-white">Queue</h3>
						<p class="text-[11px] text-gray-500">
							{player.upcomingTracks.length} upcoming
						</p>
					</div>
					<button
						onclick={() => player.toggleQueue()}
						class="text-gray-500 hover:text-white transition-colors cursor-pointer p-1"
						aria-label="Close queue"
					>
						<Icon name="close" />
					</button>
				</div>

				<!-- Now playing -->
				{#if player.currentTrack}
					<div class="px-4 py-2 bg-accent/10 border-b border-white/5 flex-shrink-0">
						<p class="text-[10px] font-semibold uppercase tracking-wider text-accent/80 mb-1">Now Playing</p>
						<div class="flex items-center gap-3">
							{#if player.currentTrack.ytMusicId}
								<img
									src="https://i.ytimg.com/vi/{player.currentTrack.ytMusicId}/default.jpg"
									alt=""
									class="w-8 h-8 rounded object-cover flex-shrink-0 bg-white/5"
								/>
							{/if}
							<div class="min-w-0">
								<div class="scroll-text is-active" use:scrollText>
									<span class="text-sm font-medium text-white">{player.currentTrack.title}</span>
								</div>
								<p class="text-xs text-gray-400 truncate">{player.currentTrack.artist}</p>
								<p class="text-[10px] text-gray-500 font-mono tabular-nums mt-0.5">
									{formatCompact(player.currentTrack.streams)} streams · Peak #{player.currentTrack.peak} · {player.currentTrack.weeks} days
								</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Upcoming tracks -->
				<div class="overflow-y-auto flex-1 scrollbar-none">
					{#if player.upcomingTracks.length === 0}
						<div class="px-4 py-8 text-center text-gray-600 text-sm">
							No upcoming tracks
						</div>
					{:else}
						{#each player.upcomingTracks as track, i (track.ytMusicId + '-' + i)}
							<div
								class="flex items-center gap-2 px-4 py-2 hover:bg-surface-hover transition-colors group
									{dragOverIndex === i && dragIndex !== null ? 'border-t-2 border-accent' : 'border-t border-transparent'}"
								role="listitem"
								draggable="true"
								ondragstart={(e) => { e.dataTransfer?.setData('text/plain', ''); onDragStart(i); }}
								ondragover={(e) => { e.preventDefault(); onDragOver(i); }}
								ondragend={onDragEnd}
							>
								<!-- Drag handle -->
								<span
									class="text-gray-700 group-hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
									aria-hidden="true"
								>
									<Icon name="drag-handle" />
								</span>

								<!-- Track number -->
								<span class="text-xs text-gray-600 font-mono tabular-nums w-5 text-right flex-shrink-0">
									{i + 1}
								</span>

								<!-- Track info (click to jump) -->
								<button
									onclick={() => player.jumpTo(player.currentIndex + 1 + i)}
									class="flex-1 min-w-0 text-left cursor-pointer hover:text-white transition-colors"
								>
									<p class="text-sm text-gray-300 truncate group-hover:text-white">
										{track.title}
									</p>
									<p class="text-xs text-gray-600 truncate">{track.artist}</p>
								</button>

								<!-- Remove -->
								<button
									onclick={() => player.removeFromQueue(player.currentIndex + 1 + i)}
									class="text-gray-700 hover:text-red-400 transition-colors cursor-pointer p-1 opacity-0 group-hover:opacity-100 flex-shrink-0"
									title="Remove from queue"
									aria-label="Remove {track.title} from queue"
								>
									<Icon name="close" class="w-3.5 h-3.5" />
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}

		<!-- Main player bar -->
		<div class="bg-surface-alt/95 backdrop-blur-lg border-t border-white/10">
			<!-- Progress bar -->
			<div
				bind:this={progressBarEl}
				class="h-2 sm:h-1.5 bg-white/10 cursor-pointer group relative touch-none"
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
					class="h-full bg-accent transition-[width]"
					class:duration-100={!seeking}
					style="width:{player.progress}%"
				></div>
				<div
					class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg
						   opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none"
					style="left:calc({player.progress}% - 6px)"
				></div>
			</div>

			<!-- Controls -->
			<div class="flex items-center gap-1 sm:gap-3 px-2 sm:px-3 py-2 max-w-6xl mx-auto">
				<!-- Track info -->
				<div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-[40%] sm:max-w-none">
					{#if thumbUrl}
						<img
							src={thumbUrl}
							alt=""
							class="w-9 h-9 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0 bg-white/5"
							loading="lazy"
						/>
					{:else}
						<div class="w-9 h-9 sm:w-10 sm:h-10 rounded bg-white/5 flex-shrink-0"></div>
					{/if}
					<div class="min-w-0">
						<div class="scroll-text is-active" use:scrollText>
							<span class="text-xs sm:text-sm font-medium text-white">
								{player.currentTrack?.title ?? ''}
							</span>
						</div>
						<p class="text-[11px] sm:text-xs text-gray-400 truncate">
							{player.currentTrack?.artist ?? ''}
						</p>
						{#if player.currentTrack}
							<p class="text-[10px] text-gray-500 font-mono tabular-nums truncate">
								{formatCompact(player.currentTrack.streams)} · Pk {player.currentTrack.peak} · {player.currentTrack.weeks}d
							</p>
						{/if}
					</div>
				</div>

				<!-- Playback controls -->
				<div class="flex items-center justify-center gap-0.5 sm:gap-1 flex-1 sm:flex-none">
					<!-- Shuffle -->
					<button
						onclick={() => player.toggleShuffle()}
						class="p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer
							   {player.shuffled ? 'text-accent' : 'text-gray-400 hover:text-white'}"
						title="Shuffle"
						aria-label="Toggle shuffle"
					>
						<Icon name="shuffle" />
					</button>

					<!-- Prev -->
					<button
						onclick={() => player.prev()}
						class="p-1.5 sm:p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
						title="Previous"
						aria-label="Previous track"
					>
						<Icon name="skip-back" />
					</button>

					<!-- Play / Pause -->
					<button
						onclick={() => player.togglePlay()}
						class="p-2 bg-white rounded-full text-black hover:scale-105 active:scale-95 transition-transform cursor-pointer"
						title={player.isPlaying ? 'Pause' : 'Play'}
						aria-label={player.isPlaying ? 'Pause' : 'Play'}
					>
						<Icon name={player.isPlaying ? 'pause' : 'play'} class="w-5 h-5" />
					</button>

					<!-- Next -->
					<button
						onclick={() => player.next()}
						class="p-1.5 sm:p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
						title="Next"
						aria-label="Next track"
					>
						<Icon name="skip-forward" />
					</button>

					<!-- Repeat -->
					<button
						onclick={() => player.cycleRepeat()}
						class="p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer relative
							   {player.repeat !== 'off' ? 'text-accent' : 'text-gray-400 hover:text-white'}"
						title="Repeat: {player.repeat}"
						aria-label="Cycle repeat mode"
					>
						<Icon name={player.repeat === 'one' ? 'repeat-one' : 'repeat'} />
					</button>
				</div>

				<!-- Time + Queue + Volume (desktop) -->
				<div class="hidden sm:flex items-center gap-3 flex-1 justify-end">
					<span class="text-[11px] text-gray-500 font-mono tabular-nums whitespace-nowrap">
						{formatTime(player.currentTime)} / {formatTime(player.duration)}
					</span>

					<!-- Queue toggle -->
					<button
						onclick={() => player.toggleQueue()}
						class="p-1.5 transition-colors cursor-pointer
							   {player.queueOpen ? 'text-accent' : 'text-gray-400 hover:text-white'}"
						title="Queue"
						aria-label="Toggle queue"
					>
						<Icon name="queue" />
					</button>

					<!-- Volume -->
					<div class="flex items-center gap-1.5">
						<button
							onclick={() => player.setVolume(player.volume > 0 ? 0 : 80)}
							class="text-gray-400 hover:text-white transition-colors cursor-pointer"
							aria-label={player.volume > 0 ? 'Mute' : 'Unmute'}
						>
							<Icon name={player.volume === 0 ? 'volume-mute' : player.volume < 50 ? 'volume-low' : 'volume-high'} />
						</button>
						<input
							type="range"
							min="0"
							max="100"
							value={player.volume}
							oninput={(e) => player.setVolume(parseInt(e.currentTarget.value))}
							class="w-20 h-1 accent-accent cursor-pointer"
							aria-label="Volume"
						/>
					</div>
				</div>

				<!-- Mobile: queue toggle + close -->
				<div class="flex sm:hidden items-center justify-end gap-0.5 flex-1">
					<button
						onclick={() => player.toggleQueue()}
						class="p-1.5 transition-colors cursor-pointer
							   {player.queueOpen ? 'text-accent' : 'text-gray-400 hover:text-white'}"
						aria-label="Toggle queue"
					>
						<Icon name="queue" />
					</button>

					<button
						onclick={() => player.close()}
						class="p-1.5 text-gray-500 hover:text-white transition-colors cursor-pointer"
						aria-label="Close player"
					>
						<Icon name="close" />
					</button>
				</div>

				<!-- Desktop close -->
				<button
					onclick={() => player.close()}
					class="hidden sm:block p-1.5 text-gray-500 hover:text-white transition-colors cursor-pointer"
					title="Close player"
					aria-label="Close player"
				>
					<Icon name="close" />
				</button>
			</div>
		</div>
	</div>
{/if}