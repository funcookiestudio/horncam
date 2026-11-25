// [HORNCAM] js/world/blackout.js
// ---------- Apagão por interferência (piloto, etapa 1) ----------
// Num galpão (o mais próximo): presságio -> piscadas em padrões (onda, código, zonas) -> pico frenético -> calmaria falsa -> surto: as lâmpadas
// explodem em cadeia, corredor por corredor, a partir do quadro (faíscas e vidro perto do jogador; ~25% queimam de vez) e cada disjuntor desarma.
// A luz real do galpão só tem um canal estável, então o brilho do ambiente segue a MÉDIA ponderada (por distância ao jogador) das piscadas das
// lâmpadas; cada lâmpada pisca individualmente no visual (L.fxm). Postes da rua também falham. Tecla H dispara o teste. O jogador religa no painel.
const BLK={link:true,cl:null,cc:0,k:0,ph:0,t:0,wi:-1,seed:1,mx:1,sm:1,pt:0,pat:0,rnd:null,bits:[],order:[],ti:0,tt:0,key:'KeyH'};
const BLK_D={pres:3,pat:2.6,npat:3,frenzy:3.5,calm:1.3,trip:.16};
function blkRand(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const blkFlk=(x,f)=>{const s=Math.sin(x*f)+.7*Math.sin(x*f*.43+1.3)+.4*Math.sin(x*f*2.1);return s>-.15?1:.06};
function blkPick(){ // galpão mais próximo (e, se estiver todo apagado, o teste liga os disjuntores)
  const cp=camera.position;let best=-1,bd=1e9;
  for(const w of WH){const d=Math.hypot(w.x-cp.x,w.z-cp.z);if(d<bd){bd=d;best=w.i}}
  return bd<140?best:-1}
function blkStart(wi,seed,quiet){
  if(BLK.ph||wi<0||!SW[wi])return false;
  if(!SW[wi].some(Boolean)){for(let c=0;c<NCOR;c++)setBreaker(wi,c,true,true)}
  BLK.ph=1;BLK.t=0;BLK.wi=wi;BLK.seed=seed;BLK.rnd=blkRand(seed);BLK.pat=0;BLK.pt=0;BLK.ti=0;BLK.tt=0;
  BLK.bits=Array.from({length:NCOR},()=>Array.from({length:12},()=>BLK.rnd()>.45));
  BLK.order=[...Array(NCOR).keys()].sort(()=>BLK.rnd()-.5);
  if(!quiet&&typeof NET!=='undefined'&&NET.on)NET.send({t:'blk',wi,seed});
  return true}
function blkMul(c,tau,ph){ // multiplicador de brilho (0..1) do corredor c
  if(ph===1)return 1-.55*(1-blkFlk(tau+c*3.1,9))*Math.min(1,tau/1.2);
  if(ph===3)return blkFlk(tau+c*.37,58+c*7);
  const k=BLK.pat;
  if(k===0){const p=(tau*2.6)%(NCOR+2)-1,band=Math.max(0,1-Math.abs(c-p)/1.3);return 1-band*(.6+.4*blkFlk(tau,40))}            // onda: uma faixa escura varre os corredores
  if(k===1){return BLK.bits[c][Math.floor(tau/.22)%12]?1:.05}                                                                       // código: sequência própria por corredor
  return (Math.floor(tau/.35)%2===c%2)?1:.08                                                                                        // zonas: corredores alternando
}
function blkSparks(c,n){ // estouro de faíscas: abre para os lados e cai (mais forte que a chuva comum)
  for(let i=0;i<n;i++)deb1(new V3(c.x+R2(-.4,.4),c.y-.1,c.z+R2(-.15,.15)),new V3(R2(-1,1),R2(-.3,1),R2(-1,1)).normalize(),'spark',R2(.012,.026),R2(2.5,5),R2(1.2,2.4))}
function blkBoom(L){ // uma lâmpada explode: ~25% queimam de vez (decisão determinística pela semente: igual em todos os aparelhos)
  const dead=((((L.id*2654435761)>>>0)^BLK.seed)>>>0)%100<25,cp=camera.position,d=Math.hypot(L.pos.x-cp.x,L.pos.z-cp.z),near=d<30;
  L.boom=true;L.fxm=0;
  if(dead){try{breakLamp(L.id,!near);if(near)blkSparks(L.pos,70)}catch(e){}}
  else if(near){try{sparkShower(L.pos,40);blkSparks(L.pos,55);for(let i=0;i<3;i++)puff(L.pos.clone().add(new V3(R2(-.5,.5),R2(-.35,-.1),R2(-.15,.15))),new V3(0,-.2,0),R2(.7,1.2),0x3a3b3a,R2(2,3.5),.45,.3);
    sndAt({x:L.pos.x,z:L.pos.z},()=>{SV=attn(L.pos.x,L.pos.z);nz(.1,.45,6000,1,2,.18,'highpass');tn(1800,300,.14,.08,'sawtooth');SV=1})}catch(e){}}
  if(near&&typeof post!=='undefined')post.uniforms.shake.value+=Math.max(0,1-d/14)*1.6}
// ---- janela instável: depois do surto, o painel fica "quente" por 2 min. LEDs vermelhos piscando; cada chave ligada dá um sinal mais forte (estalo, faíscas, arco).
// Na etapa seguinte, ligar a chave nº boomAt (3 ou 4) dentro da janela faz o quadro explodir. Aqui só os sinais.
const BLK_WIN={},BLK_WT=120;
function blkWinStart(wi,seed){BLK_WIN[wi]={seed,bt:0,t:BLK_WT,flips:0,boomAt:3+(seed&1),acc:0,ph:0}}
function blkFlip(wi,ci){const w=BLK_WIN[wi];if(!w||w.t<=0)return;w.flips++;
  const b=BRKW[wi];if(!b)return;const pos=new V3(b.x+b.nx*.25,1.5,b.z+b.zs*(ci-3.5)*BK_PITCH);
  try{if(w.flips===1)sparkShower(pos,6);else if(w.flips===2)sparkShower(pos,22);else if(w.flips<w.boomAt){sparkShower(pos,60);post.uniforms.shake.value+=1.5}}catch(e){}
  if(w.flips>=w.boomAt&&!w.burn)blkPanelBoom(wi,pos,BK_LOCAL)}
// o quadro explode: faíscas, fumaça, dano (40%) e desorientação só para quem mexeu; o quadro queima e não responde por 3 min
function blkPanelBoom(wi,pos,local){
  const w=BLK_WIN[wi],b=BRKW[wi];w.burn=180;w.bt=0;w.t=0;w.sm=0;
  try{fbBurn(wi,(w.seed|0)+101,2+((w.seed|0)&1))}catch(e){}   // a explosão queima 2-3 fusíveis: quadro só volta quando todos forem trocados
  try{sparkShower(pos,120);blkSparks(pos,120);blkSparks(new V3(pos.x,pos.y+.2,pos.z),80);
    for(let i=0;i<10;i++)puff(pos.clone().add(new V3(R2(-.3,.3),R2(-.3,.3),R2(-.3,.3))),new V3(b.nx*.6,.3,0),R2(.9,1.8),0x2a2b2a,R2(3,5),.55,.4);
    sndAt({x:b.x,z:b.z},()=>{SV=attn(b.x,b.z);nz(.35,.9,4500,1,2,.3,'lowpass');tn(1600,70,.3,.16,'sawtooth');SV=1})}catch(e){}
  try{if(brkBody.instanceColor===null||!brkBody.instanceColor)brkBody.setColorAt(b.k,BK_C.setHex(0xffffff));brkBody.setColorAt(b.k,BK_C.setHex(0x1c1c1c));brkBody.instanceColor.needsUpdate=true}catch(e){}
  for(let ci=0;ci<NCOR;ci++){try{brkLed.setColorAt(b.k*NCOR+ci,BK_C.setHex(0x000000))}catch(e){}}if(brkLed.instanceColor)brkLed.instanceColor.needsUpdate=true;
  if(local&&typeof active!=='undefined'&&active&&!PH.dead){
    try{hurt(40);P.vel.x+=b.nx*3.5;post.uniforms.shake.value+=4;interfStart(true,12)}catch(e){}}
}
function blkBurned(wi){const w=BLK_WIN[wi];return !!(w&&w.burn>0)}   // dura até os fusíveis queimados serem trocados (fbAnyBad)
function blkDry(wi,ci){const b=BRKW[wi];if(b)try{sparkShower(new V3(b.x+b.nx*.25,1.5,b.z),4)}catch(e){}} // tentou usar o quadro queimado: só uma faísca fraca
function blkWinTick(dt){
  for(const k in BLK_WIN){const w=BLK_WIN[k],wi=+k;
    if(w.burn>0){w.bt+=dt;w.sm-=dt;const b=BRKW[wi];
      if(w.sm<=0&&b){w.sm=w.bt<30?.4:1.6;const p=new V3(b.x+b.nx*.3,1.6,b.z);const dx=p.x-camera.position.x,dz=p.z-camera.position.z;
        if(dx*dx+dz*dz<30*30){try{puff(p,new V3(b.nx*.3,.5,0),R2(.5,1),0x3a3b3a,R2(2,3.5),.35,.5);if(Math.random()<.3)sparkShower(p,5)}catch(e){}}}
      if(w.bt>2&&!fbAnyBad(wi)&&b){w.burn=0;try{brkBody.setColorAt(b.k,BK_C.setHex(0xffffff));brkBody.instanceColor.needsUpdate=true}catch(e){}for(let ci=0;ci<NCOR;ci++)brkVis(wi,ci)}
      continue}
    if(w.t<=0)continue;
    w.t-=dt;w.acc-=dt;const end=w.t<=0;
    if(w.acc<=0||end){w.acc=.18;w.ph++;
      for(let ci=0;ci<NCOR;ci++){
        if(end){brkVis(wi,ci);continue}
        const b=BRKW[wi];if(!b)continue;const kk=b.k*NCOR+ci,on=SW[wi][ci];
        // vermelho pulsando (ligadas: âmbar, mais nervosas); a cada ciclo uma chave falha
        const lit=((w.ph+ci*3)%5)!==0;brkLed.setColorAt(kk,BK_C.setHex(lit?(on?0xffa020:0xff2a1a):0x2a0a08))}
      if(brkLed.instanceColor)brkLed.instanceColor.needsUpdate=true}
  }}
function blkEnd(){
  for(const L of lamps)if(L.wi===BLK.wi){L.fxm=undefined;L.boom=false}
  BLK.ph=0;BLK.mx=BLK.sm=1;blkWinStart(BLK.wi,BLK.seed);
  try{fbBurn(BLK.wi,BLK.seed|0,1+((BLK.seed>>>3)&1))}catch(e){}   // o surto queima 1-2 fusíveis do galpão
  for(const h of (typeof SLH!=='undefined'?SLH:[]))if(h&&h[0])h[0].material.opacity=.95}
function blkTick(dt){
  if(!BLK.ph)return;
  BLK.t+=dt;const D=BLK_D;let ph=BLK.ph;
  if(ph===1&&BLK.t>=D.pres){BLK.ph=ph=2;BLK.t=0;BLK.pat=0;}
  else if(ph===2&&BLK.t>=D.pat){BLK.t=0;BLK.pat++;if(BLK.pat>=D.npat){BLK.ph=ph=3;BLK.t=0;if(BLK.link&&typeof LREG!=='undefined'&&LREG.whAt(camera.position.x,camera.position.z)===BLK.wi)interfStart(true,22);}}
  else if(ph===3&&BLK.t>=D.frenzy){BLK.ph=ph=4;BLK.t=0;}   // calmaria falsa: tudo firme, sem zumbido
  else if(ph===4&&BLK.t>=D.calm){BLK.ph=ph=5;BLK.t=0;BLK.ti=0;BLK.tt=0;BLK.cl=null;}
  if(ph===5){BLK.tt-=dt;
    while(BLK.tt<=0){
      if(!BLK.cl){ // próximo corredor: lâmpadas ordenadas pela distância ao quadro (o surto sai do quadro)
        const ci=BLK.order[BLK.ti];if(ci===undefined){blkEnd();return}
        if(!SW[BLK.wi][ci]){BLK.ti++;continue}
        const b=BRKW[BLK.wi]||{x:0,z:0};
        BLK.cl=lamps.filter(L=>L.wi===BLK.wi&&L.cor===ci&&!L.dead).sort((p,q)=>Math.hypot(p.pos.x-b.x,p.pos.z-b.z)-Math.hypot(q.pos.x-b.x,q.pos.z-b.z));BLK.cc=ci;BLK.k=0;BLK.tt=0;
      }
      if(BLK.k<BLK.cl.length){blkBoom(BLK.cl[BLK.k++]);BLK.tt+=.05+((BLK.k*37)%7)*.01}
      else{setBreaker(BLK.wi,BLK.cc,false,false);for(const L of BLK.cl)L.fxm=undefined;BLK.ti++;BLK.cl=null;BLK.tt=.2}
    }}
  const tau=BLK.t+(ph===2?0:0);let sw=0,sd=0;const cp=camera.position;
  for(const L of lamps){if(L.wi!==BLK.wi)continue;
    const m=ph===4?1:ph===5?(L.boom?0:1):blkMul(L.cor,tau,ph);L.fxm=m;
    if(!L.off){const d=Math.hypot(L.pos.x-cp.x,L.pos.z-cp.z),w=1/(1+d/8);sw+=m*w;sd+=w}}
  BLK.mx=sd>0?sw/sd:1;
  // postes da rua: falham junto (e apagam no silêncio)
  BLK.sm=ph<=1||ph===4?1:ph===5?1-.9*Math.min(1,BLK.ti/NCOR)*(blkFlk(BLK.t*3,45)):blkFlk(BLK.t*1.0+BLK.pat*5,ph===3?55:20);
  if(typeof SLL!=='undefined')for(const l of SLL)if(l.userData.b!==undefined)l.intensity=l.userData.b*BLK.sm;
  if(typeof SLH!=='undefined'&&SLH[0]&&SLH[0][0])SLH[0][0].material.opacity=.95*BLK.sm;
}
(function loop(){requestAnimationFrame(loop);let last=loop.t||performance.now();const n=performance.now();loop.t=n;
  try{if(typeof active!=='undefined'&&active){const dt=Math.min(.1,(n-last)/1000);blkTick(dt);blkWinTick(dt)}}catch(e){}})();
addEventListener('keydown',e=>{if(!e.repeat&&e.code===BLK.key&&typeof active!=='undefined'&&active&&!PH.dead)blkStart(blkPick(),(Math.random()*1e9)|0)});
