// [HORNCAM] js/world/ammo-crates.js
// ===== CAIXAS DE MUNIÇÃO .50 CAL (pegar munição · abre e esvazia para todos · cooldown) =====
const AB_CD=180,AB_GIVE=60,AB_MAX=120,AB_SC=.3,AB_REACH=1.8; // cooldown (s) · munição por caixa · reserva máxima · escala · alcance (m)
const ABX=[];let abUse=-1;
const abLeft=b=>Math.max(0,(b.until-performance.now())/1000);
const abFmt=s=>{s=Math.ceil(s);return (s/60|0)+':'+String(s%60).padStart(2,'0');};
const abEase=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const abApply=b=>{const lt=Math.max(0,(b.ang-.25)/.75),ft=Math.min(1,b.ang/.3);b.latch.rotation.x=abEase(ft);b.lid.rotation.x=-abEase(lt)*1.95;};
(function(){
  const W_=2,H_=1.2,D_=1,T_=.05,C=h=>new THREE.Color(h);
  const OL=C(0x4b5230),DK=C(0x2a2e1a),HD=C(0x383d24),RB=C(0x0e0e0e),ST=C(0x5a5d55);
  // geometrias estáticas fundidas (1 draw call por parte) e compartilhadas entre todas as caixas
  const acc=()=>({g:[]});
  function add(a,geo,c,x,y,z,rx,rz){
    if(geo.index)geo=geo.toNonIndexed();
    geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,0,rz||0)),new THREE.Vector3(1,1,1)));
    const n=geo.attributes.position.count,cc=new Float32Array(n*3);
    for(let i=0;i<n;i++){cc[i*3]=c.r;cc[i*3+1]=c.g;cc[i*3+2]=c.b;}
    geo.setAttribute('color',new THREE.BufferAttribute(cc,3));a.g.push(geo);}
  const bxx=(a,w,h,d,c,x,y,z)=>add(a,new THREE.BoxGeometry(w,h,d),c,x,y,z);
  const cyx=(a,r,l,c,x,y,z)=>add(a,new THREE.CylinderGeometry(r,r,l,8),c,x,y,z,0,Math.PI/2);
  function fuse(a){
    let n=0;a.g.forEach(g=>n+=g.attributes.position.count);
    const P=new Float32Array(n*3),N=new Float32Array(n*3),Cc=new Float32Array(n*3);let o=0;
    a.g.forEach(g=>{P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);Cc.set(g.attributes.color.array,o*3);o+=g.attributes.position.count;g.dispose();});
    const r=new THREE.BufferGeometry();
    r.setAttribute('position',new THREE.BufferAttribute(P,3));r.setAttribute('normal',new THREE.BufferAttribute(N,3));r.setAttribute('color',new THREE.BufferAttribute(Cc,3));
    return r;}
  // corpo
  const body=acc();
  bxx(body,W_,T_,D_,OL,0,T_/2,0);bxx(body,W_,H_,T_,OL,0,H_/2,D_/2-T_/2);bxx(body,W_,H_,T_,OL,0,H_/2,-D_/2+T_/2);
  bxx(body,T_,H_,D_,OL,-W_/2+T_/2,H_/2,0);bxx(body,T_,H_,D_,OL,W_/2-T_/2,H_/2,0);bxx(body,W_-.1,.01,D_-.1,DK,0,T_+.005,0);
  bxx(body,W_+.08,.07,.05,OL,0,H_-.035,D_/2+.0175);bxx(body,W_+.08,.07,.05,OL,0,H_-.035,-D_/2-.0175);
  [-1,1].forEach(s=>{
    bxx(body,.05,.07,D_+.08,OL,s*(W_/2+.0175),H_-.035,0);
    const gx=s*(W_/2);
    bxx(body,.03,.3,.46,HD,gx+s*.025,.82,0);
    [-.17,.17].forEach(z=>bxx(body,.12,.05,.05,HD,gx+s*.09,.82,z));
    bxx(body,.05,.06,.4,HD,gx+s*.16,.82,0);bxx(body,.03,.08,.46,HD,gx+s*.025,.55,0);
    [-.15,.15].forEach(z=>bxx(body,.03,.03,.03,ST,gx+s*.05,.82,z+(z>0?.03:-.03)));});
  bxx(body,.34,.2,.03,HD,0,.68,D_/2+.025);
  // tampa (pivô na dobradiça traseira)
  const lid=acc(),LW=W_+.14,LL=D_+.145,cz=(D_+.005)/2;
  bxx(lid,LW,.04,LL,OL,0,.04,cz);bxx(lid,LW,.26,.03,OL,0,-.07,-.065);bxx(lid,LW,.26,.03,OL,0,-.07,D_+.06);
  [-1,1].forEach(s=>{bxx(lid,.03,.26,LL,OL,s*(LW/2-.015),-.07,cz);bxx(lid,.05,.02,D_,RB,s*(W_/2),.01,D_/2);});
  bxx(lid,W_+.04,.02,.05,RB,0,.01,0);bxx(lid,W_+.04,.02,.05,RB,0,.01,D_);
  [-.6,0,.6].forEach(x=>bxx(lid,.06,.03,D_*.72,OL,x,.075,D_*.5));bxx(lid,W_*.7,.03,.06,OL,0,.075,D_*.5);
  bxx(lid,.34,.14,.03,HD,0,-.12,D_+.085);bxx(lid,.14,.06,.04,DK,0,-.12,D_+.09);
  [-.62,.62].forEach(x=>{cyx(lid,.04,.3,ST,x,0,-.07);bxx(lid,.3,.03,.12,HD,x,.02,0);});
  // fecho
  const lat=acc();
  cyx(lat,.03,.3,ST,0,0,0);bxx(lat,.1,.5,.025,ST,0,.25,0);bxx(lat,.2,.06,.04,ST,0,.5,0);bxx(lat,.12,.05,.1,ST,0,.52,-.04);
  // munição interna (92 cartuchos fundidos)
  const am=acc();let k=0;
  for(let l=0;l<8;l++){const n=l%2?11:12;for(let i=0;i<n;i++){
    const x=(l%2?-.79:-.869)+i*.158,y=.135+l*.137;
    add(am,new THREE.CylinderGeometry(.072,.072,.62,8),C(0xc9a227),x,y,-.11,Math.PI/2);
    add(am,new THREE.ConeGeometry(.068,.22,8),(k%5===4)?C(0xb02a1c):C(0x4a463a),x,y,.31,Math.PI/2);k++;}}
  const gBody=fuse(body),gLid=fuse(lid),gLat=fuse(lat),gAm=fuse(am);
  const mStd=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.3,flatShading:true});
  const mAm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.7,flatShading:true});
  // estampa amarela (MeshBasic: aparece mesmo no escuro)
  const cv=document.createElement('canvas');cv.width=1024;cv.height=512;
  const cx=cv.getContext('2d');cx.fillStyle='#d6e04a';cx.font='bold 74px Arial Narrow, Arial, sans-serif';
  ['100 CRTG .50 CAL','LINK M9','4 - BALL M33','1 - TRACER M17','LC - 12H693S818','TAG WARZONE'].forEach((t,i)=>cx.fillText(t,30,90+i*80));
  const tex=texQ(new THREE.CanvasTexture(cv));
  const gLab=new THREE.PlaneGeometry(1.5,.75),mLab=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.9});
  const gLed=new THREE.BoxGeometry(.14,.14,.05);
  function mk(x,z,fx,fz){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=Math.atan2(fx,fz);g.scale.setScalar(AB_SC);
    g.add(new THREE.Mesh(gBody,mStd));
    const lb=new THREE.Mesh(gLab,mLab);lb.position.set(-.18,.52,D_/2+.0105);g.add(lb);
    const a=new THREE.Mesh(gAm,mAm);g.add(a);
    const ld=new THREE.Group();ld.position.set(0,H_,-D_/2);ld.add(new THREE.Mesh(gLid,mStd));g.add(ld);
    const lt=new THREE.Group();lt.position.set(0,.68,D_/2+.05);lt.add(new THREE.Mesh(gLat,mStd));g.add(lt);
    const led=new THREE.Mesh(gLed,new THREE.MeshBasicMaterial({color:0x39ff6a}));led.position.set(.82,.88,D_/2+.04);g.add(led);
    scene.add(g);ABX.push({x,z,g,lid:ld,latch:lt,am:a,led,ang:0,until:0,col:0,pend:0});}
  // posições: 4 salas de tijolo (encostadas na parede interna), corredor central e salões norte/oeste/leste
  WH.forEach(w=>[[-19.6,-14,1,0],[19.6,-12,-1,0],[-19.6,5,1,0],[7,24.6,0,-1],[-4,24.6,0,-1],[0,-24.6,0,1],[-9.7,8,1,0]].forEach(p=>mk(w.x+w.s*p[0],w.z+w.s*p[1],p[2]*w.s,p[3]*w.s)));
})();
function abSnd(b,mine){
  try{SV=mine?1:attn(b.x,b.z);
    nz(.05,.55,2600,2,1,.1,'bandpass');tn(320,110,.12,.22,'square');
    nz(.18,.3,500,1,2,.3);nz(.04,.5,3000,2,1,.1,'bandpass',.22);SV=1;}catch(e){SV=1;}
}
// abre a caixa (cd = segundos restantes de cooldown); mine = fui eu que peguei
function abOpen(i,mine,cd,quiet){
  const b=ABX[i];if(!b)return;
  cd=Math.max(0,Math.min(AB_CD,+cd||0));b.until=performance.now()+cd*1000;b.pend=0;
  if(quiet){b.ang=cd>0?1:0;abApply(b);return;}
  abSnd(b,mine);
  if(mine&&!PH.dead){const g=Math.min(AB_MAX,W.res+AB_GIVE)-W.res;const eg=3-blastAmmo;if(g>0)W.res+=g;if(eg>0)blastAmmo=3;if(g>0||eg>0){updAmmo();feed((g>0?'+'+g+' MUNIÇÃO':'')+(g>0&&eg>0?' · ':'')+(eg>0?' +'+eg+' CARGAS EXPLOSIVAS':'') );}}
}
function takeBox(i){
  const b=ABX[i];if(!b||PH.dead||abLeft(b)>0)return;
  if(W.res>=AB_MAX&&blastAmmo>=3){feed('RESERVAS CHEIAS');return;}
  if(!NET.on||NET.host){abOpen(i,true,AB_CD);NET.send({t:'ab',i,w:NET.id,c:AB_CD});} // solo/anfitrião decide na hora
  else{if(b.pend>performance.now())return;b.pend=performance.now()+1000;NET.send({t:'abq',i});} // cliente pede ao anfitrião (evita 2 pegarem juntos)
}
function ammoTarget(){
  if(PH.dead)return null;
  const L0=Math.hypot(vf.x,vf.z);if(L0<.05)return null;
  let best=null,bd=AB_REACH;
  for(let i=0;i<ABX.length;i++){const b=ABX[i],dx=b.x-P.pos.x,dz=b.z-P.pos.z,d=Math.hypot(dx,dz);
    if(d<bd&&(vf.x*dx+vf.z*dz)/(L0*(d||1))>.35){bd=d;best={i,dist:d};}}
  return best;
}
function ammoHint(t){
  const b=ABX[t.i],left=abLeft(b);let txt,act=false;
  if(left>0)txt='CAIXA VAZIA · MUNIÇÃO EM '+abFmt(left);
  else if(W.res>=AB_MAX&&blastAmmo>=3)txt='RESERVAS CHEIAS';
  else{txt=(isTouch?'USE':'[G]')+' PEGAR MUNIÇÃO';act=true;}
  hint.textContent=txt;hint.style.display='block';useBtn.classList.toggle('show',act);
  abUse=act?t.i:-1;
}
function useAct(){if(typeof FSP!=='undefined'&&FSP.use>=0){fuseTake(FSP.use);return}if(abUse>=0){takeBox(abUse);return;}if(brkUse){if(brkUse.door){fbDoorUse(brkUse);return}toggleBreaker(brkUse.b.wi,brkUse.i);return;}useDoor();}
function ammoBoxTick(dt){
  const now=performance.now();
  for(const b of ABX){
    const left=Math.max(0,(b.until-now)/1000),want=left>0?1:0;
    if(b.ang!==want){b.ang+=Math.sign(want-b.ang)*Math.min(Math.abs(want-b.ang),dt*.9);abApply(b);}
    b.am.visible=b.ang>0&&!(left>0&&b.ang>.25); // fechada: munição escondida (não gasta GPU)
    const c=left>0?(Math.floor(now/600)%2?0x551108:0xff3322):0x39ff6a;
    if(b.col!==c){b.col=c;b.led.material.color.setHex(c);}
  }
}

