<!-- src/lib/components/StatCard.svelte -->
<script lang="ts">
	let {
		label,
		children
	}: { label: string; children?: import('svelte').Snippet } = $props();
</script>

<div class="bg-surface-alt rounded-lg border border-white/10 p-4">
	<p class="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1">{label}</p>
	{@render children?.()}
</div>
