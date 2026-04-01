import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { countries } from '$lib/config/countries';
import type { ChartData } from '$lib/types';

export function entries() {
	return countries.map((c) => ({ country: c.code }));
}

export const load: PageLoad = async ({ params }) => {
	const valid = countries.some((c) => c.code === params.country);
	if (!valid) error(404, 'Country not found');

	try {
		const mod = await import(`../../../lib/data/${params.country}.json`);
		return { chart: mod.default as ChartData };
	} catch {
		error(404, 'Chart data not available');
	}
};