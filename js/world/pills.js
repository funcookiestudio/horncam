// [HORNCAM] js/world/pills.js
// ---------- Frascos de calmante: raros, sobre as mesas dos escritórios; cada frasco tem 2-5 comprimidos ----------
// G pega (carrega até 12 comprimidos). X toma um: +25 de sanidade, acalma o coração por 20 s. Tomar 4 em 90 s = apagão por overdose.
const PIL={items:[],have:0,max:12,use:-1,t:[],calm:0};
function pillAdd(n){}
(function(){
  const DESKS=[[-17.5,17.5],[-14,17.5],[-17.5,21],[-14,21],[-12,23.5]];
  const hs=(a,b)=>{let h=(Math.imul(a+11,83492791)^Math.imul(b+3,2654435761))>>>0;h=Math.imul(h^h>>>15,2246822507)>>>0;h=Math.imul(h^h>>>13,3266489909)>>>0;return((h^h>>>16)>>>0)/4294967296};
  // chance baixíssima: 8% por mesa: com o sorteio fixo dá 2 frascos em todo o mapa (50 mesas); estável e igual para todos
  WH.forEach(w=>DESKS.forEach((d,k)=>{if(hs(w.i,k)<.08){PIL.items.push({wi:w.i,x:w.x+w.s*(d[0]+.42),y:.78,z:w.z+w.s*(d[1]-.05),n:2+Math.floor(hs(w.i+70,k)*4),got:false,m:null})}}));
  const mA=new THREE.MeshStandardMaterial({color:0xc2650c,roughness:.35,metalness:.05,transparent:true,opacity:.92}),
    mC=new THREE.MeshStandardMaterial({color:0xf2f2ea,roughness:.5}),mL=new THREE.MeshStandardMaterial({color:0xe8e4d8,roughness:.8});
  PIL.items.forEach(it=>{const g=new THREE.Group(),b=new THREE.Mesh(new THREE.CylinderGeometry(.021,.021,.062,12),mA),l=new THREE.Mesh(new THREE.CylinderGeometry(.0218,.0218,.03,12),mL),c=new THREE.Mesh(new THREE.CylinderGeometry(.0235,.0235,.014,12),mC);
    b.position.y=.031;l.position.y=.031;c.position.y=.069;g.add(b,l,c);g.position.set(it.x,it.y,it.z);g.rotation.y=Math.random()*6.28;scene.add(g);it.m=g});
  const hud=document.createElement('div');hud.id='pillhud';
  hud.style.cssText='position:fixed;left:14px;bottom:66px;z-index:5;font:700 13px monospace;letter-spacing:2px;color:#9fe;text-shadow:0 0 6px #000;display:none;pointer-events:none';
  document.body.appendChild(hud);
  PIL.hud=()=>{hud.textContent='CALMANTES '+'●'.repeat(Math.min(PIL.have,12))+'  [X]';hud.style.display=PIL.have>0?'block':'none'};
  window.pillTarget=function(){if(PH.dead)return null;const L0=Math.hypot(vf.x,vf.z);if(L0<.05)return null;let best=null,bd=1.9;
    PIL.items.forEach((f,i)=>{if(f.got||PIL.have>=PIL.max)return;const dx=f.x-P.pos.x,dz=f.z-P.pos.z,d=Math.hypot(dx,dz);
      if(d<bd&&(vf.x*dx+vf.z*dz)/(L0*(d||1))>.5&&vf.y<.2){bd=d;best={i,dist:d}}});return best};
  window.pillHint=function(t){const it=PIL.items[t.i];hint.textContent=(isTouch?'USE':'[G]')+' PEGAR CALMANTES ('+it.n+')';hint.style.display='block';useBtn.classList.add('show');PIL.use=t.i};
  window.pillTake=function(i,remote){const f=PIL.items[i];if(!f||f.got)return;
    if(!remote){const room=PIL.max-PIL.have;if(room<=0)return;const q=Math.min(room,f.n);PIL.have+=q;f.n-=q;feed('+'+q+' CALMANTE'+(q>1?'S':''));PIL.hud();
      if(f.n>0){return}   // sobrou: o frasco continua na mesa
      try{NET.send({t:'pl',i})}catch(e){}}
    f.got=true;if(f.m)f.m.visible=false;try{nz(.12,.3,3600,2,2,.06,'bandpass');nz(.08,.25,4200,2,2,.06,'bandpass',.07)}catch(e){}};
  // tomar: X
  window.pillUse=function(){if(PIL.have<=0||PH.dead||SFX.faint>0)return;
    PIL.have--;PIL.hud();const now=performance.now();PIL.t=PIL.t.filter(t=>now-t<90e3);PIL.t.push(now);
    sanAdd(25);PIL.calm=20;feed('CALMANTE · SANIDADE +25');try{nz(.06,.3,3800,2,2,.04,'bandpass');tn(180,120,.18,.07,'sine',.25)}catch(e){}
    if(PIL.t.length>=4){PIL.t.length=0;SFX.faint=3.6;feed('OVERDOSE')}};
  addEventListener('keydown',e=>{if(e.repeat||e.code!=='KeyX'||typeof active==='undefined'||!active||GS.mode!=='play')return;pillUse()});
  hud.style.pointerEvents='auto';hud.addEventListener('pointerdown',e=>{e.stopPropagation();pillUse()});
  setInterval(()=>{if(PIL.calm>0)PIL.calm-=1},1000);
})();
