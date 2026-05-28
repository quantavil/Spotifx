// tests/lib/favorites.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create a new instance for testing to avoid global state interference
// We need to export FavoritesState or mock the module.
// For now, we'll just test the logic by mocking localStorage.

describe('FavoritesState migration', () => {
	const STORAGE_KEY = 'spotifx-favorites-v1';
	const LEGACY_KEY = 'spotifx-favorites';

	const localStorageMock = (() => {
		let store: Record<string, string> = {};
		return {
			getItem: (key: string) => store[key] || null,
			setItem: (key: string, value: string) => { store[key] = value.toString(); },
			clear: () => { store = {}; },
			removeItem: (key: string) => { delete store[key]; }
		};
	})();

	beforeEach(() => {
		vi.stubGlobal('localStorage', localStorageMock);
		localStorage.clear();
	});

	it('should migrate legacy favorites to v1', async () => {
		localStorage.setItem(LEGACY_KEY, JSON.stringify(['id1', 'id2']));
		
		// Import favorites after setting up localStorage
		const { favorites } = await import('../../src/lib/stores/favorites.svelte');
		
		// Wait for next tick if there are effects, but constructor is synchronous
		expect(favorites.has('id1')).toBe(true);
		expect(favorites.has('id2')).toBe(true);
		expect(favorites.count).toBe(2);
		
		// Verify migration in localStorage
		const v1 = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
		expect(v1.v).toBe(1);
		expect(v1.d).toContain('id1');
		expect(v1.d).toContain('id2');
	});
});
