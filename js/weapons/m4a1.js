// [HORNCAM] js/weapons/m4a1.js
// mkMag fica aqui (antes dependia de hoisting do arquivo único e é usada logo abaixo)
function mkMag(p){for(let i=0;i<4;i++)bx(.03,.036,.052,0,-.018-.034*i,-.0025*i*i,gry,p,i*.07);bx(.032,.008,.056,0,-.14,-.0225,blk,p,.21);}
// ---------- M4A1 ----------
camera.near=.03; camera.updateProjectionMatrix();
const rim=new THREE.PointLight(0xffffff,.5,2); rim.position.set(0,.1,.2); camera.add(rim);
const MT=(c,r=.55,m=.25)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const blk=MT(0x1a1a1a),gry=MT(0x2c2e30),glove=MT(0x23271f,.9,0),sleeve=MT(0x2b3a2b,.95,0);
const gun=new THREE.Group(); camera.add(gun);
// Geometria antiga de arma fica como fallback até o OBJ tático terminar de carregar.
const legacyWeapon=new THREE.Group(); gun.add(legacyWeapon);
let mk4WeaponLoaded=false;
function bx(w,h,d,x,y,z,mat,p=legacyWeapon,rx=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.rotation.x=rx;p.add(m);return m;}
function cy(r,l,x,y,z,mat,p=legacyWeapon){const g=new THREE.CylinderGeometry(r,r,l,14);g.rotateX(Math.PI/2);const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);p.add(m);return m;}
bx(.045,.07,.2,0,-.012,0,blk); bx(.05,.055,.27,0,.035,-.02,gry); bx(.026,.01,.27,0,.066,-.03,blk);
cy(.03,.3,0,.012,-.31,gry); cy(.008,.2,0,.014,-.55,blk); cy(.013,.07,0,.014,-.66,blk);
// MK4 Tactical OBJ: eixo longo original X convertido para o eixo de mira -Z do jogo.
// A caixa delimitadora centraliza o modelo e a escala o ajusta ao rig FPS existente.
const mk4Pivot=new THREE.Group(); mk4Pivot.name='MK4_Tactical_Model'; gun.add(mk4Pivot);
function loadMK4Tactical(){
  if(!THREE.MTLLoader||!THREE.OBJLoader){console.warn('Loaders OBJ/MTL indisponíveis; mantendo arma de fallback.');return;}
  const assetPath='assets/';
  const mtlLoader=new THREE.MTLLoader();
  // Three.js r128 MTLLoader usa setResourcePath() (setTexturePath não existe).
  // O caminho é relativo ao index.html, portanto funciona também no GitHub Pages.
  mtlLoader.setPath(assetPath);
  if(typeof mtlLoader.setResourcePath==='function') mtlLoader.setResourcePath(assetPath);
  mtlLoader.load('MK4 Tactical.mtl', materials=>{
    materials.preload();
    const objLoader=new THREE.OBJLoader(); objLoader.setMaterials(materials); objLoader.setPath(assetPath);
    objLoader.load('MK4 Tactical.obj', object=>{
      object.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(object), center=bounds.getCenter(new THREE.Vector3());
      object.rotation.y=-Math.PI/2;
      object.position.copy(center).negate().applyAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);
      object.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;
        const mats=Array.isArray(node.material)?node.material:[node.material];
        mats.forEach(mat=>{if(mat.map){mat.map.anisotropy=ANISO;mat.map.minFilter=THREE.LinearMipmapLinearFilter;mat.map.magFilter=THREE.LinearFilter;}
          if(mat.bumpMap){mat.bumpMap.anisotropy=ANISO;mat.bumpScale=.035;} mat.needsUpdate=true;});
      }});
      mk4Pivot.add(object); mk4Pivot.scale.setScalar(.20); mk4Pivot.position.set(0,.018,-.12);
      legacyWeapon.visible=false; mk4WeaponLoaded=true;
      // calibra a boca do cano: pega os vértices mais à frente do modelo (no espaço da arma) e leva o clarão/traçante para o centro deles
      try{mk4Pivot.updateMatrixWorld(true);gun.updateMatrixWorld(true);
        const inv=new THREE.Matrix4().copy(gun.matrixWorld).invert(),vv=new THREE.Vector3(),MM=new THREE.Matrix4();let zMin=1e9,sx=0,sy=0,cn=0;
        const walk=cb=>object.traverse(nd=>{if(!nd.isMesh||!nd.geometry||!nd.geometry.attributes.position)return;const pa=nd.geometry.attributes.position;MM.multiplyMatrices(inv,nd.matrixWorld);
          for(let i=0;i<pa.count;i++){vv.fromBufferAttribute(pa,i).applyMatrix4(MM);cb(vv)}});
        walk(v=>{if(v.z<zMin)zMin=v.z});
        walk(v=>{if(v.z<zMin+.012){sx+=v.x;sy+=v.y;cn++}});
        if(cn)fl.position.set(sx/cn,sy/cn,zMin-.012);
      }catch(err){console.warn('Calibração da boca do cano falhou:',err)}
      // O carregador do OBJ substitui o carregador procedural; o grupo continua no rig para preservar a animação de recarga.
      mag.clear(); mag2.clear();
      console.info('MK4 Tactical carregada',bounds.getSize(new THREE.Vector3()));
    },undefined,error=>{console.error('Falha ao carregar MK4 Tactical OBJ:',error);legacyWeapon.visible=true;});
  },undefined,error=>{console.error('Falha ao carregar materiais MK4:',error);legacyWeapon.visible=true;});
}
loadMK4Tactical();
// Lança-granadas tubular sob o cano: corpo, boca reforçada, anéis e conjunto de carregamento.
const glMat=MT(0x242729,.48,.72),glEdge=MT(0x45494a,.38,.78),glDark=MT(0x101213,.72,.35);
const launcher=new THREE.Group(); launcher.position.set(0,-.047,-.405); gun.add(launcher);
let launcherEquipped=true;
// O eixo do cilindro acompanha o cano principal (eixo Z, apontado para -Z).
const launcherHinge=new THREE.Group(); launcherHinge.position.z=-.165; launcher.add(launcherHinge);
const launcherTube=new THREE.Group(); launcherTube.position.z=.165; launcherHinge.add(launcherTube);
cy(.031,.34,0,0,0,glMat,launcherTube);
cy(.034,.018,0,0,-.164,glEdge,launcherTube);
cy(.025,.012,0,0,-.176,glDark,launcherTube);
cy(.034,.014,0,0,.165,glEdge,launcherTube);
// A extremidade traseira (+Z) é a entrada de recarga: aro aberto, sem tampa sólida.
const breechEntryRing=new THREE.Mesh(new THREE.TorusGeometry(.025,.0028,8,24),glDark);
breechEntryRing.position.set(0,0,.176); launcherTube.add(breechEntryRing);
// Trilhos de fixação e abraçadeiras ao redor do tubo.
for(const z of [-.115,.105]){cy(.036,.012,0,0,z,glEdge,launcherTube);}
const launcherRail=bx(.018,.018,.24,.037,.018,0,glDark,launcherTube); launcherRail.rotation.z=.08;
const launcherLatch=bx(.018,.026,.045,.037,-.006,.115,glEdge,launcherTube); launcherLatch.rotation.x=.18;
const iron=[bx(.012,.087,.012,0,.0615,-.5,blk),bx(.022,.014,.032,0,.025,-.5,blk),bx(.008,.03,.012,-.013,.08,.07,blk),bx(.008,.03,.012,.013,.08,.07,blk)];
cy(.019,.16,0,.025,.17,gry); bx(.04,.07,.09,0,0,.22,blk);
bx(.03,.085,.04,0,-.075,.075,blk,gun,-.35); bx(.04,.03,.07,0,-.045,-.04,blk);
// Lanterna tática acoplada ao lado do handguard; acompanha o estado da tecla 1.
const flashlightAttachment=new THREE.Group();flashlightAttachment.position.set(-.052,.012,-.39);flashlightAttachment.visible=false;gun.add(flashlightAttachment);
const flashlightBody=new THREE.Mesh(new THREE.CylinderGeometry(.012,.014,.105,12),MT(0x171a1b,.42,.72));flashlightBody.rotation.x=Math.PI/2;flashlightBody.position.z=-.005;flashlightAttachment.add(flashlightBody);
const flashlightLens=new THREE.Mesh(new THREE.CircleGeometry(.010,16),new THREE.MeshBasicMaterial({color:0xc9d8d0,transparent:true,opacity:.9}));flashlightLens.position.z=-.059;flashlightAttachment.add(flashlightLens);
const flashlightRing=new THREE.Mesh(new THREE.TorusGeometry(.012,.002,6,16),MT(0x55595a,.35,.8));flashlightRing.position.z=-.059;flashlightAttachment.add(flashlightRing);
const ch=bx(.026,.012,.035,0,.073,.115,blk);
const mag=new THREE.Group(); mag.position.set(0,-.05,-.07); mag.rotation.x=.12; gun.add(mag); mkMag(mag);
const cuff=MT(0x14161a,.8,0),pad=MT(0x1b1d1a,.7,.1);
function ball(c,r,s,mat,p){const m=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),mat);m.position.fromArray(c);m.scale.set(s[0],s[1],s[2]);p.add(m);return m;}
function chain(pts,r,mat,p,tp=.9){let rr=r;const S=(c,q)=>{const s=new THREE.Mesh(new THREE.SphereGeometry(q,10,8),mat);s.position.fromArray(c);p.add(s);};S(pts[0],rr);
  for(let i=1;i<pts.length;i++){const A=new THREE.Vector3().fromArray(pts[i-1]),B=new THREE.Vector3().fromArray(pts[i]),d=B.clone().sub(A),L=d.length(),r2=rr*tp;
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,rr,L,10),mat);m.position.copy(A).add(B).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());p.add(m);S(pts[i],r2);rr=r2;}}
const rh=new THREE.Group(); gun.add(rh);
ball([.008,-.075,.108],.028,[.85,1.5,.8],glove,rh);
ball([.02,-.05,.118],.02,[1.2,.7,1.4],pad,rh);
for(let i=0;i<3;i++){const y=-.062-.017*i,z=i*.005;chain([[.022,y,.1+z],[.022,y,.05+z],[0,y,.04+z],[-.017,y,.058+z]],.0088-.0004*i,glove,rh,.93);}
chain([[.022,-.05,.09],[.024,-.04,.05],[.026,-.031,.015]],.0085,glove,rh,.93);
chain([[-.01,-.045,.105],[-.024,-.04,.07],[-.03,-.03,.03]],.0095,glove,rh,.93);
chain([[.025,-.075,.14],[.032,-.085,.18]],.031,cuff,rh,1.02);
chain([[.032,-.085,.18],[.12,-.21,.54]],.034,sleeve,rh,1.15);
const LH=new THREE.Vector3(0,-.022,-.3);
const lh=new THREE.Group(); lh.position.set(0,-.075,-.355); gun.add(lh);
// Cartucho explosivo 40 mm: corpo cilíndrico, ogiva arredondada e base metálica.
const grenadeProp=new THREE.Group(); grenadeProp.position.set(-.16,-.22,-.20); grenadeProp.rotation.set(0,0,0); grenadeProp.visible=false; gun.add(grenadeProp);
const roundMat=MT(0x596247,.72,.22), brassMat=MT(0x887044,.32,.78), roundDark=MT(0x30352b,.62,.35);
const grenadeBody=new THREE.Mesh(new THREE.CylinderGeometry(.0185,.0195,.086,16,1),roundMat); grenadeBody.rotation.x=Math.PI/2; grenadeProp.add(grenadeBody);
const grenadeNose=new THREE.Mesh(new THREE.SphereGeometry(.0185,16,10,0,Math.PI*2,0,Math.PI/2),roundMat); grenadeNose.rotation.x=-Math.PI/2; grenadeNose.position.z=-.043; grenadeProp.add(grenadeNose);
const grenadeBase=new THREE.Mesh(new THREE.CylinderGeometry(.0195,.0195,.012,16),brassMat); grenadeBase.rotation.x=Math.PI/2; grenadeBase.position.z=.047; grenadeProp.add(grenadeBase);
const grenadeRim=new THREE.Mesh(new THREE.TorusGeometry(.019,.0028,6,16),brassMat); grenadeRim.position.z=.052; grenadeProp.add(grenadeRim);
const grenadeBand=new THREE.Mesh(new THREE.TorusGeometry(.019,.0015,5,16),roundDark); grenadeBand.position.z=.022; grenadeProp.add(grenadeBand);
const fg=new THREE.Group(); fg.position.set(0,.034,-.01); lh.add(fg);
ball([-.032,.01,0],.026,[.8,.8,1.7],glove,lh);
ball([-.03,.028,0],.02,[.9,.6,1.6],pad,lh);
[-.04,-.014,.012,.036].forEach((z,i)=>{const R=.0385,pts=[195,245,295,345,35].map(a=>[R*Math.cos(a*Math.PI/180),R*Math.sin(a*Math.PI/180),z]);chain(pts,.0085-.0006*i,glove,fg,.95);});
chain([[-.036,.02,.04],[-.04,.04,-.01],[-.036,.055,-.05]],.0095,glove,lh,.93);
chain([[-.034,0,.045],[-.04,-.012,.085]],.03,cuff,lh,1.02);
// O antebraço não fica mais rigidamente preso ao punho: os segmentos
// são atualizados em espaço da arma para o cotovelo acompanhar a mão.
const armShoulder=new THREE.Vector3(-.16,-.225,.105);
function makeArmBone(r1,r2){const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,1,12),sleeve);gun.add(m);return m;}
const upperArmBone=makeArmBone(.037,.033), foreArmBone=makeArmBone(.032,.027);
const elbowJoint=new THREE.Mesh(new THREE.SphereGeometry(.031,12,10),sleeve);gun.add(elbowJoint);
function poseArmBone(mesh,a,b){const d=b.clone().sub(a),len=d.length();mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());mesh.scale.set(1,len,1);}

