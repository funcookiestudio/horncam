// [HORNCAM] js/player/sanity.js
// ---------- Sanidade: cai no escuro (e muito na neblina, fora dos galpões), sobe na luz. Indicador = EEG (traçado de ondas cerebrais), irmão do ECG ----------
// Etapa 1: valor + indicador. Teclas de teste: U = -10, Shift+U = +10.
const SAN={v:100,rate:0,lit:0,dead:false,out:false,fx:0};
const eeg=document.getElementById('eeg'),ex2=eeg?eeg.getContext('2d'):null,eeW=eeg?eeg.width:0,eeH=eeg?eeg.height:0;
let ecx2=0,ey2=eeH/2,eAcc=0,ePh=0,eNz=0,eGap=0,eSpk=0;
// consumo/recuperação por segundo (valores de teste; ajustar jogando)
const SAN_C={lit:.3,dim:.1,up:.4,dimD:.15,dimF:.06,darkD:.7,darkF:.3,outD:1,outF:.65,event:.5,ally:.3};
function sanTick(dt){
  if(GS.mode==='menu'||typeof MENU_ON!=='undefined'&&MENU_ON){sanDraw(dt,60);sanClear();return}
  if(GS.mode!=='play'||typeof active==='undefined'||!active){sanDraw(dt,SAN.v);sanClear();return}
  if(PH.dead){SAN.dead=true;sanDraw(dt,SAN.v);sanClear();return}
  if(SAN.dead){SAN.dead=false;SAN.v=100}
  const x=camera.position.x,z=camera.position.z,wi=typeof LREG!=='undefined'?LREG.whAt(x,z):-1;
  let r=0;SAN.out=wi<0;
  if(wi>=0){const L=typeof lvSample==='function'?lvSample(x,1.5,z):1;SAN.lit=L;
    if(L>=SAN_C.lit)r=SAN_C.up;else if(L>=SAN_C.dim)r=-(flashOn?SAN_C.dimF:SAN_C.dimD);else r=-(flashOn?SAN_C.darkF:SAN_C.darkD)}
  else{SAN.lit=0;r=-(flashOn?SAN_C.outF:SAN_C.outD)}
  if((typeof BLK!=='undefined'&&BLK.ph>=2)||(typeof INTERF!=='undefined'&&INTERF.ph>=2&&INTERF.ph<=3))r-=SAN_C.event;
  if(r<0)for(const id in NET.rem){const q=NET.rem[id];if(q&&q.has&&!q.dead&&Math.hypot(q.cur.x-x,q.cur.z-z)<6){r+=SAN_C.ally;break}}
  SAN.rate=r;SAN.v=Math.max(0,Math.min(100,SAN.v+r*dt));
  sanDraw(dt,SAN.v);sanFx(dt);
}
// traçado: calmo (ondas alfa suaves, ciano) -> agitado (ruído e picos, violeta) -> caos (picos fortes, quedas ao zero, vermelho)
function sanDraw(dt,v){
  if(!ex2)return;
  const k=1-v/100,col=v>66?'#6df':v>33?'#b9f':'#f36';
  eAcc+=dt*170;const n=Math.floor(eAcc);eAcc-=n;
  ex2.strokeStyle=col;ex2.lineWidth=2.5;ex2.lineJoin='round';ex2.shadowColor=col;ex2.shadowBlur=5;
  for(let i=0;i<n;i++){
    ePh+=(.22+k*.5)*(1+.3*Math.sin(ecx2*.05));
    let y=Math.sin(ePh)*(.12+k*.18)+Math.sin(ePh*.37+1.3)*.06;
    eNz+=(Math.random()-.5-eNz*.35)*(.15+k*.9);y+=eNz*(.05+k*.5);
    if(eSpk>0){eSpk--;y+=(Math.random()<.5?-1:1)*(.5+k*.5)}
    else if(Math.random()<.002+k*k*.03)eSpk=1+(Math.random()*3|0);
    if(eGap>0){eGap--;y*=.05}else if(k>.55&&Math.random()<(k-.55)*.006)eGap=8+(Math.random()*26|0);
    const ny=eeH/2-Math.max(-.48,Math.min(.48,y))*eeH*.9;
    ex2.clearRect(ecx2+1,0,12,eeH);if(ecx2+13>eeW)ex2.clearRect(0,0,ecx2+13-eeW,eeH);
    ex2.beginPath();ex2.moveTo(ecx2,ey2);ex2.lineTo(ecx2+1,ny);ex2.stroke();
    ey2=ny;ecx2++;if(ecx2>=eeW-1)ecx2=0}
}
addEventListener('keydown',e=>{if(e.repeat||e.code!=='KeyU'||typeof active==='undefined'||!active)return;SAN.v=Math.max(0,Math.min(100,SAN.v+(e.shiftKey?10:-10)))});

