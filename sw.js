const CACHE = "generador-codigos-v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

function guardar(req, res) {
  if (res && (res.ok || res.type === "opaque")) {
    var copia = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copia); });
  }
  return res;
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    // La página: primero la red (para recibir cambios), y sin conexión la copia guardada.
    e.respondWith(
      fetch(req).then(function (res) { return guardar(req, res); })
        .catch(function () { return caches.match("index.html"); })
    );
    return;
  }
  // Lo demás (íconos, tipografías): primero lo guardado.
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { return guardar(req, res); });
    })
  );
});
