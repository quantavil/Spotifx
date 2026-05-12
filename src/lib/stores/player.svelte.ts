import type { Track } from '$lib/types';
import { toast } from '$lib/stores/toast.svelte';
import { updateMediaMetadata, updatePlaybackState } from '$lib/stores/mediaSession';
import { fisherYates, loadPref, savePref, trackToHue } from '$lib/utils';

export interface QueueEntry extends Track {
	_qid: number;
	isManual?: boolean;
}

let _qid = 0;

function toEntry(track: Track): QueueEntry {
	return { ...track, _qid: _qid++ };
}

function toEntries(tracks: Track[]): QueueEntry[] {
	return tracks.map(toEntry);
}

export type RepeatMode = 'off' | 'all' | 'one';

class PlayerState {
	queue = $state<QueueEntry[]>([]);
	originalQueue = $state<QueueEntry[]>([]);
	currentIndex = $state(0);
	isPlaying = $state(false);
	buffering = $state(false);
	shuffled = $state(loadPref('spotifx-shuffle', false));
	repeat = $state<RepeatMode>(
		loadPref<RepeatMode>('spotifx-repeat', 'off', ['off', 'all', 'one'])
	);
	currentTime = $state(0);
	duration = $state(0);
	volume = $state(loadPref('spotifx-volume', 80));
	visible = $state(false);
	queueOpen = $state(false);
	fullScreenOpen = $state(false);
	shortcutsOpen = $state(false);
	contextHue = $state<number | null>(null);

	currentTrack = $derived.by(() => this.queue[this.currentIndex] ?? null);
	hue = $derived.by(() => {
		if (this.currentTrack) {
			return trackToHue(this.currentTrack.artist, this.currentTrack.title);
		}
		return this.contextHue ?? 140;
	});
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
	upcomingTracks = $derived.by(() => this.queue.slice(this.currentIndex + 1));

	// Callbacks — wired by MusicPlayer on mount
	_onPlay: ((videoId: string) => void) | null = null;
	_onPause: (() => void) | null = null;
	_onResume: (() => void) | null = null;
	_onSeek: ((seconds: number) => void) | null = null;
	_onVolume: ((vol: number) => void) | null = null;

	private _setNewQueue(playable: Track[], startTrack?: Track) {
		this.originalQueue = toEntries(playable);

		if (this.shuffled) {
			if (startTrack) {
				const rest = this.originalQueue.filter((t) => t.ytMusicId !== startTrack.ytMusicId);
				const current = this.originalQueue.find((t) => t.ytMusicId === startTrack.ytMusicId) || toEntry(startTrack);
				this.queue = [current, ...fisherYates(rest)];
			} else {
				this.queue = fisherYates([...this.originalQueue]);
			}
			this.currentIndex = 0;
		} else {
			this.queue = [...this.originalQueue];
			this.currentIndex = startTrack ? this.queue.findIndex((t) => t.ytMusicId === startTrack.ytMusicId) : 0;
			if (this.currentIndex === -1) this.currentIndex = 0;
		}

		this._loadCurrent();
	}

	playTrack(track: Track, allTracks: Track[]) {
		const playable = allTracks.filter((t) => t.ytMusicId);
		if (!track.ytMusicId || playable.length === 0) return;
		this._setNewQueue(playable, track);
	}

	playAll(tracks: Track[], doShuffle = false) {
		const playable = tracks.filter((t) => t.ytMusicId);
		if (playable.length === 0) return;

		this.shuffled = doShuffle;
		savePref('spotifx-shuffle', doShuffle);
		this._setNewQueue(playable);
	}

	private _insertManualTrack(track: Track, insertAt: number, checkExisting: 'move' | 'reject'): boolean {
		if (!track.ytMusicId) return false;

		if (this.queue.length === 0 || !this.visible) {
			this.queue = [{ ...toEntry(track), isManual: true }];
			this.currentIndex = 0;
			this._loadCurrent();
			return true;
		}

		const existingIdx = this.queue.findIndex((t) => t.ytMusicId === track.ytMusicId);
		if (existingIdx !== -1) {
			if (existingIdx === this.currentIndex) return false;
			if (checkExisting === 'reject') return false;
			
			this.queue.splice(existingIdx, 1);
			if (existingIdx < this.currentIndex) this.currentIndex--;
			if (existingIdx < insertAt) insertAt--;
		}

		this.queue.splice(insertAt, 0, { ...toEntry(track), isManual: true });
		return true;
	}

	playNext(track: Track): boolean {
		return this._insertManualTrack(track, this.currentIndex + 1, 'move');
	}

	addToQueue(track: Track): boolean {
		let insertIndex = this.currentIndex + 1;
		while (insertIndex < this.queue.length && this.queue[insertIndex].isManual) {
			insertIndex++;
		}
		return this._insertManualTrack(track, insertIndex, 'reject');
	}

	play() {
		if (!this.isPlaying && this.currentTrack) {
			this.isPlaying = true;
			this._onResume?.();
			updatePlaybackState(true);
		}
	}

	pause() {
		if (this.isPlaying) {
			this.isPlaying = false;
			this._onPause?.();
			updatePlaybackState(false);
		}
	}

