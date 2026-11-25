// [HORNCAM] js/world/fuse-boxes.js
// ---------- Caixa de fusíveis dos quadros de disjuntores (etapa 1: só o painel) ----------
// Na parte de baixo de cada quadro há uma tampa de metal com dobradiça. Com a tampa aberta aparecem 4 fusíveis (cada um alimenta 2 corredores) e os fios.
// Estados: 1 = bom (vidro âmbar), 0 = queimado (vidro escuro), -1 = ausente (só o encaixe). Nesta etapa os fusíveis ainda não cortam a energia.
// Tecla N: queima o próximo fusível bom do quadro mais próximo; Shift+N: restaura todos (teste).
const FBX={fz:{},t:{},tg:{},k:{},ang:Math.PI*.58};
function fbOpen(wi){return (FBX.tg[wi]||0)>.5}
(function(){
  if(!BRK.length)return;
  const NB=BRK.length,G=new THREE.BoxGeometry(1,1,1),IMs=(m,n)=>{const im=new THREE.InstancedMesh(G,m,n);im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.frustumCulled=false;scene.add(im);return im};
  const inner=IMs(new THREE.MeshStandardMaterial({color:0x14171a,roughness:.9}),NB),door=IMs(new THREE.MeshStandardMaterial({color:0x7a828a,roughness:.5,metalness:.55}),NB),
    handle=IMs(new THREE.MeshStandardMaterial({color:0xb8b8ae,roughness:.35,metalness:.8}),NB),glass=IMs(new THREE.MeshBasicMaterial({color:0xffffff}),NB*4),
    caps=IMs(new THREE.MeshStandardMaterial({color:0x9a9a92,roughness:.4,metalness:.8}),NB*8),wires=IMs(new THREE.MeshBasicMaterial({color:0xffffff}),NB*10);
  const O=new THREE.Object3D(),M=new THREE.Matrix4(),Ml=new THREE.Matrix4(),Q0=new THREE.Quaternion(),C=new THREE.Color(),Y=1.335,F_GOOD=0xffd070,F_BAD=0x000000;
  const pl=(im,i,x,y,z,sx,sy,sz)=>{BK_O.position.set(x,y,z);BK_O.scale.set(sx,sy,sz);BK_O.updateMatrix();im.setMatrixAt(i,BK_O.matrix)};
  function paintFuse(b){for(let j=0;j<4;j++){const st=(FBX.fz[b.wi]||[1,1,1,1])[j],z=b.z+(j-1.5)*.125,x=b.x+b.nx*.07,i=b.k*4+j;
    pl(glass,i,x,Y,z,st<0?0:.028,st<0?0:.075,st<0?0:.028);glass.setColorAt(i,C.setHex(st>0?F_GOOD:F_BAD))}
    glass.instanceMatrix.needsUpdate=true;if(glass.instanceColor)glass.instanceColor.needsUpdate=true}
  function placeDoor(b,t){const th=b.nx*FBX.ang*t,hx=b.x+b.nx*.099,hz=b.z-.28;
    O.position.set(hx,Y,hz);O.rotation.set(0,th,0);O.scale.set(1,1,1);O.updateMatrix();
    Ml.compose(new THREE.Vector3(0,0,.28),Q0,new THREE.Vector3(.008,.13,.56));M.multiplyMatrices(O.matrix,Ml);door.setMatrixAt(b.k,M);
    Ml.compose(new THREE.Vector3(b.nx*.012,0,.5),Q0,new THREE.Vector3(.014,.03,.014));M.multiplyMatrices(O.matrix,Ml);handle.setMatrixAt(b.k,M);
    door.instanceMatrix.needsUpdate=handle.instanceMatrix.needsUpdate=true}
  BRK.forEach(b=>{FBX.fz[b.wi]=[1,1,1,1];FBX.t[b.wi]=FBX.tg[wiKey(b)]=0;FBX.k[b.wi]=b;
    pl(inner,b.k,b.x+b.nx*.052,Y,b.z,.01,.125,.54);
    for(let j=0;j<4;j++){const z=b.z+(j-1.5)*.125,x=b.x+b.nx*.07,i=b.k*8+j*2;
      pl(caps,i,x,Y+.043,z,.036,.012,.036);pl(caps,i+1,x,Y-.043,z,.036,.012,.036);
      const wi0=b.k*10+j*2;pl(wires,wi0,x,Y+.066,z,.006,.034,.006);wires.setColorAt(wi0,C.setHex(j%2?0xc01818:0xe8c020));
      pl(wires,wi0+1,x,Y-.066,z,.006,.034,.006);wires.setColorAt(wi0+1,C.setHex(j%2?0xe8c020:0xc01818))}
    pl(wires,b.k*10+8,b.x+b.nx*.07,Y+.085,b.z,.006,.006,.5);wires.setColorAt(b.k*10+8,C.setHex(0xe8c020));
    pl(wires,b.k*10+9,b.x+b.nx*.07,Y-.085,b.z,.006,.006,.5);wires.setColorAt(b.k*10+9,C.setHex(0xc01818));
    paintFuse(b);placeDoor(b,0)});
  function wiKey(b){return b.wi}
  [inner,caps,wires].forEach(m=>{m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true});
  // abre/fecha a tampa (alvo do tiro/uso: ver breakerTarget em breaker-panels.js e useAct em ammo-crates.js)
  window.fbDoor=function(wi){const b=FBX.k[wi];if(!b)return;FBX.tg[wi]=FBX.tg[wi]>.5?0:1;try{nz(.05,.5,1800,1,3,.1,'bandpass')}catch(e){}};
  // fusível físico j (0..3, ao longo de z) alimenta os 2 corredores vizinhos; zs<0 inverte a ordem
  window.fbJ=function(wi,ci){const b=FBX.k[wi];return !b||b.zs>0?ci>>1:3-(ci>>1)};
  window.fbOk=function(wi,ci){const a=FBX.fz[wi];return !a||a[fbJ(wi,ci)]===1};
  function repower(wi,j){for(let ci=0;ci<NCOR;ci++)if(fbJ(wi,ci)===j)applyPower(wi,ci,false)}
  window.fbSet=function(wi,j,st,quiet){const a=FBX.fz[wi],b=FBX.k[wi];if(!a||a[j]===st)return;const was=a[j];a[j]=st;paintFuse(b);repower(wi,j);
    if(!quiet){try{if(st===0){SV=attn(b.x,b.z);nz(.12,.5,1800,1,2,.2);tn(900,120,.1,.2,'sawtooth');SV=1;sparkShower(new THREE.Vector3(b.x+b.nx*.12,1.335,b.z+(j-1.5)*.125),18)}
      else if(st===1){SV=attn(b.x,b.z);tn(520,780,.08,.12,'square');nz(.04,.4,3000,2,1,.08,'bandpass');SV=1}}catch(e){}}};
  window.fbNear=function(bk){let j=0,bd=9;for(let q=0;q<4;q++){const d=Math.abs(bk.hz-(bk.b.z+(q-1.5)*.125));if(d<bd){bd=d;j=q}}return j};
  window.fbAnyBad=function(wi){const a=FBX.fz[wi];return !!a&&a.some(x=>x!==1)};
  // queima n fusíveis bons do quadro, escolha determinística pela semente (igual em todos os aparelhos)
  window.fbBurn=function(wi,seed,n){const a=FBX.fz[wi];if(!a)return;const r=blkRand(seed);
    for(let q=0;q<n;q++){const g=[0,1,2,3].filter(j=>a[j]===1);if(!g.length)return;fbSet(wi,g[Math.floor(r()*g.length)],0,false)}};
  window.fbHint=function(bk){const wi=bk.b.wi;if(!fbOpen(wi))return(isTouch?'USE':'[G]')+' ABRIR TAMPA';
    const j=fbNear(bk),st=FBX.fz[wi][j];
    if(st===1)return(isTouch?'USE':'[G]')+' FECHAR TAMPA';
    return st<0||st===0?(FSP.have>0?(isTouch?'USE':'[G]')+' TROCAR FUSÍVEL':'FUSÍVEL QUEIMADO · ACHE UM NOVO'):''};
  // com a mão do painel visível: faz o gesto (esquerda = abrir, direita = fechar) e a ação acontece no meio dele
  window.fbDoorUse=function(bk){if(W.pend||W.fx)return;
    if(W.bz>.5){const wi=bk.b.wi,op=fbOpen(wi),st=FBX.fz[wi][fbNear(bk)];
      if(op&&st!==1){fbDoorAct(bk);return}
      W.lid=!op?-1:(st===1?1:0);W.pdir=1;W.pend={lid:true,bk};W.poke=1;if(!W.lid)W.lid=0;return}
    fbDoorAct(bk)};
  window.fbDoorAct=function(bk){const wi=bk.b.wi;if(!fbOpen(wi)){fbDoor(wi);return}
    const j=fbNear(bk),st=FBX.fz[wi][j];
    if(st===1){fbDoor(wi);return}
    if(FSP.have<=0){feed('SEM FUSÍVEL NA MÃO');return}
    // trocar com a chave ligada dá choque
    let live=false;for(let ci=0;ci<NCOR;ci++)if(fbJ(wi,ci)===j&&SW[wi][ci])live=true;
    if(W.bz>.5){if(W.fx)return;W.fx={bk,j,t:0};W.lid=0;return}   // animação completa (breaker-hand.js) e depois fbInsertDone
    FSP.have--;FSP.hud();fbInsertDone(bk,j)};
  window.fbInsertDone=function(bk,j){const wi=bk.b.wi;
    let live=false;for(let ci=0;ci<NCOR;ci++)if(fbJ(wi,ci)===j&&SW[wi][ci])live=true;
    fbSet(wi,j,1);feed('FUSÍVEL TROCADO');NET.send({t:'fb',w:wi,j,s:1});
    if(live&&!PH.dead){hurt(10);sparkShower(new THREE.Vector3(bk.b.x+bk.b.nx*.12,1.335,bk.b.z+(j-1.5)*.125),14);feed('CHOQUE! DESLIGUE A CHAVE ANTES DE TROCAR')}};
  let last=performance.now();
  (function loop(){requestAnimationFrame(loop);const n=performance.now(),dt=Math.min(.1,(n-last)/1000);last=n;
    for(const k in FBX.k){const b=FBX.k[k],tg=FBX.tg[k]||0,t=FBX.t[k]||0;if(Math.abs(tg-t)<.002){if(t!==tg){FBX.t[k]=tg;placeDoor(b,tg)}continue}
      FBX.t[k]=t+(tg-t)*Math.min(1,dt*7);placeDoor(b,FBX.t[k])}})();
  addEventListener('keydown',e=>{if(e.repeat||e.code!=='KeyN'||typeof active==='undefined'||!active)return;
    const cp=camera.position;let nb=null,bd=1e9;for(const k in FBX.k){const b=FBX.k[k],d=Math.hypot(b.x-cp.x,b.z-cp.z);if(d<bd){bd=d;nb=b}}if(!nb)return;
    const a=FBX.fz[nb.wi];if(e.shiftKey){for(let j=0;j<4;j++)fbSet(nb.wi,j,1,true);return}
    const j=a.indexOf(1);if(j>=0){fbSet(nb.wi,j,0,false);NET.send({t:'fb',w:nb.wi,j,s:0})}});
})();

