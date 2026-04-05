<!-- src/lib/components/SearchBar.svelte -->
<script lang="ts">
	import Icon from './Icon.svelte';

	let { value = $bindable('') }: { value: string } = $props();
	let inputEl: HTMLInputElement | undefined = $state();

	function handleGlobalKey(e: KeyboardEvent) {
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
			if (e.key === 'Escape') {
				value = '';
				inputEl?.blur();
			}
			return;
		}
		if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
			e.preventDefault();
			inputEl?.focus();
		}
	}
</script>

<svelte:window onkeydown={handleGlobalKey} />

<div class="relative mb-4">
	<Icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
	<input
		bind:this={inputEl}
		bind:value
		type="text"
		placeholder="Search tracks or artists…"
		class="w-full pl-10 pr-16 py-2.5 rounded-full bg-white/[0.07]
			   text-white placeholder-gray-500 text-sm
			   focus:outline-none focus:bg-white/[0.12] focus:ring-1 focus:ring-white/20
			   transition-colors"
	/>
	{#if value}
		<button
			onclick={() => (value = '')}
			class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
			aria-label="Clear search"
		>
			<Icon name="close" />
		</button>
	{:else}
		<kbd
			class="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5
				   rounded border border-white/10 bg-white/5 text-[10px] text-gray-500 font-mono pointer-events-none"
		>
			/
		</kbd>
	{/if}
</div>