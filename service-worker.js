
const CACHE_NAME = "ready-preparedness-v3";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./residents.html"
];

// ==========================================
// INSTALL
// ==========================================

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// ==========================================
// ACTIVATE
// ==========================================

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) =>
                        name.startsWith("ready-preparedness-") &&
                        name !== CACHE_NAME
                    )
                    .map((name) => caches.delete(name))
            );
        })
    );

    self.clients.claim();
});

// ==========================================
// FETCH
// ==========================================

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // Huwag hawakan ang external websites at Supabase requests.
    if (url.origin !== self.location.origin) return;

    // Huwag i-cache ang Admin Dashboard at Admin Login.
    if (
        url.pathname.endsWith("/admin-dashboard.html") ||
        url.pathname.endsWith("/admin-login.html")
    ) {
        return;
    }

    // Para sa page navigation.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);

                return (
                    await cache.match(request) ||
                    await cache.match("./residents.html") ||
                    await cache.match("./index.html")
                );
            })
        );

        return;
    }

    // Para sa CSS, JavaScript, images, at local assets.
    if (
        ["style", "script", "image", "font"].includes(request.destination)
    ) {
        event.respondWith(
            fetch(request).then(async (response) => {
                if (response.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(request, response.clone());
                }

                return response;
            }).catch(async () => {
                return await caches.match(request) || Response.error();
            })
        );
    }
});
