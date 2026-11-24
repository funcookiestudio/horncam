// [HORNCAM] sw.js — service worker do PWA
// Estratégia:
//  · instalação: lê o próprio index.html e pré-carrega tudo que ele referencia (css, js, ícones, manifest) + as bibliotecas dos CDNs → lista sempre atualizada, sem manter nada à mão
//  · arquivos do jogo (mesma origem): rede primeiro (sempre a versão mais nova), com cache como reserva quando offline ou lento
//  · bibliotecas de CDN (three, peerjs, loaders): cache primeiro (as URLs são versionadas)
//  · multiplayer (PeerJS/WebRTC/WebSocket) não passa pelo cache; offline só o modo solo funciona
// Mudou a estrutura de cache? Aumente VERSION: os caches antigos são apagados na ativação.
const VERSION='horncam-v1';
const SHELL=VERSION+'-shell',LIBS=VERSION+'-libs';
const CDN=/^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com)\//;
const OPTIONAL=['assets/MK4 Tactical.obj','assets/MK4 Tactical.mtl']; // modelo da arma (se existir no servidor)
const NET_TIMEOUT=4000;

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const shell=await caches.open(SHELL),libs=await caches.open(LIBS);
    let html='';
    try{const r=await fetch('index.html',{cache:'reload'});html=await r.clone().text();await shell.put('index.html',r)}catch(err){}
    const urls=new Set(['./','manifest.webmanifest']);
    for(const m of html.matchAll(/(?:src|href)="([^"#?]+)"/g)){urls.add(m[1])}
    const own=[],cdn=[];
    for(const u of urls){if(/^https?:/.test(u)){if(CDN.test(u))cdn.push(u)}else if(!/^(data|mailto|javascript):/.test(u))own.push(u)}
    await Promise.allSettled([
      ...own.map(async u=>{const r=await fetch(u,{cache:'reload'});if(r.ok)await shell.put(u,r)}),
      ...OPTIONAL.map(async u=>{const r=await fetch(u,{cache:'reload'});if(r.ok)await shell.put(u,r)}),
      ...cdn.map(async u=>{const r=await fetch(u,{mode:'cors'});if(r.ok)await libs.put(u,r)})]);
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys())if(!k.startsWith(VERSION))await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting()});

function withTimeout(p,ms){return new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('timeout')),ms);p.then(v=>{clearTimeout(t);res(v)},v=>{clearTimeout(t);rej(v)})})}
async function networkFirst(req,cacheName,fallbackKey){
  const cache=await caches.open(cacheName);
  try{const r=await withTimeout(fetch(req),NET_TIMEOUT);if(r&&r.ok)cache.put(req,r.clone());return r}
  catch(err){const c=await cache.match(req,{ignoreSearch:true})||(fallbackKey&&await cache.match(fallbackKey));if(c)return c;throw err}}
async function cacheFirst(req,cacheName){
  const cache=await caches.open(cacheName),c=await cache.match(req);if(c)return c;
  const r=await fetch(req);if(r&&(r.ok||r.type==='opaque'))cache.put(req,r.clone());return r}

self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(CDN.test(req.url)){e.respondWith(cacheFirst(req,LIBS));return}
  if(url.origin!==location.origin)return;                 // sinalização do PeerJS, etc.: direto na rede
  if(req.mode==='navigate'){e.respondWith(networkFirst(req,SHELL,'index.html'));return}
  e.respondWith(networkFirst(req,SHELL));
});