// ---------- ETAPA 2: fusíveis novos sobre as mesas dos escritórios + pegar (G) + contador ----------
// Cada galpão tem 5 mesas no escritório; um sorteio estável (igual para todos) coloca fusível em ~30% delas, então nem todo galpão tem.
const FSP={items:[],have:0,max:3,use:-1};
function fuseHave(){return FSP.have}
(function(){
  const DESKS=[[-17.5,17.5],[-14,17.5],[-17.5,21],[-14,21],[-12,23.5]],G=new THREE.BoxGeometry(1,1,1);
  const hs=(a,b)=>{let h=(Math.imul(a+1,73856093)^Math.imul(b+7,19349663))>>>0;h=Math.imul(h^h>>>15,2246822507)>>>0;h=Math.imul(h^h>>>13,3266489909)>>>0;return((h^h>>>16)>>>0)/4294967296};
  WH.forEach(w=>DESKS.forEach((d,k)=>{if(hs(w.i,k)<.4){
    const sc=hs(w.i+50,k);FSP.items.push({wi:w.i,x:w.x+w.s*(d[0]+(sc-.5)*.8),y:.815,z:w.z+w.s*(d[1]-.1+(sc-.5)*.2),ry:sc*6.28,got:false})}}));
  const n=FSP.items.length;if(!n)return;
  const gl=new THREE.InstancedMesh(G,new THREE.MeshBasicMaterial({color:0xffc860}),n),cp=new THREE.InstancedMesh(G,new THREE.MeshStandardMaterial({color:0xb0b0a8,roughness:.4,metalness:.8}),n*2);
  gl.frustumCulled=cp.frustumCulled=false;scene.add(gl);scene.add(cp);
  const O=new THREE.Object3D(),dir=new THREE.Vector3();
  function paint(){FSP.items.forEach((f,i)=>{const s=f.got?0:1;
    O.position.set(f.x,f.y+.015,f.z);O.rotation.set(0,0,Math.PI/2);O.rotation.y=f.ry;O.scale.set(.1*s,.028*s,.028*s);
    O.rotation.set(0,f.ry,0);O.scale.set(.05*s,.03*s,.03*s);
    // fusível deitado ao longo de X local, girado em Y
    O.position.set(f.x,f.y+.016,f.z);O.updateMatrix();gl.setMatrixAt(i,O.matrix);
    [-1,1].forEach((e,q)=>{O.position.set(f.x+Math.cos(f.ry)*e*.027,f.y+.016,f.z-Math.sin(f.ry)*e*.027);O.scale.set(.012*s,.034*s,.034*s);O.updateMatrix();cp.setMatrixAt(i*2+q,O.matrix)})});
    gl.instanceMatrix.needsUpdate=cp.instanceMatrix.needsUpdate=true}
  FSP.paint=paint;paint();
  // HUD do contador
  const hud=document.createElement('div');hud.id='fusehud';
  hud.style.cssText='position:fixed;left:14px;bottom:44px;z-index:5;font:700 13px monospace;letter-spacing:2px;color:#ffc860;text-shadow:0 0 6px #000;display:none;pointer-events:none';
  document.body.appendChild(hud);
  FSP.hud=()=>{hud.textContent='FUSÍVEIS '+'▮'.repeat(FSP.have)+'▯'.repeat(FSP.max-FSP.have);hud.style.display=FSP.have>0?'block':'none'};
  // alvo: o mais próximo na frente do jogador, ao alcance
  window.fuseTarget=function(){if(PH.dead)return null;const L0=Math.hypot(vf.x,vf.z);if(L0<.05)return null;let best=null,bd=1.9;
    FSP.items.forEach((f,i)=>{if(f.got)return;const dx=f.x-P.pos.x,dz=f.z-P.pos.z,d=Math.hypot(dx,dz);
      if(d<bd&&(vf.x*dx+vf.z*dz)/(L0*(d||1))>.5&&vf.y<.2){bd=d;best={i,dist:d}}});return best};
  // who: undefined = eu pego agora; -1 = só marcar (snapshot); id = alguém pegou (se for o meu id, a coleta é minha)
  let fzPend=0;
  window.fuseTake=function(i,remote,who){const f=FSP.items[i];if(!f||f.got)return;
    if(!remote){
      if(FSP.have>=FSP.max){feed('VOCÊ JÁ CARREGA '+FSP.max+' FUSÍVEIS');return}
      if(NET.on&&!NET.host){if(fzPend>performance.now())return;fzPend=performance.now()+1000;NET.send({t:'fzq',i});return}   // cliente pede ao anfitrião
      FSP.have++;feed('+1 FUSÍVEL');FSP.hud();who=NET.id;try{NET.send({t:'fz',i,w:NET.id})}catch(e){}}
    else if(who!==-1&&who===NET.id){if(FSP.have<FSP.max){FSP.have++;feed('+1 FUSÍVEL');FSP.hud()}}
    f.got=true;f.tg=performance.now();paint();if(who!==-1)try{SV=attn(f.x,f.z);nz(.03,.4,3200,2,1,.08,'bandpass');SV=1}catch(e){}};
  window.fuseRespawn=function(i){const f=FSP.items[i];if(!f||!f.got)return;f.got=false;paint()};
  // reposição: a cada 5 min o anfitrião (ou o jogo solo) devolve um fusível a uma mesa já esvaziada
  setInterval(()=>{if(NET.on&&!NET.host)return;const g=[];FSP.items.forEach((f,i)=>{if(f.got)g.push(i)});if(!g.length)return;
    const i=g[Math.floor(Math.random()*g.length)];fuseRespawn(i);NET.send({t:'fr',i})},300000);
  window.fuseHint=function(t){hint.textContent=(isTouch?'USE':'[G]')+' PEGAR FUSÍVEL';hint.style.display='block';useBtn.classList.add('show');FSP.use=t.i};
})();
