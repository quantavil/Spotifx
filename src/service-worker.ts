// src/service-worker.ts
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

import { build, files, prerendered, version } from '$service-worker';

const CACHE = `spotifx-${version}`;
const STATIC_ASSETS = new Set([...build, ...files]);
const ALL_ASSETS = [...build, ...files, ...prerendered];

// Install: pre-cache everything
sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ALL_ASSETS))
			.then(() => sw.skipWaiting())
	);
});

// Activate: purge old caches
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

// Fetch: cache-first for hashed static assets, network-first for pages
sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);
	if (url.origin !== location.origin) return;

	event.respondWith(
		STATIC_ASSETS.has(url.pathname) ? cacheFirst(event.request) : networkFirst(event.request)
	);
});

async function cacheFirst(request: Request): Promise<Response> {
	const cached = await caches.match(request);
	return cached || fetch(request);
}

async function networkFirst(request: Request): Promise<Response> {
	try {
		const response = await fetch(request);
		if (response.ok) {
			const cache = await caches.open(CACHE);
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		const cached = await caches.match(request);
		return (
			cached ||
			new Response(
				'<!DOCTYPE html><html><body style="background:#121212;color:#e5e5e5;font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0"><div style="text-align:center"><h1>Offline</h1><p>Check your connection and try again.</p></div></body></html>',
				{ status: 503, headers: { 'Content-Type': 'text/html' } }
			)
		);
	}
}