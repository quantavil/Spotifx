<!-- src/routes/+error.svelte -->
<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} · Spotifx</title>
</svelte:head>

<div class="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
	<p class="text-7xl font-black text-gray-800 mb-2 font-mono">{page.status}</p>
	<p class="text-lg text-gray-400 mb-8">{page.error?.message ?? 'Page not found'}</p>
	<a
		href="/chart/global"
		class="px-5 py-2.5 rounded-full bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity"
	>
		Back to Charts
	</a>
</div>