function worldTick(dt){const k=1-Math.exp(-dt*4);
  for(const d of doors){if(d.broken)continue;
    if(d.gate){const tg=d.open?1:0,df=tg-d.a;                     // portão de enrolar: velocidade constante (~6,5 s), com som de corrente/metal
      if(Math.abs(df)>.002){d.a+=Math.sign(df)*Math.min(Math.abs(df),dt/6.5);d.g.scale.y=Math.max(.04,1-d.a);d.mv=true;
        d.sn=(d.sn||0)-dt;if(d.sn<=0){d.sn=.09+Math.random()*.08;sndAt({x:d.cx,z:d.cz},gateRattle)}}
      else if(d.mv){d.mv=false;d.a=tg;d.g.scale.y=Math.max(.04,1-d.a);sndAt({x:d.cx,z:d.cz},()=>gateStop(d.open))}
      if(d.open&&d.sOn&&d.a>.8){const i=solids.indexOf(d.sol);if(i>=0)solids.splice(i,1);d.sOn=false;}}
    else{d.a+=((d.open?1.75:0)-d.a)*k;d.g.rotation.y=d.sw*d.a;}}
  abUse=-1;camera.getWorldDirection(vf);if(typeof FSP!=='undefined')FSP.use=-1;
  const d=nearDoor();let dd=1e9;
  if(d){const dx=d.cx-P.pos.x,dz=d.cz-P.pos.z,L=Math.hypot(dx,dz)||1;if((vf.x*dx+vf.z*dz)/L>.4)dd=L;}
  const bt=ammoTarget(),bk=breakerTarget();brkUse=null;brkNear=bk&&bk.dist<BH_NEAR&&(!bt||bk.dist<bt.dist)?bk:null;
  if(bk&&bk.dist<dd&&(!bt||bk.dist<bt.dist)){brkUse=bk;hint.textContent=(isTouch?'USE':'[G]')+' '+(bk.door?fbHint(bk):(SW[bk.b.wi][bk.i]?'DESLIGAR ':'LIGAR ')+(bk.i<7?'CORREDOR '+(bk.i+1):'ESCRITÓRIO'));hint.style.display='block';useBtn.classList.add('show');return}
  const ft=typeof fuseTarget==='function'?fuseTarget():null;if(ft&&ft.dist<dd&&(!bt||ft.dist<bt.dist)&&(!bk||ft.dist<bk.dist)){fuseHint(ft);brkUse=null;return;}
  if(bt&&bt.dist<dd){ammoHint(bt);return;}
  if(dd<1e9){hint.textContent=(isTouch?'USE':'[G]')+(d.open?' FECHAR ':' ABRIR ')+(d.gate?'PORTÃO':'PORTA DE EMERGÊNCIA');hint.style.display='block';useBtn.classList.add('show');return;}
  hint.style.display='none';useBtn.classList.remove('show');}

