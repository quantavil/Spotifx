<!-- src/lib/components/Icon.svelte -->
<script lang="ts">
	export type IconName =
		| 'play'
		| 'pause'
		| 'shuffle'
		| 'skip-back'
		| 'skip-forward'
		| 'repeat'
		| 'repeat-one'
		| 'volume-mute'
		| 'volume-low'
		| 'volume-high'
		| 'close'
		| 'queue'
		| 'drag-handle'
		| 'check'
		| 'link'
		| 'music'
		| 'search'
		| 'heart'
		| 'heart-filled'
		| 'chevron-down'
		| 'more-vertical'
		| 'fullscreen';

	let { name, class: cls = 'w-4 h-4' }: { name: IconName; class?: string } = $props();

	const paths: Record<IconName, { d: string; stroke?: boolean }> = {
		play: { d: 'M8 5v14l11-7z' },
		pause: { d: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z' },
		shuffle: {
			d: 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z'
		},
		'skip-back': { d: 'M6 6h2v12H6zm3.5 6l8.5 6V6z' },
		'skip-forward': { d: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z' },
		repeat: { d: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z' },
		'repeat-one': {
			d: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z'
		},
		'volume-mute': {
			d: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z'
		},
		'volume-low': {
			d: 'M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z'
		},
		'volume-high': {
			d: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z'
		},
		close: { d: 'M18 6 6 18M6 6l12 12', stroke: true },
		queue: {
			d: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z'
		},
		'drag-handle': {
			d: 'M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'
		},
		check: { d: 'M5 13l4 4L19 7', stroke: true },
		link: {
			d: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
			stroke: true
		},
		music: {
			d: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'
		},
		search: { d: '', stroke: true },
		heart: {
			d: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
			stroke: true
		},
		'heart-filled': {
			d: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z'
		},
		'chevron-down': { d: 'M6 9l6 6 6-6', stroke: true },
		'more-vertical': {
			d: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'
		},
		fullscreen: {
			d: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z'
		}
	};

	const icon = $derived(paths[name]);
	const isStroke = $derived(icon?.stroke ?? false);
	const isSearch = $derived(name === 'search');
</script>

<svg
	class={cls}
	fill={isStroke ? 'none' : 'currentColor'}
	stroke={isStroke ? 'currentColor' : undefined}
	stroke-width={isStroke ? '2' : undefined}
	stroke-linecap={isStroke ? 'round' : undefined}
	stroke-linejoin={isStroke ? 'round' : undefined}
	viewBox="0 0 24 24"
	aria-hidden="true"
>
	{#if isSearch}
		<circle cx="11" cy="11" r="8" stroke-width="2" />
		<path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round" />
	{:else}
		<path d={icon.d} />
	{/if}
</svg>