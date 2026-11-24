// [HORNCAM] js/ui/lobby.js
// ---------- lobby (UI) ----------
function setBusy(b){NET.busy=b;$('mkroom').disabled=$('joinroom').disabled=b;}
function netReset(){
  Object.keys(NET.rem).forEach(id=>{const r=NET.rem[id];setProxy(r,false);scene.remove(r.g);});
  NET.rem={};NET.players={};NET.conns={};NET.log=[];
  try{NET.peer&&NET.peer.destroy();}catch(e){}
  NET.peer=null;NET.hc=null;NET.on=false;NET.host=false;setBusy(false);refreshUI();
  $('lr1').style.display=$('lr2').style.display='';$('roomcode').style.display='none';
}
function lobbyConnected(){
  $('lr1').style.display=$('lr2').style.display='none';$('lobby').classList.remove('mp-off');$('mpbtn').textContent='MULTIPLAYER ▴';
  const rc=$('roomcode');rc.style.display='block';rc.textContent=NET.code;
  rc.onclick=()=>{try{navigator.clipboard.writeText(NET.code);setStatus('Código copiado.');}catch(e){}};
  setStatus(NET.host?'Sala criada! Passe o código (toque para copiar) e clique em INICIAR.':'Conectado! Clique em INICIAR.');
  $('pname').textContent=NET.name;setBusy(false);refreshUI();
}
function netError(e){
  const t=e&&e.type;
  if(NET.on){console.warn('peer',e);return;}
  setStatus(t==='peer-unavailable'?'Sala não encontrada. Confira o código.':
    t==='browser-incompatible'?'Navegador sem suporte a WebRTC.':'Falha de rede ('+(t||'erro')+'). Tente de novo.');
  netReset();
}
function startHost(tries){
  if(NET.busy)return;
  if(!window.Peer){setStatus('PeerJS não carregou (sem internet?).');return;}
  NET.name=sanitize($('nm').value);try{localStorage.setItem('horncam_name',NET.name);}catch(e){}
  setBusy(true);setStatus('Criando sala…');
  const code=genCode(),peer=new Peer('hcam-'+code,{debug:0});
  peer.on('open',id=>{
    NET.peer=peer;NET.id=id;NET.host=true;NET.on=true;NET.slot=0;NET.code=code;NET.log=[];
    NET.players[id]={id,n:NET.name,s:0,k:0,d:0};lobbyConnected();
  });
  peer.on('connection',conn=>{
    conn.on('data',m=>onConnData(conn,m));
    conn.on('close',()=>dropConn(conn));conn.on('error',()=>dropConn(conn));
  });
  peer.on('disconnected',()=>{try{peer.reconnect();}catch(e){}});
  peer.on('error',e=>{
    if(e&&e.type==='unavailable-id'&&(tries||0)<5&&!NET.on){try{peer.destroy();}catch(_){}setBusy(false);startHost((tries||0)+1);}
    else netError(e);
  });
}
function joinRoom(){
  if(NET.busy)return;
  if(!window.Peer){setStatus('PeerJS não carregou (sem internet?).');return;}
  const code=$('rc').value.toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(code.length<4){setStatus('Digite o código da sala (4 caracteres).');return;}
  NET.name=sanitize($('nm').value);try{localStorage.setItem('horncam_name',NET.name);}catch(e){}
  setBusy(true);setStatus('Conectando…');
  const peer=new Peer({debug:0});NET.peer=peer;
  let to=null;
  peer.on('open',id=>{
    NET.id=id;
    const c=peer.connect('hcam-'+code,{reliable:true});NET.hc=c;
    to=setTimeout(()=>{if(!NET.on){setStatus('Tempo esgotado. Verifique o código e a rede.');netReset();}},15000);
    c.on('open',()=>{try{c.send({t:'hi',n:NET.name});}catch(e){}});
    c.on('data',m=>{
      if(!m||typeof m!=='object')return;
      if(m.t==='init'){clearTimeout(to);onInit(m,code);}
      else if(m.t==='full'){clearTimeout(to);setStatus('Sala cheia (máx. '+MAXP+').');netReset();}
      else if(NET.on)handle(m);
    });
    c.on('close',()=>{clearTimeout(to);if(NET.on&&!NET.host)hostLost();});
    c.on('error',()=>{});
  });
  peer.on('error',e=>{clearTimeout(to);netError(e);});
}
function hostLost(){
  netReset();feed('Host desconectou');
  setStatus('A conexão com o host caiu. Você voltou ao modo solo.');
  if(PH.dead){PH.dead=false;PH.hp=100;}
}
$('mkroom').addEventListener('click',()=>startHost(0));
$('joinroom').addEventListener('click',joinRoom);
['nm','rc'].forEach(id=>{const el=$(id);['keydown','keyup'].forEach(ev=>el.addEventListener(ev,e=>e.stopPropagation()));});
try{const sv=localStorage.getItem('horncam_name');if(sv)$('nm').value=sv;}catch(e){}
addEventListener('pagehide',()=>{try{NET.peer&&NET.peer.destroy();}catch(e){}});


// menu limpo: o bloco de sala só abre ao tocar em MULTIPLAYER (ou quando já conectado)
{const mb=$('mpbtn'),lb=$('lobby');if(mb)mb.addEventListener('click',()=>{const off=lb.classList.toggle('mp-off');mb.textContent=off?'MULTIPLAYER ▾':'MULTIPLAYER ▴'})}
