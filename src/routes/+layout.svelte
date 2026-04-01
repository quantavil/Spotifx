<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import CountrySelector from '$lib/components/CountrySelector.svelte';
	import MusicPlayer from '$lib/components/MusicPlayer.svelte';
	import { player } from '$lib/stores/player.svelte';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<header class="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-white/10">
		<div class="max-w-6xl mx-auto px-4 py-3">
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
			</div>
			<CountrySelector active={page.params?.country ?? 'global'} />
		</div>
	</header>

	<main class="flex-1 max-w-6xl mx-auto px-4 py-6 w-full {player.visible ? 'pb-24 sm:pb-20' : ''}">
		{@render children()}
	</main>

	<footer class="border-t border-white/10 py-6 text-center text-xs text-gray-600 {player.visible ? 'mb-16' : ''}">
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

<MusicPlayer />