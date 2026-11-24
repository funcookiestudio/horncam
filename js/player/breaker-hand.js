// [HORNCAM] js/player/breaker-hand.js
// ---------- Painel de disjuntores: a arma é recolhida (só a mão esquerda segura) e a mão direita aparece com o indicador estendido ----------
// W.bz (0..1) = quanto o jogador está "usando o painel". Ativa quando ele está de frente para um painel a menos de BH_NEAR m (brkNear, ammo-crates.js).
// A pose da arma é aplicada em weapon-body.js (fxPost); aqui fica o modelo da mão e o posicionamento do dedo sobre a chave mirada.
const BH_NEAR=1.35,BH_REACH=1.05,BH_FT=.118;
const BH=new THREE.Group();BH.visible=false;camera.add(BH);
BH.scale.setScalar(1.3);
{ // mão direita vista de cima/trás (palma para baixo): indicador estendido e curvo, demais dedos fechados, polegar encostado no médio
  ball([0,.004,-.002],.03,[1.15,.62,1.3],glove,BH);ball([.01,-.012,.012],.02,[1.1,.7,1.2],pad,BH);        // dorso e palma
  [-.006,.006,.017].forEach((x,i)=>chain([[x,.008,-.03],[x,.002,-.052+.005*i],[x,-.02,-.056+.005*i],[x,-.034,-.034]],.0098-.0006*i,glove,BH,.93)); // médio, anelar e mínimo fechados
  chain([[-.018,.008,-.03],[-.018,.017,-.066],[-.018,.017,-.097],[-.018,.006,-.122]],.0105,glove,BH,.9);    // indicador estendido, levemente curvo
  chain([[-.03,-.004,-.004],[-.044,-.006,-.026],[-.034,-.018,-.046]],.0112,glove,BH,.93);                   // polegar recolhido
  chain([[.004,0,.03],[.006,.002,.07]],.034,cuff,BH,1.02);                                                  // punho
}
const bhFore=new THREE.Mesh(new THREE.CylinderGeometry(.036,.03,1,14),sleeve);BH.add(bhFore); // antebraço: vem da direita/baixo (ombro), com o punho dobrado
const bhWr=new THREE.Vector3(.006,.002,.07),bhIQ=new THREE.Quaternion(),bhSL=new THREE.Vector3(),bhUY=new THREE.Vector3(0,1,0);
const bhTip=new THREE.Vector3(-.018*1.3,.006*1.3,-BH_FT*1.3),bhS=new THREE.Vector3(.44,-.42,.1),bhR=new THREE.Vector3(.5,-.7,-.1),
  bhT=new THREE.Vector3(),bhD=new THREE.Vector3(),bhP=new THREE.Vector3(),bhQ=new THREE.Quaternion(),bhM=new THREE.Matrix4(),
  bhUp=new THREE.Vector3(0,1,0),bhZ=new THREE.Vector3(0,0,1),bhRoll=new THREE.Quaternion().setFromAxisAngle(bhZ,-.6);
