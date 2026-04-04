<!-- src/lib/components/ShortcutsModal.svelte -->
<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { fade } from 'svelte/transition';
	import Icon from './Icon.svelte';

	const shortcuts = [
		{ key: 'Space', action: 'Play / Pause' },
		{ key: '←', action: 'Seek back 10s' },
		{ key: '→', action: 'Seek forward 10s' },
		{ key: '↑', action: 'Volume up' },
		{ key: '↓', action: 'Volume down' },
		{ key: 'M', action: 'Mute / Unmute' },
		{ key: 'N', action: 'Next track' },
		{ key: 'P', action: 'Previous track' },
		{ key: 'Q', action: 'Toggle queue' },
		{ key: 'F', action: 'Fullscreen player' },
		{ key: '/', action: 'Focus search' },
		{ key: '?', action: 'Show shortcuts' }
	];
</script>

{#if player.shortcutsOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
		transition:fade={{ duration: 150 }}
		onclick={() => player.toggleShortcuts()}
		onkeydown={(e) => { if (e.key === 'Escape') player.toggleShortcuts(); }}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="bg-surface-alt border border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-white">Keyboard Shortcuts</h2>
				<button
					onclick={() => player.toggleShortcuts()}
					class="text-gray-500 hover:text-white transition-colors cursor-pointer p-1"
					aria-label="Close shortcuts"
				>
					<Icon name="close" />
				</button>
			</div>

			<div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5">
				{#each shortcuts as s}
					<kbd class="inline-flex items-center justify-center px-2 py-1 rounded border border-white/10
							   bg-white/5 text-xs text-gray-300 font-mono min-w-[2.5rem] text-center">
						{s.key}
					</kbd>
					<span class="text-sm text-gray-400 flex items-center">{s.action}</span>
				{/each}
			</div>

			<p class="text-[11px] text-gray-600 mt-5 text-center">
				Shortcuts work when no input is focused
			</p>
		</div>
	</div>
{/if}