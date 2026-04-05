<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { formatTime } from '$lib/utils';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	// DRY CONSTANTS
	const WAVE_AMP = 1.2;
	const WAVE_LEN = 3;
	const WAVE_THICK = 0.25;

	let { seeking = $bindable(false) } = $props();

	let progressBarEl: HTMLDivElement | undefined = $state();
	let hoverTime = $state('');
	let hoverX = $state(0);
	let hovering = $state(false);

	const dynamicAmp = tweened(WAVE_THICK, {
		duration: 400,
		easing: cubicOut
	});

	$effect(() => {
		dynamicAmp.set((player.isPlaying && player.duration > 0) ? WAVE_AMP : WAVE_THICK);
	});

	let waveDataUrl = $derived.by(() => {
		const h = $dynamicAmp;
		const w = WAVE_LEN;
		const s = WAVE_THICK;
		
		const peakY = s / 2;
		const troughY = h - (s / 2);
		const midY = h / 2;
		
		const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}rem' height='${h}rem' viewBox='0 0 ${w} ${h}'><path d='M0,${midY} Q${w/4},${peakY} ${w/2},${midY} T${w},${midY}' fill='none' stroke='black' stroke-width='${s}' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
		return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
	});

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
	class="w-full h-8 flex items-center cursor-pointer group/bar relative touch-none opacity-80 hover:opacity-100 transition-opacity"
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
		class="wavy-bar w-full relative"
		class:playing={player.isPlaying && !seeking && player.duration > 0}
		style="height: {WAVE_AMP}rem; --wave-mask: {waveDataUrl}; --mask-size-x: {WAVE_LEN}rem; --mask-size-y: {$dynamicAmp}rem; --wave-len: {WAVE_LEN}rem;"
	>
		<div
			class="h-full bg-accent transition-[width]"
			class:duration-100={!seeking}
			style="width:{player.progress}%"
		></div>

	</div>

	{#if hovering && player.duration > 0 && !seeking}
		<div
			class="absolute -top-6 bg-black/90 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap font-mono shadow-xl border border-white/5 z-50"
			style="left:{hoverX}px;transform:translateX(-50%)"
		>
			{hoverTime}
		</div>
	{/if}
</div>

<style>
	@keyframes wave-flow {
		from {
			-webkit-mask-position: 0px center;
			mask-position: 0px center;
		}
		to {
			-webkit-mask-position: calc(-1 * var(--wave-len)) center;
			mask-position: calc(-1 * var(--wave-len)) center;
		}
	}

	.wavy-bar {
		background-color: rgba(255, 255, 255, 0.12);
		-webkit-mask-image: var(--wave-mask);
		mask-image: var(--wave-mask);
		-webkit-mask-repeat: repeat-x;
		mask-repeat: repeat-x;
		-webkit-mask-size: var(--mask-size-x) var(--mask-size-y);
		mask-size: var(--mask-size-x) var(--mask-size-y);
	}

	.wavy-bar.playing {
		animation: wave-flow 1.5s linear infinite;
	}
</style>
