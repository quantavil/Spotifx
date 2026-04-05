<!-- src/lib/components/CountrySelector.svelte -->
<script lang="ts">
	import { countries } from '$lib/config/countries';

	let { active }: { active: string } = $props();
	let navEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (navEl && active) {
			const activeEl = navEl.querySelector<HTMLElement>('[aria-current="page"]');
			activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
		}
	});
</script>

<nav
	bind:this={navEl}
	class="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
	aria-label="Country selector"
>
	{#each countries as country}
		<a
			href="/chart/{country.code}"
			class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
				{active === country.code
				? 'bg-accent text-black shadow-sm shadow-accent/20'
				: 'bg-white/[0.07] text-gray-400 hover:bg-white/[0.12] hover:text-white'}"
			aria-current={active === country.code ? 'page' : undefined}
		>
			{country.name}
		</a>
	{/each}
</nav>