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
	<div class="panels-row" class:desktop-queue-closed={!player.queueOpen}>
		<!-- Left Panel -->
		<div
			class="left-panel scrollbar-thin"
			class:full-screen-open={player.fullScreenOpen}
			class:queue-open-mobile={player.queueOpen}
			style="--dynamic-hue: {player.hue};"
		>
			{#if player.fullScreenOpen}
				<NowPlayingFull />
			{/if}
			<header class="border-b border-white/5 bg-surface/20 flex-shrink-0">
				<div class="max-w-6xl mx-auto px-4 sm:px-5 py-2.5 w-full">
					<div class="flex items-center justify-between gap-4">
						<a
							href="/chart/global"
							class="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
						>
							<svg viewBox="0 0 32 32" class="w-6 h-6 flex-shrink-0" aria-hidden="true">
								<rect width="32" height="32" rx="6" fill="#1DB954" />
								<path d="M8 22V14h4v8H8zm6-10v10h4V12h-4zm6-4v14h4V8h-4z" fill="white" />
							</svg>
							<span class="text-base font-bold text-white leading-none">Spotifx</span>
						</a>

						<div class="flex-1 min-w-0 max-w-md">
							<CountrySelector active={page.params?.country ?? 'global'} />
						</div>

						<button
							onclick={() => player.toggleShortcuts()}
							class="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
								   bg-white/5 border border-white/[0.06] text-[10px] text-gray-500
								   hover:text-gray-300 hover:border-white/15 transition-colors cursor-pointer"
							title="Keyboard shortcuts"
						>
							<kbd class="font-mono">?</kbd>
							<span>Shortcuts</span>
						</button>
					</div>
				</div>
			</header>

			<main class="flex-1 max-w-6xl mx-auto px-4 sm:px-5 py-5 w-full">
				{@render children()}
			</main>

		</div>

		<!-- Right Panel: Queue (Desktop only) -->
		{#if player.queueOpen}
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
		position: relative;
		background-color: var(--color-surface);
		border-radius: 8px;
		overflow-y: auto;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.left-panel.full-screen-open {
		overflow-y: hidden;
	}

	@media (max-width: 639px) {
		.left-panel.queue-open-mobile {
			overflow-y: hidden;
		}
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