// [HORNCAM] js/audio/sound-options.js
// ---------- Opções de som: volume mestre + mudo (salvo no navegador) ----------
const OPT={vol:1,mute:false};
try{const o=JSON.parse(localStorage.getItem('horncam_opt')||'{}');if(typeof o.vol==='number')OPT.vol=Math.max(0,Math.min(1,o.vol));OPT.mute=!!o.mute;}catch(e){}
function optGain(){return OPT.mute?0:OPT.vol*OPT.vol;}
function mg(A){if(!A._mg){A._mg=A.createGain();A._mg.gain.value=optGain();A._mg.connect(A.destination);}return A._mg;}
function optApply(){try{if(AC&&AC._mg)AC._mg.gain.setTargetAtTime(optGain(),AC.currentTime,.03);}catch(e){}
  try{localStorage.setItem('horncam_opt',JSON.stringify(OPT));}catch(e){}}
// start overlay
const ov=document.getElementById('ov');
let aliveT=0,hudReady=false,unlockForResp=false,bootTm=0;
const hudEl=document.getElementById('hud'),bootEl=document.getElementById('boot');
// câmera desligada -> liga (abertura tipo CRT + sinal voltando), depois o HUD aparece
function startBoot(){
  aliveT=0;hudReady=false;hudEl.classList.remove('on');
  bootEl.classList.remove('go');void bootEl.offsetWidth;bootEl.classList.add('go');
  try{DA.back=true;DA.sig=1;DA.vis=1;}catch(e){}
  try{nz(.3,.4,6000,1,1.5,.1,'highpass');tn(400,1600,.25,.06,'square');}catch(e){}
  clearTimeout(bootTm);bootTm=setTimeout(()=>{hudReady=true;bootEl.classList.remove('go');},1150);
}
ov.addEventListener('click',e=>{
  if(e.target.closest('#lobby,#helpbtn,#optbtn'))return;
  startBoot();
  ov.style.display='none'; active=true;
  if(isTouch){document.getElementById('touch').style.display='block';}
  else canvas.requestPointerLock&&canvas.requestPointerLock();
});
{const hp=document.getElementById('help'),hs=v=>hp.classList.toggle('show',v);
  document.getElementById('helpbtn').addEventListener('click',()=>hs(true));
  document.getElementById('helpclose').addEventListener('click',()=>hs(false));
  const op=document.getElementById('opt'),ov_=document.getElementById('optvol'),vl=document.getElementById('optv'),mt=document.getElementById('optmute');
  const ui=()=>{ov_.value=Math.round(OPT.vol*100);vl.textContent=OPT.mute?'—':Math.round(OPT.vol*100)+'%';mt.textContent=OPT.mute?'LIGADO':'DESLIGADO';mt.classList.toggle('on',OPT.mute);};
  ui();
  document.getElementById('optbtn').addEventListener('click',()=>{ui();op.classList.add('show');});
  document.getElementById('optclose').addEventListener('click',()=>op.classList.remove('show'));
  op.addEventListener('click',e=>{if(e.target===op)op.classList.remove('show');});
  ov_.addEventListener('input',()=>{OPT.vol=ov_.value/100;if(OPT.vol>0)OPT.mute=false;ui();optApply();});
  mt.addEventListener('click',()=>{OPT.mute=!OPT.mute;ui();optApply();});
  addEventListener('keydown',e=>{if(e.code==='Escape')op.classList.remove('show');});
  hp.addEventListener('click',e=>{if(e.target===hp)hs(false);});
  addEventListener('keydown',e=>{if(e.code==='Escape')hs(false);});}
document.addEventListener('pointerlockchange',()=>{
  if(document.pointerLockElement===canvas)unlockForResp=false;
  if(!isTouch&&document.pointerLockElement!==canvas&&!unlockForResp){ov.style.display='flex';active=false;}
});
document.addEventListener('pointerlockerror',()=>{if(unlockForResp&&!PH.dead){unlockForResp=false;ov.style.display='flex';active=false;}});