// ---------- Etapa 2: efeitos por faixa ----------
// 70-40 inquieto: vinheta e batimento · 40-15 perturbado: sussurros (voz de jogador), vultos de relance na borda, estática · <15: interferência mais frequente e lanterna falha · 0: desmaia 3,5 s e volta com 25%
const SFX={hb:0,wh:6,pv:9,fl:8,ev:0,faint:0,vig:null,fig:null,blk:null,fg:0};
(function(){
  const mk=(css)=>{const d=document.createElement('div');d.style.cssText='position:fixed;pointer-events:none;'+css;document.body.appendChild(d);return d};
  SFX.vig=mk('inset:0;z-index:3;opacity:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 38%,rgba(14,0,24,.85) 100%)');
  SFX.fig=mk('top:22%;width:15vw;height:62vh;z-index:3;opacity:0;filter:blur(7px);background:radial-gradient(ellipse at center,#000 30%,rgba(0,0,0,0) 72%)');
  SFX.blk=mk('inset:0;z-index:25;opacity:0;background:#000');
})();
function sanClear(){if(SFX.vig){SFX.vig.style.opacity=0;SFX.fig.style.opacity=0;if(SFX.faint<=0)SFX.blk.style.opacity=0}}
function sanFx(dt){
  const v=SAN.v,k=Math.max(0,Math.min(1,(70-v)/70)),now=performance.now();
  // vinheta: cresce com a perda e "respira" com o batimento
  SFX.hb-=dt;const bpm=60+k*75;
  if(v<70&&SFX.hb<=0){SFX.hb=60/bpm;SFX.fg=1;try{tn(58,38,.16,.07+k*.12,'sine');tn(52,34,.14,.04+k*.08,'sine',.2)}catch(e){}}
  SFX.fg=Math.max(0,SFX.fg-dt*3);
  SFX.vig.style.opacity=v<70?Math.min(1,k*.95+SFX.fg*.14*k):0;
  // vulto de relance na borda da tela (v<40): aparece, treme e some
  if(SFX.fig.style.opacity>0)SFX.fig.style.opacity=Math.max(0,SFX.fig.style.opacity-dt*2.8);
  if(v<40){
    SFX.pv-=dt;if(SFX.pv<=0){SFX.pv=7+Math.random()*(8+v*.4);const l=Math.random()<.5;SFX.fig.style.left=l?'1%':'auto';SFX.fig.style.right=l?'auto':'1%';SFX.fig.style.opacity=.75;
      post.uniforms.sig.value=Math.max(post.uniforms.sig.value,.35);post.uniforms.shake.value+=1.2;try{nz(.22,.2,2400,1,2,.2,'bandpass')}catch(e){}}
    SFX.wh-=dt;if(SFX.wh<=0){SFX.wh=6+Math.random()*(7+v*.3);
      let ok=false;if(typeof VOICE!=='undefined'&&VOICE.mimic&&Math.random()<.5){const d=new THREE.Vector3();camera.getWorldDirection(d);ok=VOICE.mimic(null,camera.position.x-d.x*2.5,camera.position.z-d.z*2.5)}
      if(!ok)try{for(let i=0;i<4;i++)nz(.16+Math.random()*.2,.07,1400+Math.random()*1600,3,2,.4,'bandpass',i*.19)}catch(e){}}
  }
  // abaixo de 15%: a interferência se aproxima e a lanterna falha
  if(v<15){
    SFX.ev-=dt;if(SFX.ev<=0&&typeof INTERF!=='undefined'){SFX.ev=60;if(!INTERF.ph&&(!INTERF.next||INTERF.next>now+45e3))INTERF.next=now+(25+Math.random()*20)*1e3}
    SFX.fl-=dt;if(SFX.fl<=0){SFX.fl=5+Math.random()*7;if(flashOn&&typeof flFail!=='undefined'){flFail=.3+Math.random()*.8;flOn=false;flTog=.05}}
  }
  // zero: desmaio
  if(v<=0&&SFX.faint<=0){SFX.faint=3.6;try{tn(300,40,.8,.2,'sawtooth')}catch(e){}}
  if(SFX.faint>0){SFX.faint-=dt;const t=3.6-SFX.faint;
    SFX.blk.style.opacity=t<.6?t/.6:SFX.faint<.9?SFX.faint/.9:1;
    P.vel.x=P.vel.z=0;W.trig=false;W.aim=false;
    if(SFX.faint<=0){SAN.v=25;SFX.blk.style.opacity=0}}
}
