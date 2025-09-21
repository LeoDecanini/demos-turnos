self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith("/reservar")) return;

  event.respondWith((async () => {
    try {
      const net = await fetch(event.request);
      return net;
    } catch {
      return new Response("Offline en Reservas", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
  })());
});
