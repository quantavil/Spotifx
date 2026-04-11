// tests/lib/utils.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fisherYates, loadPref, savePref, trackToHue } from '../../src/lib/utils';

describe('utils', () => {
	describe('fisherYates', () => {
		it('should return a new array with the same elements', () => {
			const arr = [1, 2, 3, 4, 5];
			const result = fisherYates(arr);
			expect(result).not.toBe(arr);
			expect(result.sort()).toEqual(arr.sort());
		});

		it('should shuffle elements (probabilistic)', () => {
			const arr = Array.from({ length: 100 }, (_, i) => i);
			const result = fisherYates(arr);
			expect(result).not.toEqual(arr);
		});
	});

	describe('localStorage helpers', () => {
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
			vi.clearAllMocks();
		});

		it('savePref should store JSON stringified value', () => {
			savePref('test-key', { a: 1 });
			expect(localStorage.getItem('test-key')).toBe('{"a":1}');
		});

		it('loadPref should parse JSON value', () => {
			localStorage.setItem('test-key', '{"a":1}');
			expect(loadPref('test-key', null)).toEqual({ a: 1 });
		});

		it('loadPref should return fallback on error', () => {
			localStorage.setItem('test-key', 'invalid-json');
			expect(loadPref('test-key', 'fallback')).toBe('fallback');
		});

		it('loadPref should validate value if valid array provided', () => {
			localStorage.setItem('test-key', '"invalid"');
			expect(loadPref('test-key', 'fallback', ['a', 'b'])).toBe('fallback');
			
			localStorage.setItem('test-key', '"a"');
			expect(loadPref('test-key', 'fallback', ['a', 'b'])).toBe('a');
		});
	});

	describe('trackToHue', () => {
		it('should return a consistent number 0-359', () => {
			const hue1 = trackToHue('Artist', 'Title');
			const hue2 = trackToHue('Artist', 'Title');
			expect(hue1).toBe(hue2);
			expect(hue1).toBeGreaterThanOrEqual(0);
			expect(hue1).toBeLessThan(360);
		});
	});
});
