export interface CountryConfig {
	code: string;
	name: string;
	slug: string;
}

export const countries: CountryConfig[] = [
	{ code: 'global', name: 'Global', slug: 'global_weekly' },
	{ code: 'in', name: 'India', slug: 'in_weekly' },
	{ code: 'us', name: 'United States', slug: 'us_weekly' },
	{ code: 'gb', name: 'United Kingdom', slug: 'gb_weekly' }
];

export const countryMap = new Map(countries.map((c) => [c.code, c]));