<script lang="ts">
	import { highlightText } from '$lib/utils';
	
	let { text, query }: { text: string; query: string } = $props();
</script>

{#each highlightText(text, query) as part}
	{#if part.match}
		<mark class="bg-accent/25 text-white rounded-sm px-0.5">{part.text}</mark>
	{:else}
		{part.text}
	{/if}
{/each}
