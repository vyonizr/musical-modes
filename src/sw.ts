/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __WB_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__WB_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      matcher: /\.(?:woff|woff2|ttf|eot)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "fonts",
        expiration: { maxEntries: 10, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
});

// One-time cleanup: the old runtime 'audio' cache (removed when samples
// moved into the precache manifest) is never touched by Serwist's own
// cleanup, since that only tracks precache-named caches. Delete it
// explicitly so returning users don't keep an orphaned ~850KB cache forever.
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete("audio"));
});

serwist.addEventListeners();
