// [HORNCAM] js/rendering/lens.js
// ---------- Lente: sujeira e reflexos (camada separada, sem tocar no shader da camera) ----------
const lens=document.getElementById('lens'),lx=lens.getContext('2d');
const dirt=(()=>{const S=512,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');let s=11;const R=()=>(s=(s*16807)%2147483647)/2147483647;
  const edge=()=>{const a=R()*6.283,r=.25+.75*Math.sqrt(R());return [S/2+Math.cos(a)*r*S*.62,S/2+Math.sin(a)*r*S*.62];};
  for(let i=0;i<14;i++){const [x,y]=edge(),r=40+R()*90,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,'+(.1+R()*.18)+')');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
  g.lineCap='round';for(let i=0;i<7;i++){const [x,y]=edge();g.strokeStyle='rgba(255,255,255,'+(.05+R()*.08)+')';g.lineWidth=14+R()*26;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+(R()-.5)*160,y+(R()-.5)*160,x+(R()-.5)*220,y+(R()-.5)*220);g.stroke();}
  for(let i=0;i<14;i++){g.strokeStyle='rgba(255,255,255,'+(.2+R()*.25)+')';g.lineWidth=.6;g.beginPath();const x=R()*S,y=R()*S,a=R()*6.283,l=20+R()*90;g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
  for(let i=0;i<420;i++){const x=R()*S,y=R()*S,r=.4+R()*1.3;g.fillStyle='rgba(255,255,255,'+(.15+R()*.45)+')';g.beginPath();g.arc(x,y,r,0,6.283);g.fill();}
  for(let i=0;i<10;i++){const [x,y]=edge(),r=5+R()*11,gr=g.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(.7,'rgba(255,255,255,.12)');gr.addColorStop(1,'rgba(255,255,255,.4)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.283);g.fill();}
  g.globalCompositeOperation='source-atop';g.fillStyle='rgb(190,235,225)';g.fillRect(0,0,S,S);
  return c;})();
const lrc=new THREE.Raycaster();let lfr=0;const lvv=new THREE.Vector3();
const rpv=new THREE.Vector3(),rqq=new THREE.Quaternion(),rfw=new THREE.Vector3(),rto=new THREE.Vector3();let glareS=0;const glareP={x:.5,y:.5};
function flare(c,w,h,m){
  const I=Math.min(1,c.I),R=m*(.10+.22*I);
  const rg=(x,y,r,col,al)=>{const g=lx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+col+','+al+')');g.addColorStop(1,'rgba('+col+',0)');lx.fillStyle=g;lx.fillRect(x-r,y-r,r*2,r*2);};
  if(c.muz){rg(c.x,c.y,m*.14,'255,190,110',.7*I);return;}
  rg(c.x,c.y,R,'255,244,225',.75*I);
  lx.save();lx.translate(c.x,c.y);lx.scale(2.6,.09);rg(0,0,R*.9,'150,200,255',.5*I);lx.restore();
  const vx=w/2-c.x,vy=h/2-c.y;
  [[.5,.05,'120,255,230',.25],[.9,.09,'200,150,255',.2],[1.4,.13,'255,200,140',.16],[1.9,.06,'120,200,255',.2]].forEach(([k,rr,col,al])=>{
    const x=c.x+vx*k,y=c.y+vy*k,r=m*rr,g=lx.createRadialGradient(x,y,r*.55,x,y,r);
    g.addColorStop(0,'rgba('+col+',0)');g.addColorStop(.85,'rgba('+col+','+al*I+')');g.addColorStop(1,'rgba('+col+',0)');lx.fillStyle=g;lx.fillRect(x-r,y-r,r*2,r*2);});
}
let lensEffectsEnabled=true;
// no menu, a luz das TVs ofusca a lente: mesma sujeira, glare e flare da câmera do jogador
const mlv=new THREE.Vector3();
function menuLens(dt,w,h){
  mlv.set(350,-498,0);tvIn.localToWorld(mlv);mlv.project(menuCam);
  const tg=Math.min(1,(menuScare?.55:.14)+Math.random()*.06);
  glareS+=(tg-glareS)*(1-Math.exp(-dt*(tg>glareS?14:1.8)));
  glareP.x=mlv.x*.5+.5;glareP.y=mlv.y*.5+.5;
  post.uniforms.glare.value=glareS;post.uniforms.lpos.value.set(glareP.x,glareP.y);
  const bloom=Math.min(1,.25+glareS*.9);
  lx.globalCompositeOperation='lighter';lx.globalAlpha=Math.min(1,.07+bloom*.4);
  const k=Math.max(w,h)/512;lx.drawImage(dirt,w/2-256*k,h/2-256*k,512*k,512*k);lx.globalAlpha=1;
  flare({x:glareP.x*w,y:(1-glareP.y)*h,I:.6+glareS*.5},w,h,Math.min(w,h));
}
// Lente otimizada: mantém sujeira, flare e ofuscamento, mas limita raycasts caros.
// As fontes são projetadas a cada quadro; a oclusão é atualizada em orçamento pequeno e escalonado.
let lensOcCursor=0,lensRemoteOcCursor=0;
function lensTick(dt){
  const w=Math.max(2,innerWidth*.5|0),h=Math.max(2,innerHeight*.5|0);
  if(lens.width!==w||lens.height!==h){lens.width=w;lens.height=h;}
  lx.globalCompositeOperation='source-over';lx.clearRect(0,0,w,h);
  if(!active&&MENU_ON&&lensEffectsEnabled){menuLens(dt,w,h);return;}
  if(!active||!lensEffectsEnabled){glareS=0;post.uniforms.glare.value=0;post.uniforms.lpos.value.set(.5,.5);return;}
  lfr++;const cand=[];
  // Primeiro: projeção e triagem barata. Não fazer raycast para centenas de lâmpadas.
  const LL=LREG.nearLamps();
  for(let i=0;i<LL.length;i++){
    const L=LL[i];
    lvv.set(L.pos.x,L.pos.y,L.pos.z).project(camera);
    if(lvv.z>1||Math.abs(lvv.x)>1.35||Math.abs(lvv.y)>1.35){L.fi=0;continue;}
    const dx=L.pos.x-camera.position.x,dy=L.pos.y-camera.position.y,dz=L.pos.z-camera.position.z;
    const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(d>26){L.fi=0;continue;}
    const f=Math.max(0,(L.p.material.color.r-.35)/.65),nd=Math.hypot(lvv.x,lvv.y);
    const I=Math.max(0,1-d/26)*f*(.4+.6*(1-Math.min(1,nd/1.5)))*(L.real?1:.35); // painéis (antes só visuais) pesam menos: com 69 luzes na tela a lente enchia de círculos
    L.fi=(L.fi||0)+(I-(L.fi||0))*.5;
    if(L.fi>.012)cand.push({L,x:(lvv.x*.5+.5)*w,y:(-lvv.y*.5+.5)*h,I:L.fi,d,idx:i});
  }
  cand.sort((a,b)=>b.I-a.I);
  // No máximo dois raycasts de lâmpadas por quadro. Oclusão cacheada por fonte.
  let checks=0;
  for(let n=0;n<cand.length&&checks<2;n++){
    const c=cand[n],L=c.L;
    if(!L.lensOcUntil||time>=L.lensOcUntil){
      const dir=new THREE.Vector3(L.pos.x-camera.position.x,L.pos.y-camera.position.y,L.pos.z-camera.position.z);
      const dist=dir.length();if(dist>.01){dir.multiplyScalar(1/dist);lrc.set(camera.position,dir);lrc.far=Math.max(.1,dist-.4);L.lensOc=spatialRaycast(lrc,hitMeshes,false).length>0;}
      L.lensOcUntil=time+.32+(c.idx%5)*.025;checks++;
    }
  }
  const visible=[];
  for(const c of cand){if(!c.L.lensOc)visible.push(c);if(visible.length>=4)break;}
  // Lanterna de outros jogadores: mantém o efeito, mas faz no máximo um teste de oclusão por quadro.
  const remCand=[];
  if(typeof NET!=='undefined')for(const id in NET.rem){
    const r=NET.rem[id];
    if(!r.has||!r.fl||r.dead||!r.g.visible){r.gi=0;continue;}
    r.lamp.getWorldPosition(rpv);lvv.copy(rpv).project(camera);
    if(lvv.z>1||Math.abs(lvv.x)>1.6||Math.abs(lvv.y)>1.6){r.gi=0;continue;}
    const d=camera.position.distanceTo(rpv);if(d>60){r.gi=0;continue;}
    r.hd.getWorldQuaternion(rqq);rfw.set(0,0,-1).applyQuaternion(rqq);rto.copy(camera.position).sub(rpv).normalize();
    const al=rfw.dot(rto);let cone=Math.max(0,Math.min(1,(al-.78)/.19));cone=cone*cone*(3-2*cone);
    const base=al>-.1?.07:0,nd=Math.hypot(lvv.x,lvv.y),dist=Math.min(1,12/(d+4))*Math.max(0,1-d/60);
    const I=Math.max(base,cone)*dist*(.4+.6*(1-Math.min(1,nd/1.8)));
    r.gi=(r.gi||0)+(I-(r.gi||0))*.5;
    if(r.gi>.02)remCand.push({r,id,x:(lvv.x*.5+.5)*w,y:(-lvv.y*.5+.5)*h,I:r.gi,d});
  }
  remCand.sort((a,b)=>b.I-a.I);
  if(remCand.length){const c=remCand[0],r=c.r;
    if(!r.lensOcUntil||time>=r.lensOcUntil){
      r.lamp.getWorldPosition(rpv);const dir=rpv.clone().sub(camera.position);const dist=dir.length();
      if(dist>.01){dir.multiplyScalar(1/dist);lrc.set(camera.position,dir);lrc.far=Math.max(.1,dist-.3);r.lensOc=spatialRaycast(lrc,hitMeshes,false).some(h=>!(h.object.userData.rp&&h.object.userData.rp.id===r.id));}
      r.lensOcUntil=time+.35;}
    if(!r.lensOc)visible.push({...c,rf:true});
  }
  visible.sort((a,b)=>b.I-a.I);
  let tg=0,bx2=.5,by2=.5;
  for(const c of visible){const v=Math.min(1,c.I*(c.rf?1.25:.3));if(v>tg){tg=v;bx2=c.x/w;by2=1-c.y/h;}}
  glareS+=(tg-glareS)*(1-Math.exp(-dt*(tg>glareS?14:1.8)));
  if(tg>.02){glareP.x=bx2;glareP.y=by2;}
  post.uniforms.glare.value=glareS;post.uniforms.lpos.value.set(glareP.x,glareP.y);
  let bloom=0;for(const c of visible.slice(0,2))bloom+=c.I;bloom=Math.min(1,bloom*.9);
  if(W.fl>0){fl.getWorldPosition(lvv).project(camera);visible.unshift({x:(lvv.x*.5+.5)*w,y:(-lvv.y*.5+.5)*h,I:.9,muz:true});bloom=Math.min(1,bloom+.6);}
  if(flashOn)bloom=Math.min(1,bloom+.12);
  // A sujeira é uma textura pré-gerada; flares só são desenhados para as quatro fontes mais fortes.
  lx.globalCompositeOperation='lighter';lx.globalAlpha=Math.min(1,.07+bloom*.4);
  const sc=Math.max(w,h)/512;lx.drawImage(dirt,w/2-256*sc,h/2-256*sc,512*sc,512*sc);lx.globalAlpha=1;
  const m=Math.min(w,h);for(const c of visible.slice(0,2)){if(c.I>.04)flare(c,w,h,m);}
}
updAmmo();

