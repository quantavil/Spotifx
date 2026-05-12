<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { fly } from 'svelte/transition';
	import Icon from '../ui/Icon.svelte';
	import TrackThumbnail from '../ui/TrackThumbnail.svelte';
	import Equalizer from '../ui/Equalizer.svelte';
	import { scrollText } from '$lib/actions';

	let { isDesktop = false } = $props();

	let dragIndex: number | null = $state(null);
	let dragOverIndex: number | null = $state(null);
	let dragAbsFrom: number | null = $state(null);

	function onDragStart(idx: number) {
		dragAbsFrom = player.currentIndex + 1 + idx;
		dragIndex = idx;
	}

	function onDragOver(idx: number) {
		dragOverIndex = idx;
	}

	function onDrop(idx: number) {
		if (dragAbsFrom !== null && dragIndex !== idx) {
			const absTo = player.currentIndex + 1 + idx;
			player.reorder(dragAbsFrom, absTo);
		}
		dragAbsFrom = null;
		dragIndex = null;
		dragOverIndex = null;
	}

	function onDragEnd() {
		dragAbsFrom = null;
		dragIndex = null;
		dragOverIndex = null;
	}
</script>

{#if isDesktop || player.queueOpen}
	<!-- Backdrop overlay on mobile -->
	{#if !isDesktop && player.queueOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] sm:hidden"
		transition:fly={{ duration: 200 }}
		onclick={() => (player.queueOpen = false)}
	></div>
	{/if}

	<div
		class={isDesktop ? "flex flex-col h-full bg-transparent relative" : "fixed inset-y-0 right-0 w-full bg-[#090909] z-[60] flex flex-col shadow-2xl border-l border-white/5"}
		transition:fly={isDesktop ? undefined : { x: 400, duration: 300 }}
		style={isDesktop ? '' : `--page-hue: ${player.hue};`}
	>
		<!-- Header -->
		<div class="px-5 py-4 flex items-center justify-between border-b border-white/5 flex-shrink-0">
			<h2 class="text-sm font-bold text-white uppercase tracking-wider">Queue</h2>
			<div class="flex items-center gap-1">
				<button
					onclick={() => player.clearQueue()}
					class="text-[11px] text-gray-500 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded hover:bg-white/5"
				>
					Clear
				</button>
				{#if !isDesktop}
				<button
					onclick={() => (player.queueOpen = false)}
					class="text-gray-400 hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-white/5"
					aria-label="Close queue"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
				{:else}
				<button
					onclick={() => player.toggleQueue()}
					class="text-gray-400 hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-white/5"
					aria-label="Close queue"
				>
					<Icon name="close" class="w-4 h-4" />
				</button>
				{/if}
			</div>
		</div>

	<!-- Scrollable content -->
	<div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
		<!-- Now Playing -->
		{#if player.currentTrack}
			<div>
				<h3 class="px-2 mb-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Now Playing</h3>
				<div class="group relative flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-accent/20">
					<TrackThumbnail
						track={player.currentTrack}
						class="w-10 h-10 rounded shadow-md object-cover"
					/>
					<div class="min-w-0 flex-1">
						<div class="scroll-text is-active" use:scrollText>
							<span class="text-sm font-medium text-accent">{player.currentTrack.title}</span>
						</div>
						<p class="text-xs text-gray-400 truncate">{player.currentTrack.artist}</p>
					</div>
					<Equalizer isPlaying={player.isPlaying} class="flex items-end gap-[2px] h-3 mr-1" />
				</div>
			</div>
		{/if}

		<!-- Up Next -->
		<div>
			<h3 class="px-2 mb-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
				Up Next
				<span class="text-[10px] font-normal lowercase tracking-normal">
					{player.upcomingTracks.length} tracks
				</span>
			</h3>

			{#if player.upcomingTracks.length === 0}
				<div class="px-2 py-8 text-center">
					<p class="text-xs text-gray-600">No tracks in queue</p>
				</div>
			{:else}
				<div class="space-y-1">
					{#each player.upcomingTracks as track, i (track._qid)}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							draggable="true"
							ondragstart={() => onDragStart(i)}
							ondragover={(e) => { e.preventDefault(); onDragOver(i); }}
							onscroll={(e) => { e.preventDefault(); }}
							ondrop={() => onDrop(i)}
							ondragend={onDragEnd}
							class="group relative flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-default
								   {dragOverIndex === i ? 'bg-accent/10' : ''} {dragIndex === i ? 'opacity-40' : ''}"
						>
							<button
								onclick={() => player.jumpToEntry(track._qid)}
								class="relative group/thumb"
							>
								<TrackThumbnail
									{track}
									class="w-10 h-10 rounded shadow-sm object-cover transition-opacity group-hover/thumb:opacity-40"
								/>
								<div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
									<Icon name="play" class="w-4 h-4 text-white" />
								</div>
							</button>

							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">
									{track.title}
								</p>
								<p class="text-xs text-gray-500 truncate">{track.artist}</p>
							</div>

							<button
								onclick={() => player.removeEntry(track._qid)}
								class="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
								title="Remove from queue"
							>
								<Icon name="close" class="w-4 h-4" />
							</button>

							<!-- Drag handle -->
							<div class="cursor-grab active:cursor-grabbing text-gray-700 hover:text-gray-400 px-1">
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
									<path d="M8 9h8v2H8V9zm0 4h8v2H8v-2z" />
								</svg>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
