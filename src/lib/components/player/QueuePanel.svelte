<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { fly } from 'svelte/transition';
	import Icon from '../ui/Icon.svelte';
	import { getYTThumbUrl, trackToHue } from '$lib/utils';
	import { scrollText } from '$lib/actions';

	let dragIndex: number | null = $state(null);
	let dragOverIndex: number | null = $state(null);

	const hue = $derived(
		player.currentTrack
			? trackToHue(player.currentTrack.artist, player.currentTrack.title)
			: 140
	);

	function onDragStart(idx: number) {
		dragIndex = idx;
	}

	function onDragOver(idx: number) {
		dragOverIndex = idx;
	}

	function onDrop(idx: number) {
		if (dragIndex !== null && dragIndex !== idx) {
			const absFrom = player.currentIndex + 1 + dragIndex;
			const absTo = player.currentIndex + 1 + idx;
			player.reorder(absFrom, absTo);
		}
		dragIndex = null;
		dragOverIndex = null;
	}

	function onDragEnd() {
		dragIndex = null;
		dragOverIndex = null;
	}
</script>

<!-- Backdrop overlay on mobile -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if player.queueOpen}
<div
	class="fixed inset-0 z-[39] bg-black/60 sm:hidden"
	onclick={() => player.toggleQueue()}
	transition:fly={{ duration: 150, opacity: 0 }}
></div>
{/if}

<div
	class="z-40 flex flex-col overflow-hidden pb-[4.5rem] sm:pb-0
		   w-full sm:w-full sm:shadow-none shadow-2xl
		   { player.queueOpen ? 'fixed top-0 right-0 bottom-0 sm:static sm:h-full' : 'hidden sm:static sm:h-full sm:flex' }"
	style="background: linear-gradient(180deg, hsla({hue}, 20%, 9%, 0.99) 0%, rgba(14,14,14,0.995) 25%);"
