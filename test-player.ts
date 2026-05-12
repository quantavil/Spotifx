import { player } from './src/lib/stores/player.svelte.ts';

const track = { ytMusicId: '123', title: 'Test', artist: 'Test' };
player.playTrack(track, [track]);
console.log('visible:', player.visible);
console.log('queue:', player.queue.length);
