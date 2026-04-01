<script lang="ts">
	let { change }: { change: string } = $props();

	const info = $derived.by(() => {
		const c = change.trim();
		if (c === 'NEW') return { text: 'NEW', cls: 'text-rank-new font-bold' };
		if (c === 'RE') return { text: 'RE', cls: 'text-rank-new font-bold' };
		if (c === '0' || c === '' || c === '--') return { text: '—', cls: 'text-gray-600' };

		const num = parseInt(c);
		if (isNaN(num)) return { text: c, cls: 'text-gray-500' };
		if (num > 0) return { text: `▲${num}`, cls: 'text-rank-up' };
		return { text: `▼${Math.abs(num)}`, cls: 'text-rank-down' };
	});
</script>

<span class="text-xs font-mono whitespace-nowrap {info.cls}">
	{info.text}
</span>