>
	<!-- Header -->
	<div class="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-white/[0.05]">
		<div>
			<h3 class="text-base font-bold text-white tracking-tight">Queue</h3>
			<p class="text-[11px] text-gray-500 mt-0.5">{player.upcomingTracks.length} upcoming</p>
		</div>
		<div class="flex items-center gap-1">
			<button
				onclick={() => player.toggleShuffle()}
				class="p-2 rounded-full transition-colors cursor-pointer
					   {player.shuffled ? 'text-accent bg-accent/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}"
				title="Shuffle"
				aria-label="Toggle shuffle"
			>
				<Icon name="shuffle" class="w-4 h-4" />
			</button>
			<button
				onclick={() => player.cycleRepeat()}
				class="p-2 rounded-full transition-colors cursor-pointer
					   {player.repeat !== 'off' ? 'text-accent bg-accent/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}"
				title="Repeat"
				aria-label="Cycle repeat"
			>
				<Icon name={player.repeat === 'one' ? 'repeat-one' : 'repeat'} class="w-4 h-4" />
			</button>
			<button
				onclick={() => player.toggleQueue()}
				class="text-gray-500 hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-white/5 ml-1 sm:hidden"
				aria-label="Close queue"
			>
				<Icon name="close" class="w-4 h-4" />
			</button>
		</div>
	</div>

	<!-- Now Playing card -->
	{#if player.currentTrack}
		<div class="px-4 py-3 flex-shrink-0 border-b border-white/[0.05]"
			style="background: hsla({hue}, 20%, 12%, 0.4);"
		>
			<p class="text-[10px] font-semibold uppercase tracking-widest text-accent/80 mb-2.5 flex items-center gap-2">
				<span class="flex gap-[3px] items-end h-3.5">
					<span class="eq-bar {player.isPlaying ? 'is-playing' : ''}" style="animation-delay: 0s; height: 4px;"></span>
					<span class="eq-bar {player.isPlaying ? 'is-playing' : ''}" style="animation-delay: 0.2s; height: 8px;"></span>
					<span class="eq-bar {player.isPlaying ? 'is-playing' : ''}" style="animation-delay: 0.4s; height: 4px;"></span>
				</span>
				Now Playing
			</p>
			<div class="flex items-center gap-3">
				{#if player.currentTrack.ytMusicId}
					<img
						src={getYTThumbUrl(player.currentTrack.ytMusicId, 'default')}
						alt=""
						class="w-12 h-12 rounded-lg shadow-lg object-cover flex-shrink-0 bg-white/5"
					/>
				{:else}
					<div class="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
						<Icon name="music" class="w-5 h-5 text-gray-600" />
					</div>
				{/if}
				<div class="min-w-0 flex-1">
					<div class="scroll-text is-active" use:scrollText>
						<span class="text-sm font-semibold text-white">{player.currentTrack.title}</span>
					</div>
					<p class="text-xs text-gray-400 truncate mt-0.5">{player.currentTrack.artist}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Upcoming heading -->
	<div class="px-5 pt-3 pb-1.5 flex-shrink-0">
		<p class="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Next Up</p>
	</div>

	<!-- Queue list -->
	<div class="overflow-y-auto flex-1 scrollbar-thin">
		{#if player.upcomingTracks.length === 0}
			<div class="px-5 py-12 text-center">
				<Icon name="queue" class="w-8 h-8 text-gray-700 mx-auto mb-3" />
				<p class="text-sm text-gray-600">No upcoming tracks</p>
				<p class="text-xs text-gray-700 mt-1">Play something to build your queue</p>
			</div>
		{:else}
			{#each player.upcomingTracks as track, i (track._qid)}
				<div
					class="flex items-center gap-2.5 px-4 py-2 hover:bg-white/[0.04] transition-colors group
						{dragOverIndex === i && dragIndex !== null ? 'border-t-2 border-accent bg-accent/5' : 'border-t border-transparent'}"
					role="listitem"
					draggable="true"
					ondragstart={(e) => { e.dataTransfer?.setData('text/plain', ''); onDragStart(i); }}
					ondragover={(e) => { e.preventDefault(); onDragOver(i); }}
					ondrop={(e) => { e.preventDefault(); onDrop(i); }}
					ondragend={onDragEnd}
				>
					<!-- Drag handle + index -->
					<div class="flex items-center gap-0.5 flex-shrink-0 w-8">
						<span
							class="text-gray-700 group-hover:text-gray-400 cursor-grab active:cursor-grabbing"
							aria-hidden="true"
						>
							<Icon name="drag-handle" class="w-3.5 h-3.5" />
						</span>
						<span class="text-[10px] text-gray-600 font-mono tabular-nums">{i + 1}</span>
					</div>

					<!-- Thumbnail -->
					{#if track.ytMusicId}
						<img
							src={getYTThumbUrl(track.ytMusicId, 'default')}
							alt=""
							class="w-9 h-9 rounded object-cover flex-shrink-0 bg-white/5"
							loading="lazy"
						/>
					{:else}
						<div class="w-9 h-9 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
							<Icon name="music" class="w-3.5 h-3.5 text-gray-600" />
						</div>
					{/if}

					<!-- Track info -->
					<button
						onclick={() => player.jumpTo(player.currentIndex + 1 + i)}
						class="flex-1 min-w-0 text-left cursor-pointer"
					>
						<p class="text-[13px] text-gray-300 truncate group-hover:text-white transition-colors">{track.title}</p>
						<p class="text-[11px] text-gray-600 truncate">{track.artist}</p>
					</button>

					<!-- Remove button -->
					<button
						onclick={() => player.removeFromQueue(player.currentIndex + 1 + i)}
						class="text-gray-700 hover:text-red-400 transition-all cursor-pointer p-1.5 opacity-0 group-hover:opacity-100 flex-shrink-0 rounded-full hover:bg-white/[0.06]"
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