// Polegar articulado visualmente: durante a inserção, a ponta encosta na base traseira do cartucho.
const loadingThumb=new THREE.Group(); loadingThumb.visible=false; lh.add(loadingThumb);
const thumbMat=glove;
const thumbRoot=new THREE.Mesh(new THREE.SphereGeometry(.0105,10,8),thumbMat); loadingThumb.add(thumbRoot);
const thumbLink=new THREE.Mesh(new THREE.CylinderGeometry(.0075,.010,1,10),thumbMat); loadingThumb.add(thumbLink);
const thumbTip=new THREE.Mesh(new THREE.SphereGeometry(.009,10,8),thumbMat); loadingThumb.add(thumbTip);
const mag2=new THREE.Group(); mag2.position.set(0,.042,-.01); mag2.rotation.x=.12; mag2.visible=false; lh.add(mag2); mkMag(mag2);
const fl=new THREE.Group(); fl.position.set(0,.014,-.71); fl.visible=false; gun.add(fl);
const fm=new THREE.MeshBasicMaterial({color:0xffc070,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
for(let i=0;i<2;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(.16,.16),fm);p.rotation.z=i*Math.PI/4;fl.add(p);}
const fli=new THREE.PointLight(0xffa040,0,10); fl.add(fli);
const W={ads:0,sp:0,aim:false,trig:false,cd:0,mag:30,res:120,rl:false,t:0,pt:0,empty:false,filled:false,rk:0,rz:0,fl:0,ly:0,lp:0};
// Camada procedural de animações cinematográficas da arma (sem substituir o rig existente).
const WA={inspectT:-1,switchT:-1,switchFrom:false,switchTo:true,grenadeKick:0,grenadeRecover:0};
const easeOut3=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
const ammoEl=document.getElementById('ammo');
const updAmmo=()=>{ammoEl.textContent='MK4 TACTICAL '+W.mag+'/'+W.res+' '+(W.auto?'AUTO':'SEMI')+(W.hs?' | HOLO':'')+' | LUZ '+(flashOn?'ON':'OFF')+' | GL '+(launcherEquipped?'ON':'OFF')+' | EXP '+blastAmmo+'/3'+(grenadeReady?' [PRONTO]':grenadeLoading?' [CARREGANDO]':'');};
let SV=1;
let AC; function snd(d,g){try{AC=AC||new AudioContext();const n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);const s=AC.createBufferSource(),G=AC.createGain();G.gain.value=g;s.buffer=b;s.connect(G);G.connect(mg(AC));s.start();}catch(e){}}
const ss=(a,b,t)=>{t=Math.max(0,Math.min(1,(t-a)/(b-a)));return t*t*(3-2*t);};
const cl=(v,m)=>Math.max(-m,Math.min(m,v));
const WP=[[0,0,0,0],[.3,0,0,0],[.6,0,-.07,.24],[.8,0,-.07,.24],[1,-.04,-.27,.15],[1.15,-.04,-.27,.15],[1.4,0,-.16,.24],[1.6,0,-.07,.24],[1.9,0,0,0]];
function wp(t){if(t>=1.9)return[0,0,0];for(let i=1;i<WP.length;i++){if(t<=WP[i][0]){const a=WP[i-1],b=WP[i],k=ss(a[0],b[0],t);return[0,1,2].map(j=>a[j+1]+(b[j+1]-a[j+1])*k);}}return[0,0,0];}
function reload(){if(W.rl||W.mag>=30||W.res<=0)return;W.rl=true;W.t=0;W.pt=0;W.empty=W.mag===0;W.filled=false;}
function shoot(){W.mag--;W.cd=.085;W.rk+=.02;W.rz+=.035;W.fl=.05;W.bk=1;W.bs++;W.bt=.3;
  const n=Math.min(W.bs,12);P.pitch=Math.min(1.45,P.pitch+.0025+n*.0004);P.yaw+=Math.sin(W.bs*.8)*.0028+(Math.random()-.5)*.0012;
  if(W.mag===0)W.lock=true; sfx('shot'); updAmmo(); eject(); NET.send({t:'sh'}); hit();}
