<!-- src/lib/components/Toast.svelte -->
<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';
	import { fly, fade } from 'svelte/transition';
</script>

{#if toast.visible}
	<div
		class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] bg-white/10 backdrop-blur-lg
			   text-white text-sm px-5 py-2.5 rounded-full shadow-lg border border-white/10
			   pointer-events-none select-none"
		in:fly={{ y: 20, duration: 200 }}
		out:fade={{ duration: 150 }}
	>
		{toast.message}
	</div>
{/if}