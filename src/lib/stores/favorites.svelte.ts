// src/lib/stores/favorites.svelte.ts

class FavoritesState {
	private _ids = $state<Record<string, boolean>>({});

	count = $derived.by(() => Object.keys(this._ids).length);

	constructor() {
		if (typeof window === 'undefined') return;
		try {
			const raw = localStorage.getItem('spotifx-favorites');
			if (raw) {
				const arr = JSON.parse(raw) as string[];
				if (Array.isArray(arr)) {
					const map: Record<string, boolean> = {};
					for (const id of arr) map[id] = true;
					this._ids = map;
				}
			}
		} catch { /* corrupted — ignore */ }
	}

	has(id: string): boolean {
		return !!this._ids[id];
	}

	toggle(id: string): boolean {
		if (this._ids[id]) {
			const { [id]: _, ...rest } = this._ids;
			this._ids = rest;
			this._save();
			return false;
		} else {
			this._ids = { ...this._ids, [id]: true };
			this._save();
			return true;
		}
	}

	private _save() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem('spotifx-favorites', JSON.stringify(Object.keys(this._ids)));
		} catch { /* quota — ignore */ }
	}
}

export const favorites = new FavoritesState();