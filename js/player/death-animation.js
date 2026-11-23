// [HORNCAM] js/player/death-animation.js
// ---------- animação de morte: lente quebra + perda de sinal ----------
const crackEl=$('crack'),nosigEl=$('nosig'),DA={t:0,was:false,back:false,sig:0,vis:0,sh:0,dir:1};
let DR=0;
function drawCracks(){
  const w=crackEl.width=Math.max(2,innerWidth*.75|0),h=crackEl.height=Math.max(2,innerHeight*.75|0),g=crackEl.getContext('2d');
  g.clearRect(0,0,w,h);
  const cx=w*(.35+Math.random()*.3),cy=h*(.3+Math.random()*.35),M=Math.max(w,h);
  g.lineCap='round';g.lineJoin='round';
  const ln=(x0,y0,x1,y1,wd)=>{
    g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=wd+2;g.beginPath();g.moveTo(x0+1,y0+1);g.lineTo(x1+1,y1+1);g.stroke();
    g.strokeStyle='rgba(225,240,250,.85)';g.lineWidth=wd;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();};
  const seg=(x,y,a,len,wd,dp)=>{
    let px=x,py=y;const n=Math.max(3,(len/(M*.03))|0);
    for(let i=0;i<n;i++){
      a+=(Math.random()-.5)*.55;const l=len/n*(.7+Math.random()*.6),nx=px+Math.cos(a)*l,ny=py+Math.sin(a)*l;
      ln(px,py,nx,ny,Math.max(.6,wd*(1-i/n*.5)));
      if(dp<2&&Math.random()<.25)seg(nx,ny,a+(Math.random()-.5)*1.8,len*.45*(1-i/n),wd*.6,dp+1);
      px=nx;py=ny;}};
  const N=10+(Math.random()*6|0);
  for(let i=0;i<N;i++)seg(cx,cy,i/N*6.283+Math.random()*.4,M*(.35+Math.random()*.45),1.6+Math.random()*1.2,0);
  // anéis irregulares (teia)
  for(const r of [M*.05,M*.11,M*.2]){
    const st=12+(r/M*60|0);let a=Math.random()*6.283,px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r;
    for(let i=0;i<st;i++){a+=6.283/st;const rr=r*(.85+Math.random()*.3),nx=cx+Math.cos(a)*rr,ny=cy+Math.sin(a)*rr;
      if(Math.random()<.7)ln(px,py,nx,ny,.9);px=nx;py=ny;}}
  // brilho no ponto de impacto e estilhaços
  const gr=g.createRadialGradient(cx,cy,0,cx,cy,M*.12);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let i=0;i<26;i++){const a=Math.random()*6.283,r=M*(.03+Math.random()*.3),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r,s=3+Math.random()*10;
    g.fillStyle='rgba(220,235,245,'+(.05+Math.random()*.12)+')';g.beginPath();g.moveTo(x,y);g.lineTo(x+s*(Math.random()-.3),y+s*(Math.random()-.5));g.lineTo(x+s*(Math.random()-.5),y+s*Math.random());g.fill();}
}
const RESP_DELAY=4,respBtn=document.getElementById('respbtn');
function doRespawn(){if(!PH.dead||DA.t<RESP_DELAY)return;respawn();respBtn.style.display='none';
  if(!isTouch&&canvas.requestPointerLock){try{canvas.requestPointerLock();}catch(e){}}}
respBtn.addEventListener('click',doRespawn);
addEventListener('keydown',e=>{if(e.code==='Enter'&&PH.dead&&respBtn.style.display==='block')doRespawn();});
function deathTick(dt){
  if(PH.dead&&!DA.was){
    DA.was=true;DA.back=false;DA.t=0;DA.sh=1;DA.dir=Math.random()<.5?-1:1;hurtV=1;aliveT=0;
    try{nz(.9,.6,8000,.7,.8,.3,'highpass');nz(.2,.8,300,1,2,.3);tn(70,28,.5,.6);tn(1200,90,1.2,.07,'square');}catch(e){}
  }
  if(!PH.dead&&DA.was){DA.was=false;DA.back=true;try{nz(.3,.4,6000,1,1.5,.1,'highpass');tn(400,1600,.25,.06,'square');}catch(e){}}
  {const rb=respBtn;
    if(PH.dead&&DA.t>=RESP_DELAY){if(rb.style.display!=='block'){rb.style.display='block';
        if(!isTouch&&document.pointerLockElement===canvas){unlockForResp=true;try{document.exitPointerLock();}catch(e){}}}}
    else if(rb.style.display!=='none')rb.style.display='none';
    if(PH.dead&&!NET.on){msgEl.textContent='ELIMINADO';msgEl.style.display='block';}}
  if(PH.dead){
    DA.t+=dt;
    let s=DA.t<.2?.25+.35*Math.random():Math.min(1,.3+(DA.t-.2)*.5);
    if(DA.t>.4&&DA.t<2.4&&Math.random()<dt*6)s=Math.max(s-.3,.2);   // falhas intermitentes
    if(DA.t>2.4)s=Math.random()>.12?1:.8;                          // sem sinal
    DA.sig+=(s-DA.sig)*(1-Math.exp(-dt*25));DA.vis=DA.sig;
  }else if(DA.back){
    DA.sig=Math.max(0,DA.sig-dt*1.2);DA.vis=DA.sig*(Math.random()>.2?1:.4);   // sinal voltando, tremendo
    if(DA.sig<=0){DA.back=false;DA.vis=0;}
  }
  post.uniforms.sig.value=DA.vis;
  if(DA.sh>.01){post.uniforms.shake.value+=DA.sh*40;DA.sh*=Math.exp(-dt*2.5);}
  DR+=((PH.dead?.5*DA.dir:0)-DR)*(1-Math.exp(-dt*3));
  nosigEl.style.display=DA.vis>.8&&(Math.floor(time*2.5)%2===0)?'block':'none';
}

