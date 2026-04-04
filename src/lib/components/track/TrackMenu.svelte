<!-- src/lib/components/TrackMenu.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { trackMenu } from '$lib/stores/trackMenu.svelte';
	import type { Track } from '$lib/types';
	import { portal } from '$lib/actions';
	import Icon from '../ui/Icon.svelte';

	let { track }: { track: Track } = $props();

	let btnEl: HTMLButtonElement | undefined = $state();
	let menuStyle = $state('');

	// Unique ID per component instance for the shared store
	const menuId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
	const open = $derived(trackMenu.isOpen(menuId));
	const isFav = $derived(track.spotifyId ? favorites.has(track.spotifyId) : false);
	const hasYtm = $derived(!!track.ytMusicId);

	function toggle(e: Event) {
		e.stopPropagation();

		if (open) {
			trackMenu.close();
			return;
		}

		// Position the menu
		if (btnEl) {
			const rect = btnEl.getBoundingClientRect();
			const spaceBelow = window.innerHeight - rect.bottom;
			const menuH = 180;
			if (spaceBelow < menuH) {
				menuStyle = `bottom:${window.innerHeight - rect.top + 4}px;right:${window.innerWidth - rect.right}px;`;
			} else {
				menuStyle = `top:${rect.bottom + 4}px;right:${window.innerWidth - rect.right}px;`;
			}
		}

		trackMenu.open(menuId);
	}

	function close() {
		trackMenu.close();
	}

	function handlePlayNext(e: Event) {
		e.stopPropagation();
		const ok = player.playNext(track);
		toast.show(ok ? 'Playing next' : 'Already playing');
		close();
	}

	function handleAddToQueue(e: Event) {
		e.stopPropagation();
		const ok = player.addToQueue(track);
		toast.show(ok ? 'Added to queue' : 'Already in queue');
		close();
	}

	function handleFavorite(e: Event) {
		e.stopPropagation();
		if (!track.spotifyId) return;
		const added = favorites.toggle(track.spotifyId);
		toast.show(added ? 'Added to favorites' : 'Removed from favorites');
		close();
	}

	// Close on outside click / Escape — only when THIS menu is open
	$effect(() => {
		if (!open) return;

		let rafId: number;

		const onClick = (e: Event) => {
			// Don't close if clicking inside the menu itself
			const target = e.target as HTMLElement;
			if (target?.closest?.('[data-track-menu]')) return;
			close();
		};

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close();
		};

		const onScroll = () => close();

		rafId = requestAnimationFrame(() => {
			window.addEventListener('click', onClick);
			window.addEventListener('keydown', onKey);
			window.addEventListener('scroll', onScroll, true);
		});

		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener('click', onClick);
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('scroll', onScroll, true);
		};
	});
</script>

<div class="relative">
	<button
		bind:this={btnEl}
		onclick={toggle}
		class="p-1 -mr-1 rounded text-gray-400 hover:text-white transition-colors cursor-pointer opacity-80 hover:opacity-100"
		aria-label="Track options for {track.title}"
		aria-expanded={open}
	>
		<Icon name="more-vertical" class="w-4 h-4" />
	</button>

	{#if open}
    	<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			data-track-menu
			use:portal
			class="fixed z-[60] bg-surface-alt border border-white/10 rounded-lg shadow-2xl py-1 min-w-[180px]"
			style={menuStyle}
			onclick={(e) => e.stopPropagation()}
		>
			{#if hasYtm}
				<button
					onclick={handlePlayNext}
					class="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer flex items-center gap-3"
				>
					<Icon name="skip-forward" class="w-4 h-4 text-gray-500" />
					Play Next
				</button>
				<button
					onclick={handleAddToQueue}
					class="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer flex items-center gap-3"
				>
					<Icon name="queue" class="w-4 h-4 text-gray-500" />
					Add to Queue
				</button>
				<div class="border-t border-white/5 my-1"></div>
			{/if}

			{#if track.spotifyId}
				<button
					onclick={handleFavorite}
					class="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors cursor-pointer flex items-center gap-3
						   {isFav ? 'text-red-400' : 'text-gray-300 hover:text-white'}"
				>
					<Icon name={isFav ? 'heart-filled' : 'heart'} class="w-4 h-4" />
					{isFav ? 'Remove Favorite' : 'Add to Favorites'}
				</button>
			{/if}

			{#if track.spotifyId}
				<a
					href="https://open.spotify.com/track/{track.spotifyId}"
					target="_blank"
					rel="noopener noreferrer"
					class="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-surface-hover transition-colors flex items-center gap-3"
					onclick={() => close()}
				>
					<Icon name="link" class="w-4 h-4 text-gray-500" />
					Open in Spotify
				</a>
			{/if}

			<a
				href={track.ytMusicId ? `https://music.youtube.com/watch?v=${track.ytMusicId}` : `https://music.youtube.com/search?q=${encodeURIComponent(`${track.artist} ${track.title}`)}`}
				target="_blank"
				rel="noopener noreferrer"
				class="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-surface-hover transition-colors flex items-center gap-3"
				onclick={() => close()}
			>
				<Icon name="link" class="w-4 h-4 text-gray-500" />
				Open in YT Music
			</a>
		</div>
	{/if}
</div>