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
	import { trackToHue } from '$lib/utils';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<div class="app-shell">
	<!-- Panels row: left content + right queue -->
	<div class="panels-row" class:desktop-queue-closed={!player.desktopQueueOpen}>
		<!-- Left Panel -->
		<div class="left-panel scrollbar-thin" style="--dynamic-hue: {player.hue};">
			<header class="sticky top-0 z-10 backdrop-blur-xl bg-surface/80">
				<div class="max-w-6xl mx-auto px-4 sm:px-5 py-3 w-full">
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
								<span class="text-[11px] text-gray-500 -mt-0.5 block"
									>Weekly streaming charts</span
								>
							</div>
						</a>

						<button
							onclick={() => player.toggleShortcuts()}
							class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
								   bg-white/5 border border-white/[0.06] text-[11px] text-gray-500
								   hover:text-gray-300 hover:border-white/15 transition-colors cursor-pointer"
							title="Keyboard shortcuts"
						>
							<kbd class="font-mono">?</kbd>
							<span>Shortcuts</span>
						</button>
					</div>
					<CountrySelector active={page.params?.country ?? 'global'} />
				</div>
			</header>

			<main class="flex-1 max-w-6xl mx-auto px-4 sm:px-5 py-5 w-full">
				{@render children()}
			</main>

			<footer class="py-5 text-center text-xs text-gray-600">
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

		<!-- Right Panel: Queue (Desktop only) -->
		{#if player.desktopQueueOpen}
		<div class="right-panel hidden sm:flex flex-col">
			<QueuePanel isDesktop={true} />
		</div>
		{/if}
	</div>

	<!-- Mobile Queue Overlay -->
	<div class="sm:hidden">
		<QueuePanel isDesktop={false} />
	</div>

	<!-- Player Bar: docked at bottom, spans full width -->
	<MusicPlayer />
</div>

<NowPlayingFull />
<ShortcutsModal />
<Toast />

<style>
	.app-shell {
		display: grid;
		grid-template-rows: 1fr auto;
		height: 100vh;
		height: 100dvh;
		padding: 8px 8px 0;
		gap: 2px 0;
		background: var(--color-shell);
	}

	.panels-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 6px;
		min-height: 0;
	}

	.left-panel {
		background-color: var(--color-surface);
		border-radius: 8px;
		overflow-y: auto;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.right-panel {
		background-color: var(--color-surface);
		border-radius: 8px;
		overflow: hidden;
		min-height: 0;
	}

	@media (min-width: 640px) {
		.panels-row {
			grid-template-columns: 1fr 22rem;
		}
	}

	@media (max-width: 639px) {
		.app-shell {
			padding: 0;
		}
		.left-panel {
			border-radius: 0;
		}
	}
</style>s-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 6px;
		min-height: 0;
	}

	.left-panel {
		background-color: var(--color-surface);
		border-radius: 8px;
		overflow-y: auto;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.right-panel {
		background-color: var(--color-surface);
		border-radius: 8px;
		overflow: hidden;
		min-height: 0;
	}

	@media (min-width: 640px) {
		.panels-row {
			grid-template-columns: 1fr 22rem;
		}
		.panels-row.desktop-queue-closed {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 639px) {
		.app-shell {
			padding: 0;
		}
		.left-panel {
			border-radius: 0;
		}
	}
</style>