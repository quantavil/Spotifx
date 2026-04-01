// scripts/test-ytmusic.ts
// Run: bun run scripts/test-ytmusic.ts

import YTMusicModule from 'ytmusic-api';

// Handle CJS/ESM default export mismatch
const YTMusic = (YTMusicModule as any).default || YTMusicModule;

console.log('Import type:', typeof YTMusic);
console.log('Constructor name:', YTMusic?.name || 'unknown');

try {
	const yt = new YTMusic();
	console.log('✅ Constructor works');

	await yt.initialize();
	console.log('✅ Initialized');

	const results = await yt.searchSongs('Kendrick Lamar Not Like Us');
	console.log(`✅ Search returned ${results.length} results`);

	if (results[0]) {
		console.log('   First result:', {
			videoId: results[0].videoId,
			name: results[0].name,
			artist: results[0].artist?.name || results[0].artists?.[0]?.name || 'unknown'
		});
	} else {
		console.log('⚠️  No results returned');
	}
} catch (err) {
	console.error('❌ Failed:', err);
}