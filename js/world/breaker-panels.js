// [HORNCAM] js/world/breaker-panels.js
// ===== QUADRO DE DISJUNTORES: 8 chaves por galpão (7 corredores + escritório) =====
const NCOR=8,SW=WH.map(()=>{const lit=Math.random()<.3;return Array.from({length:NCOR},()=>lit&&Math.random()<.88)}), // ~70% dos galpões começam apagados
  LW=WH.map(()=>Array.from({length:NCOR},()=>[])),BRKW={};
lamps.forEach(L=>{if(L.wi!==undefined)LW[L.wi][L.cor].push(L)});
function applyPower(wi,ci,init){const on=SW[wi][ci];
  for(const L of LW[wi][ci]){L.off=L.dead||!on;if(on&&!L.dead)L.ont=init?9:-Math.random()*.55;else L.ont=-9}}  // ligar: partida escalonada com piscadas
const BX_G=new THREE.BoxGeometry(1,1,1),NB=Math.max(1,BRK.length),
  brkBody=new THREE.InstancedMesh(BX_G,new THREE.MeshStandardMaterial({color:0x4b535a,roughness:.55,metalness:.5}),NB),
  brkSlot=new THREE.InstancedMesh(BX_G,new THREE.MeshStandardMaterial({color:0x15181b,roughness:.8}),NB*NCOR),
  brkLev=new THREE.InstancedMesh(BX_G,new THREE.MeshStandardMaterial({color:0xe6e6e0,roughness:.5}),NB*NCOR),
  brkLed=new THREE.InstancedMesh(BX_G,new THREE.MeshBasicMaterial({color:0xffffff}),NB*NCOR),BK_C=new THREE.Color(),BK_O=new THREE.Object3D();
const BK_PITCH=.062;
function brkPlace(im,idx,x,y,z,sx,sy,sz){BK_O.position.set(x,y,z);BK_O.scale.set(sx,sy,sz);BK_O.updateMatrix();im.setMatrixAt(idx,BK_O.matrix)}
function brkVis(wi,ci){const b=BRKW[wi];if(!b)return;const k=b.k*NCOR+ci,on=SW[wi][ci],z=b.z+b.zs*(ci-3.5)*BK_PITCH;
  brkPlace(brkLev,k,b.x+b.nx*.07,1.47+(on?.028:-.028),z,.04,.05,.028);
  brkLed.setColorAt(k,BK_C.setHex(on?0x3dff7a:0xff3a2a));
  brkLev.instanceMatrix.needsUpdate=true;if(brkLed.instanceColor)brkLed.instanceColor.needsUpdate=true}
BRK.forEach((b,k)=>{b.k=k;BRKW[b.wi]=b;brkPlace(brkBody,k,b.x,1.5,b.z,.1,.5,.6);
  for(let ci=0;ci<NCOR;ci++){const z=b.z+b.zs*(ci-3.5)*BK_PITCH;brkPlace(brkSlot,k*NCOR+ci,b.x+b.nx*.052,1.47,z,.012,.1,.036);brkPlace(brkLed,k*NCOR+ci,b.x+b.nx*.053,1.64,z,.012,.022,.022);brkLed.setColorAt(k*NCOR+ci,BK_C.setHex(0xff3a2a))}});
[brkBody,brkSlot,brkLev,brkLed].forEach(m=>{m.frustumCulled=false;scene.add(m)});hitMeshes.push(brkBody);
for(let wi=0;wi<WH.length;wi++)for(let ci=0;ci<NCOR;ci++){applyPower(wi,ci,true);brkVis(wi,ci)}
function setBreaker(wi,ci,v,quiet){if(!SW[wi]||SW[wi][ci]===undefined||SW[wi][ci]===v)return;SW[wi][ci]=v;applyPower(wi,ci,false);brkVis(wi,ci);
  if(!quiet){try{tn(v?260:180,v?120:80,.14,.06,'square');nz(.06,.6,2500,1,3,.12);}catch(e){}}}
function breakerDoToggle(wi,ci){const v=!SW[wi][ci];setBreaker(wi,ci,v,false);NET.send({t:'sw',w:wi,c:ci,v:v?1:0})}
// com a mão do painel visível: o dedo faz um movimento leve para CIMA (liga) ou para BAIXO (desliga) e a chave troca no meio do gesto
function toggleBreaker(wi,ci){
  if(W.pend)return;
  if(W.bz>.5){W.pend={wi,ci};W.pdir=SW[wi][ci]?-1:1;W.poke=1;return}
  breakerDoToggle(wi,ci)}
