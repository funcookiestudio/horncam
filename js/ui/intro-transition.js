// [HORNCAM] js/ui/intro-transition.js
// ---------- Transição tela inicial -> câmera do jogador ----------
// 1) a interface do menu some; 2) a câmera do menu mergulha na tela "CH 01" (o feed do capacete) com brilho/glitch/ruído;
// 3) o chiado cobre tudo e a cena do jogo assume: abertura CRT + "sinal voltando" (startBoot) e a câmera "acorda" olhando levemente para baixo.
// Só visual/áudio: não altera qualidade gráfica nem o desempenho da partida.
const INTRO={on:false,t:0,Z:1.3,bs:1,bp:new THREE.Vector3(),K:4,cx:349.5,cy:492,scr:4}; // cx,cy = centro da tela CH 01 na imagem (px)
const WAKE={on:false,t:0,D:1.8,p:0,r:0,f:0};
function introBegin(){
  if(INTRO.on||GS.mode!=='menu')return;
  const hh=Math.tan(20*Math.PI/180)*7;
  INTRO.on=true;INTRO.t=0;INTRO.bs=tvG.scale.x;INTRO.bp.copy(tvG.position);
  INTRO.K=Math.max(2.4,(2*hh*menuCam.aspect/INTRO.bs)/260); // zoom até a tela CH 01 preencher a imagem
  GS.mode='intro';ov.classList.add('leaving');
  // som da transição removido
}
function introCancel(){ // Esc durante a transição: volta ao menu
  if(!INTRO.on)return;
  INTRO.on=false;GS.mode='menu';ov.classList.remove('leaving');fitMenuCam(menuCam.aspect);
  post.uniforms.sig.value=0;
}
function introTick(dt){ // início de cada quadro: avança o relógio e, ao terminar, entrega o jogo ao jogador
  outroTick(dt);
  if(!INTRO.on)return;
  INTRO.t+=dt;if(INTRO.t<INTRO.Z)return;
  INTRO.on=false;GS.mode='play';
  fitMenuCam(menuCam.aspect);ov.classList.remove('leaving');
  ov.style.display='none';active=true;
  if(isTouch)document.getElementById('touch').style.display='block';
  startBoot();WAKE.on=true;WAKE.t=0;
}
function introFrame(){ // aplicado no quadro do menu, depois de tvTick/menuCamSway
  if(!INTRO.on)return;
  const p=Math.min(1,INTRO.t/INTRO.Z),e=p*p*(3-2*p),k=1+(INTRO.K-1)*e,gs=INTRO.bs*k;
  tvG.scale.setScalar(gs);
  tvG.position.set(INTRO.bp.x*(1-e)-gs*INTRO.cx*e,INTRO.bp.y*(1-e)+gs*INTRO.cy*e,0); // centro da tela CH 01 caminha até o centro da câmera
  const u=TV_SCR[INTRO.scr].mt.uniforms;u.uGl.value=Math.max(u.uGl.value,e*1.4);u.uLv.value*=1+e*1.8;
  post.uniforms.sig.value=Math.pow(Math.max(0,(p-.45)/.55),1.4);post.uniforms.shake.value=e*3;
  menuHelm.position.x-=e*e*2.4;menuHelm.position.y-=e*e*.6; // o capacete sai de quadro
}
function wakeCam(dt){ // câmera do jogador: "liga" ligeiramente inclinada e se firma (usado em update)
  if(!WAKE.on){WAKE.p=WAKE.r=WAKE.f=0;return WAKE;}
  WAKE.t+=dt;const q=Math.max(0,1-WAKE.t/WAKE.D),e=q*q;
  WAKE.p=-.5*e;WAKE.r=.09*e*Math.sin(WAKE.t*8);WAKE.f=16*e;
  if(q<=0)WAKE.on=false;
  return WAKE;
}

// ---------- Saída do jogo (botão INÍCIO): o contrário da entrada ----------
// 1) o jogo congela e o sinal da câmera cai (chiado/tremor); 2) a tela CRT "desliga" (fecha numa linha e apaga); 3) volta o menu saindo do preto.
const OUTRO={on:false,t:0,A:.8,B:.7,C:.6,ph:0};
function outroBegin(){
  if(OUTRO.on||GS.mode==='menu')return;
  try{introCancel()}catch(e){}
  OUTRO.on=true;OUTRO.t=0;OUTRO.ph=0;GS.mode='outro';
  active=false;ov.style.display='none';for(const k in keys)keys[k]=false;
  try{if(document.pointerLockElement)document.exitPointerLock()}catch(e){}
  if(isTouch){const t=document.getElementById('touch');if(t)t.style.display='none'}
  try{hudEl.classList.remove('on')}catch(e){}
}
function outroTick(dt){
  if(!OUTRO.on)return;
  OUTRO.t+=dt;const el=document.getElementById('shut');
  if(OUTRO.ph===0){const p=Math.min(1,OUTRO.t/OUTRO.A);
    post.uniforms.sig.value=Math.min(1,Math.pow(p,1.2)*(Math.random()>.15?1:.5));post.uniforms.shake.value=p*4;
    if(OUTRO.t>=OUTRO.A){OUTRO.ph=1;OUTRO.t=0;el.className='go'}
  }else if(OUTRO.ph===1){post.uniforms.sig.value=1;post.uniforms.shake.value=2;
    if(OUTRO.t>=OUTRO.B){OUTRO.ph=2;OUTRO.t=0;
      GS.mode='menu';ov.style.display='flex';active=false;post.uniforms.sig.value=0;post.uniforms.shake.value=0;
      el.className='out'}
  }else if(OUTRO.t>=OUTRO.C){OUTRO.on=false;el.className=''}
}
