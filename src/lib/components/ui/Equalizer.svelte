<script lang="ts">
	let { isPlaying, class: className = "flex gap-[3px] items-end h-3.5" }: { isPlaying: boolean; class?: string } = $props();
</script>

<div class={className}>
	<div class="eq-bar {isPlaying ? 'is-playing' : ''}" style="animation-delay: 0s; height: 4px;"></div>
	<div class="eq-bar {isPlaying ? 'is-playing' : ''}" style="animation-delay: 0.2s; height: 8px;"></div>
	<div class="eq-bar {isPlaying ? 'is-playing' : ''}" style="animation-delay: 0.4s; height: 4px;"></div>
</div>
