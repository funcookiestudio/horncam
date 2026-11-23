// [HORNCAM] js/net/utils.js
// ===================== MULTIPLAYER P2P (WebRTC via PeerJS) =====================
// O anfitrião (quem cria a sala) serve de ponto de encontro e retransmite; os dados do jogo
// trafegam por canais WebRTC diretos entre navegadores. O PeerJS cloud só faz o "aperto de mão" inicial.
const $=s=>document.getElementById(s);
const MAXP=4,SEND_DT=1/20,
  SPAWNS=SPAWN_LIST,
  SLOTCOL=[0x8a2f2f,0x2f5a8a,0x8a7a2f,0x2f7a45];
const NET={on:false,host:false,peer:null,hc:null,conns:{},id:null,slot:0,code:'',name:'OPERADOR',
  players:{},rem:{},log:[],lastBy:null,deadBy:null,inv:0,resp:0,acc:0,busy:false};
let hurtV=0;
const hurtEl=$('hurt'),msgEl=$('msg'),feedEl=$('feed'),rosterEl=$('roster');
DM.blood=new THREE.MeshBasicMaterial({color:0x7a0a0a});

// ---------- utilidades ----------
function sanitize(s){return (String(s||'').replace(/[^\w \-À-ÿ]/g,'').trim().slice(0,12)||'OPERADOR').toUpperCase();}
function genCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let c='';for(let i=0;i<4;i++)c+=A[(Math.random()*A.length)|0];return c;}
function setStatus(t){$('lstat').textContent=t;}
const attn=(x,z)=>Math.max(.02,Math.min(1,1/(1+Math.hypot(camera.position.x-x,camera.position.z-z)*.18)));
const angDiff=d=>((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
function feed(t){if(!t)return;const aviso=String(t).toUpperCase();if(/RECARREG|RECARGA|MUNI[ÇC][ÃA]O(?:ES)?\s+EXPLOSIVAS?|CARGA(?:S)?\s+EXPLOSIVAS?|PREPARANDO MUNIÇÃO|LANÇA-GRANADAS PRONTO|SEM MUNIÇÃO/.test(aviso))return;const d=document.createElement('div');d.textContent=t;feedEl.appendChild(d);setTimeout(()=>d.remove(),5000);while(feedEl.children.length>5)feedEl.firstChild.remove();}
function fillList(el){el.textContent='';
  const list=Object.values(NET.players).sort((a,b)=>b.k-a.k||a.d-b.d);
  for(const p of list){const d=document.createElement('div');if(p.id===NET.id)d.className='me';
    d.textContent=(p.id===NET.id?'▶ ':'  ')+p.n+'  '+p.k+'/'+p.d;el.appendChild(d);}}
function refreshUI(){
  if(!NET.on){rosterEl.style.display='none';$('lst').textContent='';return;}
  rosterEl.style.display='block';rosterEl.textContent='';
  const h=document.createElement('div');h.textContent='SALA '+NET.code+' · '+Object.keys(NET.players).length+'/'+MAXP;rosterEl.appendChild(h);
  const l=document.createElement('div');rosterEl.appendChild(l);fillList(l);
  fillList($('lst'));
}

