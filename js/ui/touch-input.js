// [HORNCAM] js/ui/touch-input.js
// ---------- Controles de toque: joystick (esquerda), olhar (direita) e botões de ação ----------
const joyEl=document.getElementById('joy'),knob=joyEl.firstElementChild;
let joy={id:null,x0:0,y0:0,x:0,y:0,run:false},look={id:null,x:0,y:0};
const joyRun=document.getElementById('joyrun'),RUN_D=90,RUN_R=32;
function joyRunUI(show,on){joyRun.classList.toggle('show',show);joyRun.classList.toggle('on',on);}
addEventListener('touchstart',e=>{
  if(!active) return;
  for(const t of e.changedTouches){
    if(t.target.closest('.btn,.ed,#opt,#help')) continue; // painéis de opções/ajuda não controlam o jogo
    if(t.clientX<innerWidth/2&&joy.id===null){
      joy={id:t.identifier,x0:t.clientX,y0:t.clientY,x:0,y:0,run:false};joyRunUI(false,false);
      joyEl.style.display='block';joyEl.style.left=(t.clientX-55)+'px';joyEl.style.top=(t.clientY-55)+'px';
    }else if(t.clientX>=innerWidth/2&&look.id===null){look={id:t.identifier,x:t.clientX,y:t.clientY};}
  }
},{passive:false});
addEventListener('touchmove',e=>{
  if(!active)return;if(e.target.closest&&e.target.closest('#opt,#help'))return; // deixa o painel rolar
  e.preventDefault();
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