	togglePlay() {
		if (this.isPlaying) {
			this.pause();
		} else {
			this.play();
		}
	}

	playOrToggle(track: Track, allTracks?: Track[]) {
		if (this.isCurrentTrack(track)) {
			this.togglePlay();
		} else {
			this.playTrack(track, allTracks ?? [track]);
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
			this.pause();
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

		if (!this.currentTrack) {
			toast.show(this.shuffled ? 'Shuffle on' : 'Shuffle off');
			return;
		}

		const current = this.currentTrack;
		const manuals = this.queue.filter((t, i) => t.isManual && i > this.currentIndex);

		if (this.shuffled) {
			const rest = this.queue.filter((t, i) => i !== this.currentIndex && !t.isManual);
			this.queue = [current, ...manuals, ...fisherYates(rest)];
			this.currentIndex = 0;
		} else {
			if (this.originalQueue.length > 0) {
				const origIdx = this.originalQueue.findIndex((t) => t.ytMusicId === current.ytMusicId);
				if (origIdx !== -1) {
					this.queue = [...this.originalQueue];
					this.currentIndex = origIdx;
					this.queue.splice(this.currentIndex + 1, 0, ...manuals);
				} else {
					this.queue = [current, ...manuals, ...this.originalQueue];
					this.currentIndex = 0;
				}
			}
		}

		toast.show(this.shuffled ? 'Shuffle on' : 'Shuffle off');
	}

	cycleRepeat() {
		const modes: RepeatMode[] = ['off', 'all', 'one'];
		const idx = modes.indexOf(this.repeat);
		this.repeat = modes[(idx + 1) % modes.length];
		savePref('spotifx-repeat', this.repeat);
		const labels = { off: 'Repeat off', all: 'Repeat all', one: 'Repeat one' };
		toast.show(labels[this.repeat]);
	}

	seek(fraction: number) {
		if (this.duration <= 0) return;
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
		updatePlaybackState(false);
		this.visible = false;
		this.queueOpen = false;
		this.fullScreenOpen = false;
		this.queue = [];
		this.currentIndex = 0;
		this.currentTime = 0;
		this.duration = 0;
	}

	toggleQueue() {
		this.queueOpen = !this.queueOpen;
	}

	toggleFullScreen() {
		this.fullScreenOpen = !this.fullScreenOpen;
		if (this.fullScreenOpen) this.queueOpen = false;
	}

	toggleShortcuts() {
		this.shortcutsOpen = !this.shortcutsOpen;
	}

	isCurrentTrack(track: Track): boolean {
		return (
			!!track.ytMusicId &&
			!!this.currentTrack &&
			this.currentTrack.ytMusicId === track.ytMusicId
		);
	}

	jumpTo(queueIndex: number) {
		if (queueIndex < 0 || queueIndex >= this.queue.length) return;
		this.currentIndex = queueIndex;
		this._loadCurrent();
	}

	jumpToEntry(qid: number) {
		const idx = this.queue.findIndex(t => t._qid === qid);
		if (idx !== -1) this.jumpTo(idx);
	}

	removeFromQueue(queueIndex: number) {
		if (queueIndex < 0 || queueIndex >= this.queue.length) return;
		if (queueIndex === this.currentIndex) return;

		const [removed] = this.queue.splice(queueIndex, 1);
		if (queueIndex < this.currentIndex) {
			this.currentIndex--;
		}

		if (!removed.isManual) {
			const origIdx = this.originalQueue.findIndex(t => t._qid === removed._qid);
			if (origIdx !== -1) this.originalQueue.splice(origIdx, 1);
		}
	}

	removeEntry(qid: number) {
		const idx = this.queue.findIndex(t => t._qid === qid);
		if (idx !== -1) this.removeFromQueue(idx);
	}

	clearQueue() {
		if (this.queue.length > this.currentIndex + 1) {
			const removed = this.queue.splice(this.currentIndex + 1);
			for (const r of removed) {
				if (!r.isManual) {
					const origIdx = this.originalQueue.findIndex(t => t._qid === r._qid);
					if (origIdx !== -1) this.originalQueue.splice(origIdx, 1);
				}
			}
		}
	}

	reorder(fromIndex: number, toIndex: number) {
		if (fromIndex === toIndex) return;
		if (fromIndex < 0 || fromIndex >= this.queue.length) return;
		if (toIndex < 0 || toIndex >= this.queue.length) return;

		const [item] = this.queue.splice(fromIndex, 1);
		this.queue.splice(toIndex, 0, item);

		if (this.currentIndex === fromIndex) {
			this.currentIndex = toIndex;
		} else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
			this.currentIndex--;
		} else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
			this.currentIndex++;
		}
	}

	_loadCurrent() {
		const track = this.queue[this.currentIndex];
		if (!track) return;
		this.visible = true;
		this.isPlaying = true;
		this.buffering = true;
		this.currentTime = 0;
		this.duration = 0;
		this._onPlay?.(track.ytMusicId);
		updateMediaMetadata(track);
		updatePlaybackState(true);
	}
}

export const player = new PlayerState();