// touch
const joyEl=document.getElementById('joy'),knob=joyEl.firstElementChild;
let joy={id:null,x0:0,y0:0,x:0,y:0,run:false},look={id:null,x:0,y:0};
const joyRun=document.getElementById('joyrun'),RUN_D=90,RUN_R=32;
function joyRunUI(show,on){joyRun.classList.toggle('show',show);joyRun.classList.toggle('on',on);}
addEventListener('touchstart',e=>{
  if(!active) return;
  for(const t of e.changedTouches){
    if(t.target.closest('.btn,.ed')) continue;
    if(t.clientX<innerWidth/2&&joy.id===null){
      joy={id:t.identifier,x0:t.clientX,y0:t.clientY,x:0,y:0,run:false};joyRunUI(false,false);
      joyEl.style.display='block';joyEl.style.left=(t.clientX-55)+'px';joyEl.style.top=(t.clientY-55)+'px';
    }else if(t.clientX>=innerWidth/2&&look.id===null){look={id:t.identifier,x:t.clientX,y:t.clientY};}
  }
},{passive:false});
addEventListener('touchmove',e=>{
  if(!active)return;e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier===joy.id){
      const rx=t.clientX-joy.x0,ry=t.clientY-joy.y0;
      let dx=rx/45,dy=ry/45,m=Math.hypot(dx,dy);
      if(m>1){dx/=m;dy/=m;} joy.x=dx;joy.y=dy;
      knob.style.transform=`translate(${dx*30}px,${dy*30}px)`;
      // estilo PUBG: empurrar o analógico para frente mostra o ícone de correr; arrastar até ele trava a corrida
      if(!joy.run){
        if(Math.hypot(rx,ry+RUN_D)<RUN_R){
          joy.run=true;
          if(P.crouch){P.crouch=false;const cb=document.querySelector('.btn[data-a="crouch"]');if(cb)cb.classList.remove('on');}
          try{navigator.vibrate&&navigator.vibrate(18);}catch(_){}
        }
      }else if(ry>20){joy.run=false;}
      joyRunUI(joy.run||ry<-24,joy.run);
    }else if(t.identifier===look.id){
      P.yaw-=(t.clientX-look.x)*.0055; P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch-(t.clientY-look.y)*.0055));
      look.x=t.clientX;look.y=t.clientY;
    }
  }
},{passive:false});
function endT(e){
  for(const t of e.changedTouches){
    if(t.identifier===joy.id){joy={id:null,x0:0,y0:0,x:0,y:0,run:false};joyEl.style.display='none';knob.style.transform='';joyRunUI(false,false);}
    if(t.identifier===look.id) look={id:null,x:0,y:0};
  }
}
addEventListener('touchend',endT);addEventListener('touchcancel',endT);
document.querySelectorAll('.btn').forEach(b=>{
  const a=b.dataset.a;
  b.addEventListener('pointerdown',e=>{
    e.preventDefault();
    if(a==='sprint'){input.sprint=true;b.classList.add('on');}
    if(a==='jump') input.jump=true;
    if(a==='crouch'){P.crouch=!P.crouch;b.classList.toggle('on',P.crouch);}
    if(a==='light'){toggleLight();b.classList.toggle('on',flashOn);}
  });
  const up=()=>{if(a==='sprint'){input.sprint=false;b.classList.remove('on');}};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);
});

// colisão
function collide0(){
  const nearbySolids=spatialQuery(spatialSolids,P.pos.x-P.r,P.pos.x+P.r,P.pos.z-P.r,P.pos.z+P.r);
  spatialStats.solidCandidates=nearbySolids.size;
  for(const b of nearbySolids){
    const cx=Math.max(b.minX,Math.min(P.pos.x,b.maxX)),cz=Math.max(b.minZ,Math.min(P.pos.z,b.maxZ));
    const dx=P.pos.x-cx,dz=P.pos.z-cz,d=Math.hypot(dx,dz);
    if(d<P.r){
      if(d>1e-4){P.pos.x+=dx/d*(P.r-d);P.pos.z+=dz/d*(P.r-d);}
      else{P.pos.x+=P.r;}
    }
  }
}