addEventListener('mousedown',e=>{if(document.pointerLockElement!==canvas)return;if(e.button===0)W.trig=true;if(e.button===2)W.aim=true;});
addEventListener('mouseup',e=>{if(e.button===0)W.trig=false;if(e.button===2)W.aim=false;});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if(e.code==='KeyR')reload();});
document.querySelectorAll('.btn').forEach(b=>{const a=b.dataset.a;
  if(a==='aim'||a==='fire'){const k=a==='aim'?'aim':'trig';b.addEventListener('pointerdown',e=>{e.preventDefault();W[k]=true;b.classList.add('on');});['pointerup','pointercancel','pointerleave'].forEach(v=>b.addEventListener(v,()=>{W[k]=false;b.classList.remove('on');}));}
  if(a==='reload')b.addEventListener('pointerdown',e=>{e.preventDefault();reload();});
});
function weaponUpdate(dt,sprint,sp,amp){
  const k=r=>1-Math.exp(-dt*r);
  W.cd-=dt; W.fl-=dt;
  let p=0,off=[0,0,0];
  if(WA.inspectT>=0){WA.inspectT+=dt;if(WA.inspectT>=3.05)WA.inspectT=-1;}
  if(WA.switchT>=0){
    WA.switchT+=dt;
    const q=Math.max(0,Math.min(1,WA.switchT/.52));
    const sc=WA.switchTo?easeOut3(q):1-easeOut3(q);
    launcher.scale.setScalar(Math.max(.001,sc));
    if(WA.switchT>=.52){WA.switchT=-1;launcher.visible=launcherEquipped;launcher.scale.setScalar(1);}
  }
  WA.grenadeKick*=Math.exp(-dt*8.5);
  WA.grenadeRecover=Math.min(1,WA.grenadeRecover+dt*2.8);
  if(grenadeLoading){grenadeLoadT+=dt;if(grenadeLoadT>=2.02){grenadeLoading=false;grenadeReady=true;grenadeProp.visible=false;launcherHinge.rotation.x=0;updAmmo();feed('CILINDRO FECHADO · LANÇA-GRANADAS PRONTO');}}
  // Quebra do conjunto: a traseira do cilindro baixa, a mão busca a carga,
  // introduz o cartucho na câmara e ergue o tubo até travar novamente.
  const loadT=grenadeLoadT;
  const breechOpen=ss(.02,.38,loadT)*(1-ss(1.62,1.98,loadT));
  // Abertura traseira com pequena pausa antes da mão iniciar a inserção.
  launcherHinge.rotation.x=.38*breechOpen;
  // Mede a entrada traseira diretamente na geometria do tubo. Assim, a boca
  // acompanha a rotação real da dobradiça, em vez de usar um ponto fixo aproximado.
  launcherTube.updateMatrixWorld(true); gun.updateMatrixWorld(true);
  const tubeWorldQ=new THREE.Quaternion(),gunWorldQ=new THREE.Quaternion();
  launcherTube.getWorldQuaternion(tubeWorldQ); gun.getWorldQuaternion(gunWorldQ);
  const tubeQGun=gunWorldQ.clone().invert().multiply(tubeWorldQ);
  const breechMouthGun=gun.worldToLocal(launcherTube.localToWorld(new THREE.Vector3(0,0,.176)));
  const breechAxisGun=new THREE.Vector3(0,0,1).applyQuaternion(tubeQGun).normalize();
  // A base traseira do cartucho fica a 52 mm do centro; encosta exatamente na boca.
  // Origem do cartucho fica 52 mm à frente da entrada: sua base (+Z) coincide com a boca traseira.
  const breechPos=breechMouthGun.clone().addScaledVector(breechAxisGun,-.052);
  const pull=ss(.34,.78,loadT),toBreech=ss(.82,1.30,loadT),insert=ss(1.30,1.60,loadT),returnGrip=ss(1.62,1.98,loadT);
  grenadeProp.visible=grenadeMode&&grenadeLoading&&loadT<1.68;
  const vestPos=new THREE.Vector3(-.16,-.22,-.20),handPos=new THREE.Vector3(-.115,-.135,-.31);
  grenadeProp.position.copy(vestPos).lerp(handPos,pull).lerp(breechPos,toBreech);
  grenadeProp.position.addScaledVector(breechAxisGun,-.090*insert);
  const handAmmoQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(.10*(1-toBreech),.12*(1-toBreech),-.22*(1-pull)*(1-toBreech)));
  grenadeProp.quaternion.copy(handAmmoQ).slerp(tubeQGun,toBreech);
  const grenadeReach=grenadeMode?(grenadeReady?0:ss(.34,.78,loadT)*(1-returnGrip)):0;
  if(W.rl){
    const T=W.empty?2.7:2.2; W.pt=W.t; W.t+=dt; const t=W.t;
    for(const [e,n] of [[.6,'rel'],[.95,'drop'],[1.6,'ins'],[2,'bolt'],[2.25,'bolt2']]) if(W.pt<e&&t>=e&&(!n.startsWith('bolt')||W.empty)) sfx(n);
    if(W.empty&&t>=2.2) W.lock=false;
    if(t>=1.6&&!W.filled){W.filled=true;W.res+=W.mag;W.mag=Math.min(30,W.res);W.res-=W.mag;updAmmo();}
    p=ss(0,.3,t)*(1-ss(T-.5,T,t)); off=wp(t);
    if(t<.6){mag.visible=true;mag.position.y=-.05;mag.rotation.x=.12;}
    else if(t<.95){mag.visible=true;mag.position.y=-.05-(t-.6)*(t-.6)*6;mag.rotation.x=.12+(t-.6)*3;}
    else if(t<1.6) mag.visible=false;
    else{mag.visible=true;mag.position.y=-.05;mag.rotation.x=.12;}
    mag2.visible=t>=1&&t<1.6;
    ch.position.z=.115+(W.empty?.07*(ss(1.95,2.15,t)-ss(2.2,2.4,t)):0);
    if(t>=T) W.rl=false;
  }else{mag.visible=true;mag.position.y=-.05;mag.rotation.x=.12;mag2.visible=false;ch.position.z=.115;}
  const reach=grenadeMode?(grenadeReady?0:grenadeReach):0;
  const handLoad=grenadeMode&&grenadeLoading;
  const handToVest=ss(.34,.78,loadT),handToTube=ss(.82,1.34,loadT),handReturn=ss(1.62,1.98,loadT);
  const gripBase=launcherEquipped?new THREE.Vector3(0,-.075,-.355):new THREE.Vector3(0,-.018,-.285);
  const baseLH=new THREE.Vector3(gripBase.x+off[0],gripBase.y+off[1]-.075*reach,gripBase.z+off[2]-.22*reach);
  if(handLoad){
    const vestHand=new THREE.Vector3(-.105,-.17,.20),loadHand=new THREE.Vector3(-.018,-.105,-.205);
    const moving=vestHand.clone().lerp(loadHand,handToTube).lerp(new THREE.Vector3(0,0,0),handReturn);
    baseLH.x+=moving.x*(1-handReturn);baseLH.y+=moving.y*(1-handReturn);baseLH.z+=moving.z*(1-handReturn);
    // A mão acompanha o cartucho e, ao terminar, firma-se sob o cilindro.
    lh.rotation.set(-.24*handToTube*(1-handReturn),.08*handToTube*(1-handReturn),-.30*handToVest*(1-handReturn));
  }else if(grenadeMode&&grenadeReady){baseLH.x+=-.012;baseLH.y+=-.012;baseLH.z+=-.035;lh.rotation.set(-.08,.02,-.10);fg.rotation.set(0,0,0);}
  else{lh.rotation.set(0,0,0);fg.rotation.set(0,0,0);}
  lh.position.copy(baseLH);
  // Cotovelo articulado: ombro permanece ancorado, enquanto o antebraço
  // acompanha a mão até o cartucho. O cotovelo dobra progressivamente na busca
  // ao colete e na aproximação do cilindro, evitando braço rígido/deslocado.
  const cuffWrist=lh.position.clone().add(new THREE.Vector3(-.04,-.012,.085));
  const elbow=armShoulder.clone().lerp(cuffWrist,.53);
  elbow.x-=.025+.018*handToTube;
  elbow.y-=.028+.025*handToVest;
  elbow.z+=.012;
  poseArmBone(upperArmBone,armShoulder,elbow);
  poseArmBone(foreArmBone,elbow,cuffWrist);
  elbowJoint.position.copy(elbow);
  // Atualiza a transformação da mão e mantém o cartucho apoiado na palma durante a retirada.
  gun.updateMatrixWorld(true);
  lh.updateMatrixWorld(true);
  const palmSocket=gun.worldToLocal(lh.localToWorld(new THREE.Vector3(-.018,.012,-.035)));
  const heldPos=vestPos.clone().lerp(palmSocket,pull);
  grenadeProp.position.copy(heldPos).lerp(breechPos,toBreech);
  grenadeProp.position.addScaledVector(breechAxisGun,-.090*insert);
  grenadeProp.quaternion.copy(handAmmoQ).slerp(tubeQGun,toBreech);
  // A palma acompanha fisicamente o cartucho: durante a aproximação e a inserção,
  // reposiciona a mão para que o centro da palma permaneça junto ao corpo da munição.
  if(handLoad && loadT>=.72 && loadT<1.68){
    gun.updateMatrixWorld(true);
    lh.updateMatrixWorld(true);
    grenadeProp.updateMatrixWorld(true);
    // Socket de empunhadura: o cartucho fica à frente da palma, apoiado
    // contra a lateral dos dedos, em vez de passar por baixo da mão.
    // O ponto (.004,.012,-.008) é a área de contato entre palma/dedos e corpo.
    const ammoGripSocket=new THREE.Vector3(.004,.012,-.008);
    const gripOffset=ammoGripSocket.clone().applyQuaternion(lh.quaternion);
    const grenadeCenterGun=gun.worldToLocal(grenadeProp.localToWorld(new THREE.Vector3(0,0,0)));
    const handTarget=grenadeCenterGun.sub(gripOffset);
    const handFollow=ss(.70,.88,loadT)*(1-ss(1.58,1.70,loadT));
    lh.position.lerp(handTarget,handFollow);
    lh.updateMatrixWorld(true);
    // Mantém a palma e os dedos fechados em torno do cartucho durante a pegada.
    const gripCurl=ss(.72,.90,loadT)*(1-ss(1.54,1.68,loadT));
    fg.rotation.x=-.18*gripCurl;
    fg.rotation.y=.10*gripCurl;
    const finalWrist=lh.position.clone().add(new THREE.Vector3(-.04,-.012,.085));
    const finalElbow=armShoulder.clone().lerp(finalWrist,.53);
    finalElbow.x-=.025+.018*handToTube;
    finalElbow.y-=.028+.025*handToVest;
    finalElbow.z+=.012;
    poseArmBone(upperArmBone,armShoulder,finalElbow);
    poseArmBone(foreArmBone,finalElbow,finalWrist);
    elbowJoint.position.copy(finalElbow);
  }
  // O polegar fica exatamente atrás da base do cartucho e avança com ele na fase de inserção.
  loadingThumb.visible=handLoad&&loadT>1.10&&loadT<1.76;
  if(loadingThumb.visible){
    const thumbStart=new THREE.Vector3(-.030,.018,.025);
    const rearWorld=grenadeProp.localToWorld(new THREE.Vector3(0,0,.052));
    const thumbEnd=lh.worldToLocal(rearWorld);
    thumbRoot.position.copy(thumbStart); thumbTip.position.copy(thumbEnd);
    const d=thumbEnd.clone().sub(thumbStart); thumbLink.position.copy(thumbStart).add(thumbEnd).multiplyScalar(.5);
    thumbLink.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());
    thumbLink.scale.set(1,d.length(),1);
  }
  const gt=W.rl?W.t:0,gr=W.rl?ss(.35,.55,gt)-ss(.65,.8,gt)+ss(.95,1.05,gt)-ss(1.6,1.8,gt):0,gs=1-.55*gr; fg.scale.set(gs,gs,1);
  if(!W.trig)W.tl=false;
  if(W.trig&&!PH.dead&&!sprint&&W.wp<.5&&WA.inspectT<0&&WA.switchT<0){
    if(grenadeMode){if(!W.tl){W.tl=true;if(grenadeReady){if(throwBlast()){WA.grenadeKick=1;WA.grenadeRecover=0;grenadeMode=false;grenadeLoading=false;grenadeReady=false;grenadeProp.visible=false;grenadeLoadT=0;launcherHinge.rotation.x=0;lh.rotation.set(0,0,0);W.trig=false;W.tl=false;updAmmo();}}}}
    else if(!W.rl&&W.cd<=0&&(W.auto||!W.tl)){W.tl=true;if(W.mag>0)shoot();else if(W.res>0)reload();else{sfx('rel');W.cd=.25;}}
  }
  fl.visible=W.fl>0; fli.intensity=W.fl>0?4:0; fl.rotation.z=Math.random()*3;
  W.ads+=((W.aim&&!W.rl&&!sprint&&W.wp<.5&&WA.inspectT<0&&WA.switchT<0?1:0)-W.ads)*k(12);
  W.sp+=((sprint&&!W.rl?1:0)-W.sp)*k(8);
  W.ly+=(P.yaw-W.ly)*k(9); W.lp+=(P.pitch-W.lp)*k(9);
  W.rk*=Math.exp(-dt*14); W.rz*=Math.exp(-dt*12);
  fxTick(dt,sprint,sp);
  const a=W.ads,h=1-a,s=W.sp;
  const bX=Math.cos(P.bobT)*.012*amp*(1-a*.8),bY=-Math.abs(Math.sin(P.bobT))*.014*amp*(1-a*.7),br=Math.sin(time*1.6)*.002*(1-a*.5);
  // Pose exclusiva da recarga: a boca do cano aponta suavemente para a
  // esquerda e para cima no enquadramento do jogador. A pose desaparece
  // gradualmente ao concluir a animação.
  const launcherReloadPose=grenadeMode&&grenadeLoading
    ? ss(.08,.42,loadT)*(1-ss(1.72,2.02,loadT)) : 0;
  gun.position.set(-.1*h+.08*p-.02*s+bX+cl((W.ly-P.yaw)*.25,.04)+.012*launcherReloadPose,
    -.34+.252*a+.15*p-.05*s+bY+br-P.landKick*1.2+cl((W.lp-P.pitch)*.25,.04)-.008*launcherReloadPose,
    -.46+.14*a+.04*s+W.rz*(1-a*.5));
  gun.rotation.set(W.rk*1.5+.22*p-.35*s+cl((W.lp-P.pitch)*.8,.12)+Math.sin(P.bobT*2)*.01*amp+.075*launcherReloadPose,
    .7*s+cl((W.ly-P.yaw)*.8,.15)+.12*launcherReloadPose,
    -.4*p+.15*s-.19*launcherReloadPose);

  // INSPEÇÃO (tecla I): arco de apresentação, giro lateral e retorno amortecido.
  if(WA.inspectT>=0){
    const it=WA.inspectT,enter=ss(0,.42,it),hold=ss(.42,.62,it)*(1-ss(2.35,2.95,it)),leave=ss(2.35,3.05,it);
    const pose=(enter*(1-leave));
    const wave=Math.sin(Math.min(1,it/2.95)*Math.PI);
    gun.position.x+=.012*pose+.025*wave;
    gun.position.y+=.105*pose+.025*hold;
    gun.position.z+=.075*pose;
    gun.rotation.x+=.34*pose+.045*Math.sin(it*3.2)*hold;
    gun.rotation.y+=.62*pose;
    gun.rotation.z+=-.24*pose;

    // Finalização da inspeção: gira a arma em torno do eixo do cano,
    // levando o pente para a direita do enquadramento antes de voltar ao idle.
    const magazineTurn=ss(2.35,2.62,it)*(1-ss(2.78,3.05,it));
    gun.rotation.z+=.95*magazineTurn;
  }

  // Transição de equipamento: pequena elevação e rotação coordenadas com a escala do lançador.
  if(WA.switchT>=0){
    const st=WA.switchT/.52,sw=Math.sin(Math.PI*Math.max(0,Math.min(1,st)));
    gun.position.y+=.035*sw;
    gun.position.x+=(WA.switchTo?-.025:.025)*sw;
    gun.rotation.x+=-.10*sw;
    gun.rotation.z+=(WA.switchTo?-.075:.075)*sw;
  }

  // Disparo do lançador: recuo mais forte que o tiro comum, seguido de recuperação elástica.
  if(WA.grenadeKick>.001){
    const kick=WA.grenadeKick;
    gun.position.z+=.105*kick;
    gun.position.y-=.035*kick;
    gun.rotation.x-=.24*kick;
    gun.rotation.z+=.035*kick;
    camera.rotation.x-=.035*kick;
  }
  camera.rotation.x+=W.rk*.5;
  fxPost(dt,a);
  const tH=Math.tan(camera.fov*Math.PI/360)*camera.aspect; helm.position.x=-((.8+.5*a)*tH*.15+.055);
}
// capacete: camera presa ao lado direito dele, casco aparece na borda esquerda
const helm=new THREE.Group(); camera.add(helm);
const hm=MT(0x1d201a,.75,.1);
const hs=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),hm); hs.scale.set(.055,.045,.11); helm.add(hs);
bx(.012,.022,.1,.05,.012,-.01,gry,helm); bx(.03,.025,.05,.03,-.035,-.05,blk,helm);
helm.position.set(-.25,.02,-.15);
// capacete também na câmera do menu (mesmo casco na borda esquerda, como na câmera do jogador)
const menuHelm=helm.clone(true);menuHelm.traverse(o=>{if(o.isMesh){o.material=new THREE.MeshBasicMaterial({color:o.material.color.clone().multiplyScalar(1.9),transparent:true});o.renderOrder=100;}}); // transparent+renderOrder alto: desenha por último, por cima das TVs/brilhos/LEDs do menu (que são transparentes e depthTest:false)
menuScene.add(menuCam);menuCam.add(menuHelm);
