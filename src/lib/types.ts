// src/lib/types.ts
export interface Track {
	rank: number;
	change: string;
	title: string;
	artist: string;
	spotifyId: string;
	ytMusicId: string;
	streams: number;
	peak: number;
	weeks: number;
}

export interface ChartData {
	country: string;
	countryName: string;
	weekDate: string;
	lastUpdated: string;
	tracks: Track[];
}