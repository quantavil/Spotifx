<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { scrollText } from '$lib/actions';
	import TrackThumbnail from '../ui/TrackThumbnail.svelte';
	import Icon from '../ui/Icon.svelte';
</script>

<button
	class="info-btn flex items-center gap-2.5 sm:gap-3 min-w-0 text-left cursor-pointer group/info"
>
	{#key player.currentTrack?.ytMusicId}
		<div class="animate-fade-in flex items-center gap-2.5 sm:gap-3 min-w-0" style="animation-duration:0.25s">
			<div class="relative flex-shrink-0">
				<TrackThumbnail
					track={player.currentTrack}
					quality="default"
					class="w-11 h-11 sm:w-12 sm:h-12 rounded-md object-cover bg-white/5 shadow-md flex-shrink-0"
					iconClass="w-5 h-5 text-gray-600"
				/>
				<div class="absolute inset-0 rounded-md bg-black/0 group-hover/info:bg-black/40 transition-colors flex items-center justify-center">
					<Icon name="fullscreen" class="w-4 h-4 text-white opacity-0 group-hover/info:opacity-100 transition-opacity" />
				</div>
			</div>

			<div class="min-w-0">
				<div class="scroll-text is-active" use:scrollText>
					<span class="text-[13px] sm:text-sm font-semibold text-white group-hover/info:text-accent transition-colors">
						{player.currentTrack?.title ?? ''}
					</span>
				</div>
				<p class="text-[11px] sm:text-xs text-gray-400 truncate">
					{player.currentTrack?.artist ?? ''}
				</p>
			</div>
		</div>
	{/key}
</button>
