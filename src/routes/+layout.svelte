<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import CountrySelector from '$lib/components/charts/CountrySelector.svelte';
	import MusicPlayer from '$lib/components/player/MusicPlayer.svelte';
	import NowPlayingFull from '$lib/components/player/NowPlayingFull.svelte';
	import ShortcutsModal from '$lib/components/ui/ShortcutsModal.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import QueuePanel from '$lib/components/player/QueuePanel.svelte';
	import { player } from '$lib/stores/player.svelte';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<div class="min-h-screen layout-grid pb-24 sm:pb-[5.5rem]">
	<!-- Left Pane: Main Content -->
	<div class="flex flex-col min-w-0 h-full">
		<header class="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-white/10">
			<div class="max-w-6xl mx-auto px-4 py-3 w-full">
				<div class="flex items-center justify-between mb-3">
					<a
						href="/chart/global"
						class="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
					>
						<svg viewBox="0 0 32 32" class="w-7 h-7 flex-shrink-0" aria-hidden="true">
							<rect width="32" height="32" rx="6" fill="#1DB954" />
							<path d="M8 22V14h4v8H8zm6-10v10h4V12h-4zm6-4v14h4V8h-4z" fill="white" />
						</svg>
						<div class="leading-tight">
							<span class="text-lg font-bold text-white block">Spotifx</span>
							<span class="text-[11px] text-gray-500 -mt-0.5 block">Weekly streaming charts</span>
						</div>
					</a>

					<!-- Keyboard shortcuts hint -->
					<button
						onclick={() => player.toggleShortcuts()}
						class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
							   bg-white/5 border border-white/10 text-[11px] text-gray-500
							   hover:text-gray-300 hover:border-white/20 transition-colors cursor-pointer"
						title="Keyboard shortcuts"
					>
						<kbd class="font-mono">?</kbd>
						<span>Shortcuts</span>
					</button>
				</div>
				<CountrySelector active={page.params?.country ?? 'global'} />
			</div>
		</header>

		<main class="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
			{@render children()}
		</main>

		<footer class="border-t border-white/10 py-6 text-center text-xs text-gray-600">
			<p>
				Data from
				<a
					href="https://kworb.net"
					target="_blank"
					rel="noopener noreferrer"
					class="underline hover:text-gray-400 transition-colors">kworb.net</a
				>
				· Streaming data © Spotify · Not affiliated with Spotify AB
			</p>
		</footer>
	</div>

	<!-- Right Pane: Queue Panel (Desktop only, mobile handles its own overlay) -->
	<div class="hidden sm:block right-pane border-l border-white/[0.04] bg-surface-alt/30">
		{#if player.visible || player.queue.length > 0}
			<QueuePanel />
		{:else}
			<div class="flex flex-col items-center justify-center h-full px-6 text-center">
				<svg viewBox="0 0 24 24" class="w-12 h-12 text-gray-700 mb-4" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
				</svg>
				<h3 class="text-base font-semibold text-gray-300 mb-1">Queue Empty</h3>
				<p class="text-sm text-gray-500">Select a track to start playing</p>
			</div>
		{/if}
	</div>
</div>

<MusicPlayer />
<NowPlayingFull />
<ShortcutsModal />
<Toast />

<style>
	.layout-grid {
		display: grid;
		grid-template-columns: 1fr;
		min-height: 100vh;
	}

	@media (min-width: 640px) {
		.layout-grid {
			grid-template-columns: 1fr 24rem;
		}
		
		.right-pane {
			position: sticky;
			top: 0;
			height: 100vh; /* Adjusts to fit, but player bar acts over it or pushes layout? Player bar is fixed at bottom */
			overflow: hidden;
		}
	}
</style>