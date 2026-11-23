// [HORNCAM] js/player/health-ecg.js
// ---------- Vida do jogador + monitor cardíaco (ECG) ----------
const PH={hp:100,dead:false};
const ecg=document.getElementById('ecg'),ex=ecg.getContext('2d');
const EW=ecg.width,EH=ecg.height,ESP=170;
let ecx=0,eph=0,ey=EH/2,ebeat=false;
function hurt(n){if(PH.dead||n<=0||(NET.on&&time<NET.inv))return;PH.hp=Math.max(0,PH.hp-n);P.landKick=Math.max(P.landKick,.08);hurtV=Math.min(1,.3+n/50);
  if(PH.hp<=0){PH.dead=true;W.trig=false;W.aim=false;try{tn(880,880,1.4,.05);}catch(e){}NET.died();}}
function heal(n){if(PH.dead){PH.dead=false;PH.hp=100;return;}PH.hp=Math.min(100,PH.hp+n);}
addEventListener('keydown',e=>{if(e.repeat)return;if(!NET.on){if(e.code==='KeyK')hurt(10);if(e.code==='KeyL')heal(10);}});
const ecgW=p=>{const g=(c,w,a)=>a*Math.exp(-Math.pow((p-c)/w,2));return g(.12,.045,.12)+g(.25,.012,-.12)+g(.285,.014,1)+g(.32,.014,-.25)+g(.55,.06,.22);};
let ecgAcc=0;
function ecgTick(dt){
  const hp=MENU_ON?20:PH.hp,col=PH.dead?'#e22':hp>66?'#3f3':hp>33?'#fd2':'#f33';
  const bpm=PH.dead?0:Math.round(60+(1-hp/100)*95);
  ecgAcc+=dt*ESP;const n=Math.floor(ecgAcc);ecgAcc-=n;
  ex.strokeStyle=col;ex.lineWidth=2.5;ex.lineJoin='round';ex.shadowColor=col;ex.shadowBlur=5;
  for(let i=0;i<n;i++){
    if(!PH.dead){eph+=(bpm/60)/ESP;if(eph>=1){eph-=1;ebeat=false;}
      if(!ebeat&&eph>=.285){ebeat=true;}}
    const ny=EH/2-(PH.dead?0:ecgW(eph))*EH*.42;
    ex.clearRect(ecx+1,0,12,EH);if(ecx+13>EW)ex.clearRect(0,0,ecx+13-EW,EH);
    ex.beginPath();ex.moveTo(ecx,ey);ex.lineTo(ecx+1,ny);ex.stroke();
    ey=ny;ecx++;if(ecx>=EW-1){ecx=0;}
  }
}
