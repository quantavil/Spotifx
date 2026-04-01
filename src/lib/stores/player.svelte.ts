// src/lib/stores/player.svelte.ts
import type { Track } from '$lib/types';

function fisherYates<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export type RepeatMode = 'off' | 'all' | 'one';

// ── localStorage helpers (SSR-safe) ──

function loadPref<T>(key: string, fallback: T, valid?: T[]): T {
	if (typeof window === 'undefined') return fallback;
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return fallback;
		let value: T;
		if (typeof fallback === 'number') {
			const n = Number(raw);
			value = (isNaN(n) ? fallback : n) as T;
		} else if (typeof fallback === 'boolean') {
			value = (raw === 'true') as T;
		} else {
			value = raw as T;
		}
		if (valid && !valid.includes(value)) return fallback;
		return value;
	} catch {
		return fallback;
	}
}

function savePref(key: string, value: string | number | boolean): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(key, String(value));
	} catch {
		/* quota exceeded or blocked — ignore */
	}
}

class PlayerState {
	queue = $state<Track[]>([]);
	currentIndex = $state(0);
	isPlaying = $state(false);
	shuffled = $state(loadPref('spotifx-shuffle', false));
	repeat = $state<RepeatMode>(loadPref<RepeatMode>('spotifx-repeat', 'off', ['off', 'all', 'one']));
	currentTime = $state(0);
	duration = $state(0);
	volume = $state(loadPref('spotifx-volume', 80));
	visible = $state(false);
	queueOpen = $state(false);

	currentTrack = $derived.by(() => this.queue[this.currentIndex] ?? null);
	progress = $derived.by(() =>
		this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0
	);
	hasNext = $derived.by(() => {
		if (this.repeat !== 'off') return this.queue.length > 0;
		return this.currentIndex < this.queue.length - 1;
	});
	hasPrev = $derived.by(() => {
		if (this.repeat === 'all') return this.queue.length > 0;
		return this.currentIndex > 0 || this.currentTime > 3;
	});
	upcomingTracks = $derived.by(() =>
		this.queue.slice(this.currentIndex + 1)
	);

	// Callbacks — wired by MusicPlayer on mount
	_onPlay: ((videoId: string) => void) | null = null;
	_onPause: (() => void) | null = null;
	_onResume: (() => void) | null = null;
	_onSeek: ((seconds: number) => void) | null = null;
	_onVolume: ((vol: number) => void) | null = null;

	playTrack(track: Track, allTracks: Track[]) {
		const playable = allTracks.filter((t) => t.ytMusicId);
		if (!track.ytMusicId || playable.length === 0) return;

		if (this.shuffled) {
			const rest = playable.filter((t) => t.ytMusicId !== track.ytMusicId);
			this.queue = [track, ...fisherYates(rest)];
			this.currentIndex = 0;
		} else {
			this.queue = playable;
			this.currentIndex = playable.findIndex((t) => t.ytMusicId === track.ytMusicId);
			if (this.currentIndex === -1) this.currentIndex = 0;
		}

		this._loadCurrent();
	}

	playAll(tracks: Track[], doShuffle = false) {
		const playable = tracks.filter((t) => t.ytMusicId);
		if (playable.length === 0) return;

		this.shuffled = doShuffle;
		savePref('spotifx-shuffle', doShuffle);
		this.queue = doShuffle ? fisherYates(playable) : [...playable];
		this.currentIndex = 0;
		this._loadCurrent();
	}

	togglePlay() {
		if (this.isPlaying) {
			this.isPlaying = false;
			this._onPause?.();
		} else if (this.currentTrack) {
			this.isPlaying = true;
			this._onResume?.();
		}
	}

	next() {
		if (this.queue.length === 0) return;

		if (this.repeat === 'one') {
			this._loadCurrent();
			return;
		}

		if (this.currentIndex < this.queue.length - 1) {
			this.currentIndex++;
		} else if (this.repeat === 'all') {
			this.currentIndex = 0;
		} else {
			this.isPlaying = false;
			return;
		}

		this._loadCurrent();
	}

	prev() {
		if (this.queue.length === 0) return;

		if (this.currentTime > 3) {
			this._onSeek?.(0);
			this.currentTime = 0;
			return;
		}

		if (this.currentIndex > 0) {
			this.currentIndex--;
		} else if (this.repeat === 'all') {
			this.currentIndex = this.queue.length - 1;
		} else {
			return;
		}

		this._loadCurrent();
	}

	toggleShuffle() {
		this.shuffled = !this.shuffled;
		savePref('spotifx-shuffle', this.shuffled);
		if (!this.currentTrack) return;

		const current = this.currentTrack;
		if (this.shuffled) {
			const rest = this.queue.filter((_, i) => i !== this.currentIndex);
			this.queue = [current, ...fisherYates(rest)];
			this.currentIndex = 0;
		} else {
			const sorted = [...this.queue].sort((a, b) => a.rank - b.rank);
			this.queue = sorted;
			this.currentIndex = sorted.findIndex((t) => t.ytMusicId === current.ytMusicId);
			if (this.currentIndex === -1) this.currentIndex = 0;
		}
	}

	cycleRepeat() {
		const modes: RepeatMode[] = ['off', 'all', 'one'];
		const idx = modes.indexOf(this.repeat);
		this.repeat = modes[(idx + 1) % modes.length];
		savePref('spotifx-repeat', this.repeat);
	}

	seek(fraction: number) {
		const time = fraction * this.duration;
		this.currentTime = time;
		this._onSeek?.(time);
	}

	setVolume(v: number) {
		this.volume = Math.max(0, Math.min(100, v));
		this._onVolume?.(this.volume);
		savePref('spotifx-volume', this.volume);
	}

	close() {
		this.isPlaying = false;
		this._onPause?.();
		this.visible = false;
		this.queueOpen = false;
		this.queue = [];
		this.currentIndex = 0;
		this.currentTime = 0;
		this.duration = 0;
	}

	toggleQueue() {
		this.queueOpen = !this.queueOpen;
	}

	isCurrentTrack(track: Track): boolean {
		return (
			!!track.ytMusicId && !!this.currentTrack && this.currentTrack.ytMusicId === track.ytMusicId
		);
	}

	// ── Queue manipulation ──

	jumpTo(queueIndex: number) {
		if (queueIndex < 0 || queueIndex >= this.queue.length) return;
		this.currentIndex = queueIndex;
		this._loadCurrent();
	}

	removeFromQueue(queueIndex: number) {
		if (queueIndex < 0 || queueIndex >= this.queue.length) return;
		if (queueIndex === this.currentIndex) return; // can't remove currently playing

		this.queue.splice(queueIndex, 1);
		// adjust currentIndex if we removed something before it
		if (queueIndex < this.currentIndex) {
			this.currentIndex--;
		}
	}

	reorder(fromIndex: number, toIndex: number) {
		if (fromIndex === toIndex) return;
		if (fromIndex < 0 || fromIndex >= this.queue.length) return;
		if (toIndex < 0 || toIndex >= this.queue.length) return;

		const [item] = this.queue.splice(fromIndex, 1);
		this.queue.splice(toIndex, 0, item);

		// adjust currentIndex to follow the currently-playing track
		if (this.currentIndex === fromIndex) {
			this.currentIndex = toIndex;
		} else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
			this.currentIndex--;
		} else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
			this.currentIndex++;
		}
	}

	_loadCurrent() {
		const track = this.currentTrack;
		if (!track) return;
		this.visible = true;
		this.isPlaying = true;
		this.currentTime = 0;
		this.duration = 0;
		this._onPlay?.(track.ytMusicId);
	}
}

export const player = new PlayerState();