// src/lib/stores/favorites.svelte.ts
import { loadPref, savePref } from '$lib/utils';

const STORAGE_KEY = 'spotifx-favorites-v1';
const LEGACY_KEY = 'spotifx-favorites';

class FavoritesState {
	private _ids = $state<Record<string, boolean>>({});

	count = $derived.by(() => Object.keys(this._ids).length);

	constructor() {
		if (typeof window === 'undefined') return;

		// Try v1 first
		const v1 = loadPref<{ v: number; d: string[] } | null>(STORAGE_KEY, null);
		if (v1 && Array.isArray(v1.d)) {
			this._setIds(v1.d);
			return;
		}

		// Migration from legacy
		const legacy = loadPref<string[] | null>(LEGACY_KEY, null);
		if (Array.isArray(legacy)) {
			this._setIds(legacy);
			this._save(); // Migrate to v1
		}
	}

	private _setIds(ids: string[]) {
		const map: Record<string, boolean> = {};
		for (const id of ids) map[id] = true;
		this._ids = map;
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
		savePref(STORAGE_KEY, { v: 1, d: Object.keys(this._ids) });
	}
}

export const favorites = new FavoritesState();