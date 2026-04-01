// src/lib/stores/mediaSession.ts
import type { Track } from '$lib/types';

function hasAPI(): boolean {
	return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

export function updateMediaMetadata(track: Track): void {
	if (!hasAPI()) return;
	navigator.mediaSession.metadata = new MediaMetadata({
		title: track.title,
		artist: track.artist,
		album: 'Spotify Weekly Chart',
		artwork: track.ytMusicId
			? [
					{ src: `https://i.ytimg.com/vi/${track.ytMusicId}/default.jpg`, sizes: '120x90', type: 'image/jpeg' },
					{ src: `https://i.ytimg.com/vi/${track.ytMusicId}/mqdefault.jpg`, sizes: '320x180', type: 'image/jpeg' },
					{ src: `https://i.ytimg.com/vi/${track.ytMusicId}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' }
				]
			: []
	});
}

export function updatePlaybackState(playing: boolean): void {
	if (!hasAPI()) return;
	navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

export function updatePositionState(currentTime: number, duration: number): void {
	if (!hasAPI() || duration <= 0) return;
	try {
		navigator.mediaSession.setPositionState({
			duration,
			playbackRate: 1,
			position: Math.min(currentTime, duration)
		});
	} catch { /* invalid state — ignore */ }
}

export function setupMediaHandlers(callbacks: {
	play: () => void;
	pause: () => void;
	prev: () => void;
	next: () => void;
	seekTo: (time: number) => void;
}): void {
	if (!hasAPI()) return;
	navigator.mediaSession.setActionHandler('play', callbacks.play);
	navigator.mediaSession.setActionHandler('pause', callbacks.pause);
	navigator.mediaSession.setActionHandler('previoustrack', callbacks.prev);
	navigator.mediaSession.setActionHandler('nexttrack', callbacks.next);
	navigator.mediaSession.setActionHandler('seekto', (details) => {
		if (details.seekTime != null) callbacks.seekTo(details.seekTime);
	});
}