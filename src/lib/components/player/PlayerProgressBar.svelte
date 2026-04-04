<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { formatTime } from '$lib/utils';

	let { seeking = $bindable(false) } = $props();

	let progressBarEl: HTMLDivElement | undefined = $state();
	let hoverTime = $state('');
	let hoverX = $state(0);
	let hovering = $state(false);

	function seekFromPointer(e: PointerEvent) {
		if (!progressBarEl || player.duration <= 0) return;
		const rect = progressBarEl.getBoundingClientRect();
		const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		player.currentTime = frac * player.duration;
	}

	function onPointerDown(e: PointerEvent) {
		seeking = true;
		try {
			progressBarEl?.setPointerCapture(e.pointerId);
		} catch {
			/* disconnected element or invalid pointer */
		}
		seekFromPointer(e);
	}

	function onPointerMove(e: PointerEvent) {
		if (seeking) seekFromPointer(e);
	}

	function onPointerUp(e: PointerEvent) {
		if (!seeking) return;
		seeking = false;
		seekFromPointer(e);
		if (player.duration > 0) player._onSeek?.(player.currentTime);
	}

	function onBarHover(e: MouseEvent) {
		if (!progressBarEl || player.duration <= 0) return;
		const rect = progressBarEl.getBoundingClientRect();
		const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		hoverX = e.clientX - rect.left;
		hoverTime = formatTime(frac * player.duration);
		hovering = true;
	}
</script>

<div
	bind:this={progressBarEl}
	class="h-1 bg-white/[0.08] cursor-pointer group/bar relative touch-none hover:h-1.5 transition-all"
	role="slider"
	tabindex={0}
	aria-label="Seek"
	aria-valuenow={Math.round(player.progress)}
	aria-valuemin={0}
	aria-valuemax={100}
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onlostpointercapture={() => (seeking = false)}
	onmousemove={onBarHover}
	onmouseleave={() => (hovering = false)}
>
	<div
		class="h-full bg-accent transition-[width] rounded-r-full"
		class:duration-100={!seeking}
		style="width:{player.progress}%"
	></div>
	<div
		class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg
			   opacity-100 sm:opacity-0 sm:group-hover/bar:opacity-100 transition-opacity pointer-events-none"
		style="left:calc({player.progress}% - 6px)"
	></div>

	{#if hovering && player.duration > 0 && !seeking}
		<div
			class="absolute -top-8 bg-black/90 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap font-mono"
			style="left:{hoverX}px;transform:translateX(-50%)"
		>
			{hoverTime}
		</div>
	{/if}
</div>
