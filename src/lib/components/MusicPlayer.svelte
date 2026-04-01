<!-- src/lib/components/MusicPlayer.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';

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
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path d="M18 6 6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
						</svg>
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
								<p class="text-sm font-medium text-white truncate">{player.currentTrack.title}</p>
								<p class="text-xs text-gray-400 truncate">{player.currentTrack.artist}</p>
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
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
									</svg>
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
									<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path d="M18 6 6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
									</svg>
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
				class="h-1.5 bg-white/10 cursor-pointer group relative touch-none"
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
						   opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
					style="left:calc({player.progress}% - 6px)"
				></div>
			</div>

			<!-- Controls -->
			<div class="flex items-center gap-2 sm:gap-3 px-3 py-2 max-w-6xl mx-auto">
				<!-- Track info -->
				<div class="flex items-center gap-3 flex-1 min-w-0">
					{#if thumbUrl}
						<img
							src={thumbUrl}
							alt=""
							class="w-10 h-10 rounded object-cover flex-shrink-0 bg-white/5"
							loading="lazy"
						/>
					{:else}
						<div class="w-10 h-10 rounded bg-white/5 flex-shrink-0"></div>
					{/if}
					<div class="min-w-0">
						<p class="text-sm font-medium text-white truncate">
							{player.currentTrack?.title ?? ''}
						</p>
						<p class="text-xs text-gray-400 truncate">
							{player.currentTrack?.artist ?? ''}
						</p>
					</div>
				</div>

				<!-- Playback controls -->
				<div class="flex items-center gap-0.5 sm:gap-1">
					<!-- Shuffle -->
					<button
						onclick={() => player.toggleShuffle()}
						class="p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer
							   {player.shuffled ? 'text-accent' : 'text-gray-400 hover:text-white'}"
						title="Shuffle"
						aria-label="Toggle shuffle"
					>
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
						</svg>
					</button>

					<!-- Prev -->
					<button
						onclick={() => player.prev()}
						class="p-1.5 sm:p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
						title="Previous"
						aria-label="Previous track"
					>
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
						</svg>
					</button>

					<!-- Play / Pause -->
					<button
						onclick={() => player.togglePlay()}
						class="p-2 bg-white rounded-full text-black hover:scale-105 active:scale-95 transition-transform cursor-pointer"
						title={player.isPlaying ? 'Pause' : 'Play'}
						aria-label={player.isPlaying ? 'Pause' : 'Play'}
					>
						{#if player.isPlaying}
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
							</svg>
						{:else}
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M8 5v14l11-7z" />
							</svg>
						{/if}
					</button>

					<!-- Next -->
					<button
						onclick={() => player.next()}
						class="p-1.5 sm:p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
						title="Next"
						aria-label="Next track"
					>
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
						</svg>
					</button>

					<!-- Repeat -->
					<button
						onclick={() => player.cycleRepeat()}
						class="p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer relative
							   {player.repeat !== 'off' ? 'text-accent' : 'text-gray-400 hover:text-white'}"
						title="Repeat: {player.repeat}"
						aria-label="Cycle repeat mode"
					>
						{#if player.repeat === 'one'}
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
								<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
							</svg>
						{:else}
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
								<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
							</svg>
						{/if}
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
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
						</svg>
					</button>

					<!-- Volume -->
					<div class="flex items-center gap-1.5">
						<button
							onclick={() => player.setVolume(player.volume > 0 ? 0 : 80)}
							class="text-gray-400 hover:text-white transition-colors cursor-pointer"
							aria-label={player.volume > 0 ? 'Mute' : 'Unmute'}
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
								{#if player.volume === 0}
									<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
								{:else if player.volume < 50}
									<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
								{:else}
									<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
								{/if}
							</svg>
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
				<div class="flex sm:hidden items-center gap-1">
					<button
						onclick={() => player.toggleQueue()}
						class="p-1.5 transition-colors cursor-pointer
							   {player.queueOpen ? 'text-accent' : 'text-gray-400 hover:text-white'}"
						aria-label="Toggle queue"
					>
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
						</svg>
					</button>

					<button
						onclick={() => player.close()}
						class="p-1.5 text-gray-500 hover:text-white transition-colors cursor-pointer"
						aria-label="Close player"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path d="M18 6 6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
						</svg>
					</button>
				</div>

				<!-- Desktop close -->
				<button
					onclick={() => player.close()}
					class="hidden sm:block p-1.5 text-gray-500 hover:text-white transition-colors cursor-pointer"
					title="Close player"
					aria-label="Close player"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path d="M18 6 6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}