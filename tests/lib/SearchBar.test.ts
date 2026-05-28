// tests/lib/SearchBar.test.ts
import { describe, it, expect } from 'vitest';
import { mount, flushSync } from 'svelte';
import SearchBar from '../../src/lib/components/ui/SearchBar.svelte';

describe('SearchBar', () => {
	it('should allow typing and update value with debounce', async () => {
		const target = document.createElement('div');
		document.body.appendChild(target);

		let value = '';
		// Setup bindable prop matching Svelte 5
		const props = {
			get value() { return value; },
			set value(v) { value = v; }
		};

		mount(SearchBar, {
			target,
			props
		});
		flushSync();

		const input = target.querySelector('input') as HTMLInputElement;
		expect(input).toBeDefined();
		expect(input.value).toBe('');

		// Simulate typing 'hello'
		input.value = 'hello';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		flushSync();

		// Immediately internalValue is updated, but value is debounced
		expect(input.value).toBe('hello');
		expect(value).toBe('');

		// Wait 150ms for debounce
		await new Promise((resolve) => setTimeout(resolve, 150));

		// Now the debounced value should be updated to 'hello'
		expect(value).toBe('hello');

		// Check that we can clear it or type more
		input.value = 'hello world';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		flushSync();
		expect(input.value).toBe('hello world');

		await new Promise((resolve) => setTimeout(resolve, 150));
		expect(value).toBe('hello world');

		// Clean up DOM
		document.body.removeChild(target);
	});
});
