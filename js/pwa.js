// [HORNCAM] js/pwa.js
// ---------- PWA: service worker, instalação, atualização, modo offline ----------
(function(){
  const standalone=()=>matchMedia('(display-mode: fullscreen), (display-mode: standalone), (display-mode: minimal-ui)').matches||navigator.standalone===true;
  const say=t=>{try{if(typeof feed==='function')feed(t)}catch(e){}};
  // service worker (só em https ou localhost)
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    addEventListener('load',()=>{
      navigator.serviceWorker.register('sw.js').then(reg=>{
        const ask=w=>{if(!w)return;
          const ready=()=>{if(navigator.serviceWorker.controller)offerUpdate(w)};
          if(w.state==='installed')ready();else w.addEventListener('statechange',()=>{if(w.state==='installed')ready()})};
        ask(reg.waiting);reg.addEventListener('updatefound',()=>ask(reg.installing));
        setInterval(()=>reg.update().catch(()=>{}),60*60*1000);
      }).catch(err=>console.warn('[pwa] service worker:',err));
      let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});
    });
  }
  // nova versão: aviso discreto; atualiza só quando o jogador toca (não derruba a partida)
  function offerUpdate(w){
    if(document.getElementById('pwa-upd'))return;
    const b=document.createElement('button');b.id='pwa-upd';b.type='button';b.textContent='NOVA VERSÃO · TOCAR PARA ATUALIZAR';
    b.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:40;padding:9px 14px;background:rgba(9,13,10,.92);color:#e0b04a;border:1px solid #e0b04a;font:12px monospace;letter-spacing:1px;cursor:pointer';
    b.addEventListener('click',()=>{w.postMessage('skipWaiting');b.textContent='ATUALIZANDO…'});
    document.body.appendChild(b);}
  // instalar (Chrome/Edge/Android) e dica para iOS
  let deferred=null;
  const row=document.getElementById('pwarow'),btn=document.getElementById('optinstall'),hint=document.getElementById('pwahint');
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;if(row&&!standalone())row.hidden=false});
  if(btn)btn.addEventListener('click',async()=>{if(!deferred)return;deferred.prompt();try{await deferred.userChoice}catch(e){}deferred=null;if(row)row.hidden=true});
  addEventListener('appinstalled',()=>{deferred=null;if(row)row.hidden=true;say('APP INSTALADO')});
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios&&!standalone()&&hint){hint.hidden=false}
  // app instalado: tela cheia deitada no celular, armazenamento persistente (progresso e opções não somem)
  if(standalone()){
    try{if(screen.orientation&&screen.orientation.lock&&matchMedia('(pointer:coarse)').matches)screen.orientation.lock('landscape').catch(()=>{})}catch(e){}
  }
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  // conexão
  addEventListener('offline',()=>say('SEM CONEXÃO · SÓ O MODO SOLO FUNCIONA'));
  addEventListener('online',()=>say('CONEXÃO RESTABELECIDA'));
})();
