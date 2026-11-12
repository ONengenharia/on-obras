/* Service worker mínimo: deixa o chat instalável. Não guarda nada em cache (o sistema sempre busca a versão atual). */
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",()=>{});