let bhLast=null;
W.bz=0;W.poke=0;W.pend=null;W.pdir=1;
const bhSS=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)};
function breakerHandTick(dt){
  const ok=brkNear&&!PH.dead&&!W.rl&&!(typeof grenadeLoading!=='undefined'&&grenadeLoading)&&WA.inspectT<0&&WA.switchT<0;
  if(ok)bhLast=brkNear;
  W.bz+=((ok?1:0)-W.bz)*(1-Math.exp(-dt*(ok?7:6)));if(W.bz<.002&&!ok)W.bz=0;
  W.poke=Math.max(0,W.poke-dt/.55);
  if(W.pend&&W.poke<=.55){const q=W.pend;W.pend=null;breakerDoToggle(q.wi,q.ci);} // meio do gesto: a chave troca
  const on=W.bz>.03&&bhLast;BH.visible=!!on;rh.visible=W.bz<.5;if(!on)return;
  const b=bhLast.b,i=bhLast.i,z=b.z+b.zs*(i-3.5)*BK_PITCH;
  camera.updateMatrixWorld(true);
  bhT.set(b.x+b.nx*.075,1.47,z);camera.worldToLocal(bhT);                // alavanca da chave, no espaço da câmera
  bhD.copy(bhT).sub(bhS);const L=bhD.length();bhD.multiplyScalar(1/L);
  const extra=Math.min(.3,Math.max(0,L-BH_REACH));                         // quanto falta para tocar a chave
  if(L>BH_REACH)bhT.copy(bhS).addScaledVector(bhD,BH_REACH);               // o braço tem alcance limitado
  bhM.lookAt(bhP.set(0,0,0),bhD,bhUp);bhQ.setFromRotationMatrix(bhM).multiply(bhRoll); // -z da mão aponta para a chave, palma de lado
  bhP.copy(bhT).sub(bhTip.clone().applyQuaternion(bhQ));
  if(W.poke>0){ // gesto: o dedo encosta na chave e sobe (liga) ou desce (desliga)
    const t=1-W.poke,env=bhSS(0,.25,t)*(1-bhSS(.78,1,t));
    bhP.addScaledVector(bhD,(.04+extra)*env);
    bhP.y+=(W.pdir||1)*.075*(bhSS(.28,.62,t)-.5)*env*2*.5;
  }
  const e=W.bz*W.bz*(3-2*W.bz);
  BH.position.copy(bhR).lerp(bhP,e);BH.quaternion.copy(bhQ);
  bhSL.copy(bhS).sub(BH.position).applyQuaternion(bhIQ.copy(bhQ).invert()).divideScalar(1.3); // direção do ombro no espaço da mão
  const dl=bhSL.length();bhSL.multiplyScalar(1/dl);const fl_=.45;
  bhFore.position.copy(bhWr).addScaledVector(bhSL,fl_/2);bhFore.quaternion.setFromUnitVectors(bhUY,bhSL);bhFore.scale.set(1,fl_,1);
}

// ---- Arma no painel: coronha à direita, cano à esquerda e um pouco para cima; só a mão esquerda no guarda-mão ----
const BG_Y=new THREE.Vector3(0,1,0),BG_Z=new THREE.Vector3(0,0,1),bgQ=new THREE.Quaternion(),bgQy=new THREE.Quaternion(),bgQz=new THREE.Quaternion(),bgIQ=new THREE.Quaternion(),
  bgT=new THREE.Vector3(),bgW=new THREE.Vector3(),bgE=new THREE.Vector3(),bgS=new THREE.Vector3(),
  BG_GRIP=new THREE.Vector3(-.30,-.40,-.52),BG_SH=new THREE.Vector3(-.42,-.6,.3);
const bgLocal=v=>v.sub(gun.position).applyQuaternion(bgIQ.copy(gun.quaternion).invert()); // espaço da câmera -> espaço da arma
function breakerGunPose(){
  const bz=W.bz;if(bz<.002)return;
  const e=bz*bz*(3-2*bz);
  bgQy.setFromAxisAngle(BG_Y,1.2);bgQz.setFromAxisAngle(BG_Z,-.3);bgQ.copy(bgQz).multiply(bgQy);
  gun.quaternion.slerp(bgQ,e);
  bgT.copy(lh.position).applyQuaternion(bgQ).multiplyScalar(-1).add(BG_GRIP); // a mão esquerda cai na posição BG_GRIP
  gun.position.lerp(bgT,e);
  if(e>.02){ // braço esquerdo: ombro no corpo (esquerda/atrás), cotovelo para baixo, punho na mão esquerda
    gun.updateMatrix();
    bgW.copy(lh.position).add(bgS.set(-.04,-.012,.085)).applyQuaternion(gun.quaternion).add(gun.position); // punho (espaço da câmera)
    bgE.copy(BG_SH).add(bgW).multiplyScalar(.5);bgE.x-=.05;bgE.y-=.09;bgE.z+=.02;
    const sL=bgLocal(bgS.copy(BG_SH)),eL=bgLocal(bgE),wL=lh.position.clone().add(new THREE.Vector3(-.04,-.012,.085));
    poseArmBone(upperArmBone,sL,eL);poseArmBone(foreArmBone,eL,wL);elbowJoint.position.copy(eL);
  }
}
