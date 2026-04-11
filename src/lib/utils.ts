// src/lib/utils.ts
export function formatNumber(n: number): string {
	return n.toLocaleString('en-US');
}

export function formatCompact(n: number): string {
	if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
	return n.toLocaleString('en-US');
}

export interface TextPart {
	text: string;
	match: boolean;
}

export function highlightText(text: string, query: string): TextPart[] {
	if (!query.trim()) return [{ text, match: false }];
	const lower = text.toLowerCase();
	const qLower = query.toLowerCase().trim();
	const parts: TextPart[] = [];
	let lastIdx = 0;
	let idx = lower.indexOf(qLower);
	while (idx !== -1) {
		if (idx > lastIdx) parts.push({ text: text.slice(lastIdx, idx), match: false });
		parts.push({ text: text.slice(idx, idx + qLower.length), match: true });
		lastIdx = idx + qLower.length;
		idx = lower.indexOf(qLower, lastIdx);
	}
	if (lastIdx < text.length) parts.push({ text: text.slice(lastIdx), match: false });
	if (parts.length === 0) parts.push({ text, match: false });
	return parts;
}

export function formatTime(s: number): string {
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60);
	return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function getYTThumbUrl(id: string, size: 'default' | 'mqdefault' | 'hqdefault' = 'mqdefault'): string {
	return `https://i.ytimg.com/vi/${id}/${size}.jpg`;
}

/** Generate a consistent hue (0-359) from artist+title for dynamic gradients */
export function trackToHue(artist: string, title: string): number {
	const str = `${artist}${title}`.toLowerCase();
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
		hash |= 0;
	}
	return ((hash % 360) + 360) % 360;
}

export function fisherYates<T>(arr: T[]): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export function loadPref<T>(key: string, fallback: T, valid?: T[]): T {
	if (typeof window === 'undefined') return fallback;
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return fallback;
		const val = JSON.parse(raw) as T;
		if (valid && !valid.includes(val)) return fallback;
		return val;
	} catch {
		return fallback;
	}
}

export function savePref(key: string, value: any): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch { /* ignore quota */ }
}