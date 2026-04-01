<!-- src/lib/components/ListenLinks.svelte -->
<script lang="ts">
	let {
		spotifyId,
		ytMusicId = '',
		title,
		artist
	}: { spotifyId: string; ytMusicId?: string; title: string; artist: string } = $props();

	const spotifyUrl = $derived(spotifyId ? `https://open.spotify.com/track/${spotifyId}` : '');

	const hasDirectYtm = $derived(!!ytMusicId);

	const ytmUrl = $derived(
		ytMusicId
			? `https://music.youtube.com/watch?v=${ytMusicId}`
			: `https://music.youtube.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`
	);

	const ytmLabel = $derived(
		hasDirectYtm ? `Play on YouTube Music: ${title}` : `Search YouTube Music: ${title}`
	);
</script>

<div class="flex items-center gap-2">
	{#if spotifyUrl}
		<a
			href={spotifyUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="text-accent/70 hover:text-accent transition-colors"
			title="Open in Spotify"
			aria-label="Listen on Spotify: {title}"
		>
			<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521
					17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779
					-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6
					11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239
					-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6
					-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24
					8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381
					4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599
					-1.559.3z"
				/>
			</svg>
		</a>
	{/if}
	<a
		href={ytmUrl}
		target="_blank"
		rel="noopener noreferrer"
		class="transition-colors {hasDirectYtm
			? 'text-accent-red/80 hover:text-accent-red'
			: 'text-accent-red/40 hover:text-accent-red/70'}"
		title={hasDirectYtm ? 'Play on YouTube Music' : 'Search on YouTube Music'}
		aria-label={ytmLabel}
	>
		<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
			<path
				d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376
				12-12S18.624 0 12 0zm0 21.6c-5.292 0-9.6-4.308-9.6-9.6S6.708
				2.4 12 2.4s9.6 4.308 9.6 9.6-4.308 9.6-9.6 9.6zM9.6
				16.8 16.8 12 9.6 7.2v9.6z"
			/>
		</svg>
	</a>
</div>