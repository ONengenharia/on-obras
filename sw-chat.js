/* Service worker do chat: deixa o app instalável e recebe os avisos (push). Não guarda nada em cache. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: "Chat ON", body: e.data ? e.data.text() : "" }; }
  e.waitUntil((async () => {
    const abertos = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (abertos.some(c => c.visibilityState === "visible" && c.url.includes("chat.html"))) return; // já está olhando o chat
    await self.registration.showNotification(d.title || "Chat ON", { body: d.body || "", icon: "assets/pwa/chat-192.png", badge: "assets/pwa/chat-192.png", tag: d.canal || "chat", renotify: true, data: { url: d.url || "chat.html" } });
    try { const n = (await self.registration.getNotifications()).length; if (self.navigator.setAppBadge) await self.navigator.setAppBadge(n); } catch (x) {}
  })());
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil((async () => {
    const url = new URL((e.notification.data && e.notification.data.url) || "chat.html", self.registration.scope).href;
    const L = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of L) if (c.url.includes("chat.html")) { await c.focus(); return; }
    await self.clients.openWindow(url);
  })());
});
