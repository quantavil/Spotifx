// src/lib/stores/trackMenu.svelte.ts

class TrackMenuState {
	openId = $state<string | null>(null);

	open(id: string) {
		this.openId = id;
	}

	close() {
		this.openId = null;
	}

	isOpen(id: string): boolean {
		return this.openId === id;
	}
}

export const trackMenu = new TrackMenuState();