let brkUse=null,brkNear=null; // brkNear: painel de frente a menos de BH_NEAR m (usa a pose de mão estendida)
// qual chave está sob a mira: interseção do raio da câmera com o plano frontal do quadro
function breakerTarget(){if(PH.dead||!BRK.length)return null;const cp=camera.position;let best=null;
  for(const b of BRK){const dx=b.x-cp.x,dz=b.z-cp.z;if(dx*dx+dz*dz>3.4*3.4)continue;
    if((cp.x-b.x)*b.nx<=0||Math.abs(vf.x)<.05)continue;
    const px=b.x+b.nx*.05,t=(px-cp.x)/vf.x;if(t<0||t>3.4)continue;
    const hy=cp.y+vf.y*t,hz=cp.z+vf.z*t;if(hy<1.15||hy>1.85)continue;
    const u=(hz-b.z)*b.zs/BK_PITCH+3.5;if(u<-.7||u>NCOR-.3)continue;
    const i=Math.max(0,Math.min(NCOR-1,Math.round(u)));if(!best||t<best.dist)best={b,i,dist:t}}
  return best}
// lâmpada piscando solta faísca (só perto do jogador, e nem todo apagão)
function lampSpark(L){const dx=L.pos.x-camera.position.x,dz=L.pos.z-camera.position.z;if(dx*dx+dz*dz>26*26||Math.random()<.45)return;
  sparkShower(L.pos,4+(Math.random()*6|0));SV=attn(L.pos.x,L.pos.z);try{nz(.1,.45,6000,1,2,.18,'highpass');}catch(e){}SV=1}
let lampAsgT=0;const LAMP_DUMMY={l:{position:{x:1e5,y:0,z:1e5}},occT:1};
function assignLamps(){const cx=camera.position.x,cz=camera.position.z,c=[];
  for(const L of RL){if(L.off)continue;const dx=L.pos.x-cx,dz=L.pos.z-cz;c.push([dx*dx+dz*dz,L])}
  c.sort((a,b)=>a[0]-b[0]);const keep=new Set(c.slice(0,LPOOL.length).map(q=>q[1])),free=[];
  for(const s of LPOOL){if(s.lamp&&keep.has(s.lamp))keep.delete(s.lamp);else{s.lamp=null;free.push(s)}}
  for(const L of keep){const s=free.pop();if(!s)break;s.lamp=L;s.l.position.set(L.pos.x,L.pos.y-L.ly,L.pos.z);s.l.distance=L.range}}
function lampTick(dt){
  // As lâmpadas comuns são estáticas: 100% acesas ou 100% apagadas.
  // Somente a lâmpada defeituosa executa animação de intensidade.
  lampAsgT-=dt;if(lampAsgT<=0){lampAsgT=.25;assignLamps()}
  let dirty=false;
  for(const L of lamps){let f=L.off?0:1,su=1;
    if(!L.off&&L.ont!==undefined&&L.ont<.4){L.ont+=dt;su=L.ont<0?0:(Math.sin(L.ont*70+L.ph*9)>-.2?1:.12)}
    L.su=su;let col=f*su;
    if(L.bad&&!L.off){
      L.glitchT-=dt;
      if(L.glitchT<=0){
        const r=Math.random();
        if(r<.12){L.glitchLevel=0;L.glitchHold=.045+Math.random()*.12;L.glitchPhase=1;lampSpark(L);}
        else if(r<.34){L.glitchLevel=.12+Math.random()*.22;L.glitchHold=.06+Math.random()*.16;L.glitchPhase=2;}
        else if(r<.40){L.glitchLevel=1.18+Math.random()*.22;L.glitchHold=.025+Math.random()*.05;L.glitchPhase=3;}
        else{L.glitchLevel=1;L.glitchHold=.35+Math.random()*1.8;L.glitchPhase=0;}
        L.glitchT=L.glitchHold;
      }
      const target=L.glitchLevel;
      L.f+=(target-L.f)*(1-Math.exp(-dt*(L.glitchPhase===0?7:38)));
      f=Math.max(0,Math.min(1.4,L.f));col=f*su;
    }else{L.f=f;}
    if(Math.abs(col-L.col)>.004){L.col=col;L.p.material.color.r=col;lampIM.setColorAt(L.id,LAMP_TMP.setScalar(col));dirty=true}
  }
  if(dirty)lampIM.instanceColor.needsUpdate=true;
  // Sem oclusão dinâmica, sem multiplicador de exposição e sem oscilações nas luzes normais.
  for(const s of LPOOL){const L=s.lamp;s.l.intensity=!L||L.off?0:L.base*(L.bad?L.f:1)*(L.su===undefined?1:L.su)}
}

// lanterna presa ao corpo
const flash=new THREE.SpotLight(0xfff2d0,0,30,Math.PI/6,.5,1.2);
flash.position.set(0,0,0); flash.target.position.set(0,0,-1);
camera.add(flash); camera.add(flash.target);
let flashOn=false;

