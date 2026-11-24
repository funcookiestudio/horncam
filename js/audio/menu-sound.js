// [HORNCAM] js/audio/menu-sound.js
// ---------- Som do menu: TVs sem sintonia, zumbido de CRT e transmissões fantasmas (sintetizado) ----------
let MA=null,maNext=3,maOn=false;
function maNoise(A,dur){const n=A.sampleRate*dur|0,b=A.createBuffer(1,n,A.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return b;}
function maInit(){
  const A=ac();if(!A||MA)return;
  const out=A.createGain();out.gain.value=0;
  const lp=A.createBiquadFilter();lp.type='lowpass';lp.frequency.value=9000;out.connect(lp);lp.connect(mg(A));
  // chiado contínuo (TV fora do ar)
  const src=A.createBufferSource();src.buffer=maNoise(A,2);src.loop=true;
  const bp=A.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2600;bp.Q.value=.35;
  const sg=A.createGain();sg.gain.value=.1;src.connect(bp);bp.connect(sg);sg.connect(out);src.start();
  // zumbido elétrico 60/120 Hz + apito agudo de CRT + drone grave dissonante
  const mk=(type,f,g,flt)=>{const o=A.createOscillator(),gg=A.createGain();o.type=type;o.frequency.value=f;gg.gain.value=g;
    if(flt){const lf=A.createBiquadFilter();lf.type='lowpass';lf.frequency.value=flt;o.connect(lf);lf.connect(gg);}else o.connect(gg);gg.connect(out);o.start();return o;};
  mk('sawtooth',60,.035,300);mk('sine',120,.03);mk('sine',15734,.004);
  mk('sawtooth',41,.05,140);const dr=mk('sawtooth',43.3,.05,140);
  MA={A,out,sg,bp,dr};
}
function maBurst(dur,g,f0,f1,q=.6){const {A,out}=MA,t=A.currentTime;
  const s=A.createBufferSource();s.buffer=maNoise(A,dur+.1);const f=A.createBiquadFilter();f.type='bandpass';f.Q.value=q;
  f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);
  const gg=A.createGain();gg.gain.setValueAtTime(g,t);gg.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f);f.connect(gg);gg.connect(out);s.start(t);}
function maTone(type,f0,f1,dur,g,at=0,atk=.01){const {A,out}=MA,t=A.currentTime+at;
  const o=A.createOscillator(),gg=A.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  gg.gain.setValueAtTime(.0001,t);gg.gain.exponentialRampToValueAtTime(g,t+atk);gg.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(gg);gg.connect(out);o.start(t);o.stop(t+dur+.05);}
function maGlitchTV(){for(const s of TV_SCR)if(Math.random()<.5)s.gl=1;}
function maEvent(){
  const {A,out}=MA,t=A.currentTime,r=Math.floor(Math.random()*7);
  maGlitchTV();
  if(r===0){ // perda de sinal: estouro de chiado + queda de tom
    maBurst(.5+Math.random()*.6,.5,6000,500,.4);maTone('square',900,60,.5,.05);
  }else if(r===1){ // voz fantasma distorcida (transmissão de rádio ao fundo)
    const o=A.createOscillator(),lfo=A.createOscillator(),lg=A.createGain(),gg=A.createGain(),d=1.2+Math.random()*1.6;
    o.type='sawtooth';o.frequency.setValueAtTime(95+Math.random()*50,t);o.frequency.linearRampToValueAtTime(70+Math.random()*90,t+d);
    lfo.frequency.value=5+Math.random()*4;lg.gain.value=9;lfo.connect(lg);lg.connect(o.frequency);
    const f1=A.createBiquadFilter(),f2=A.createBiquadFilter();f1.type=f2.type='bandpass';f1.Q.value=f2.Q.value=6;
    f1.frequency.setValueAtTime(600,t);f1.frequency.linearRampToValueAtTime(1100,t+d*.4);f1.frequency.linearRampToValueAtTime(500,t+d);
    f2.frequency.setValueAtTime(1700,t);f2.frequency.linearRampToValueAtTime(900,t+d*.5);f2.frequency.linearRampToValueAtTime(2100,t+d);
    const ws=A.createWaveShaper(),cv=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;cv[i]=Math.tanh(x*4);}ws.curve=cv;
    gg.gain.setValueAtTime(.0001,t);gg.gain.exponentialRampToValueAtTime(.16,t+.2);gg.gain.setValueAtTime(.16,t+d-.3);gg.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(ws);ws.connect(f1);ws.connect(f2);f1.connect(gg);f2.connect(gg);gg.connect(out);
    o.start(t);lfo.start(t);o.stop(t+d+.05);lfo.stop(t+d+.05);maBurst(d,.12,3000,1800,1);
  }else if(r===2){ // bipes de alerta cortados
    for(let i=0;i<3;i++)maTone('square',1000,980,.11,.05,i*.2,.004);maBurst(.15,.3,4000,1000,.5);
  }else if(r===3){ // acorde dissonante crescendo
    const d=3.5+Math.random()*2;[220,233.1,311.1,466.2].forEach((f,i)=>{
      const o=A.createOscillator(),gg=A.createGain();o.type=i%2?'sine':'triangle';o.frequency.value=f*(1+(Math.random()-.5)*.01);
      gg.gain.setValueAtTime(.0001,t);gg.gain.exponentialRampToValueAtTime(.045,t+d*.7);gg.gain.exponentialRampToValueAtTime(.0001,t+d);
      o.connect(gg);gg.connect(out);o.start(t);o.stop(t+d+.05);});
  }else if(r===4){ // TV desligando: estalo + queda de tensão
    maTone('sine',140,22,.4,.5);maBurst(.12,.5,9000,3000,.8);maTone('sawtooth',50,50,.35,.08,.05);
  }else if(r===5){ // surto elétrico (zumbido modulado)
    const o=A.createOscillator(),gg=A.createGain(),l=A.createOscillator(),lg=A.createGain(),d=.7+Math.random()*.6;
    o.type='sawtooth';o.frequency.value=100;l.frequency.value=22;lg.gain.value=.05;l.connect(lg);lg.connect(gg.gain);
    gg.gain.setValueAtTime(.06,t);gg.gain.linearRampToValueAtTime(.0001,t+d);o.connect(gg);gg.connect(out);o.start(t);l.start(t);o.stop(t+d);l.stop(t+d);
    maBurst(d,.25,2000,8000,.5);
  }else{ // chiado que sobe e corta de repente
    const s=A.createBufferSource();s.buffer=maNoise(A,2);const f=A.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(200,t);f.frequency.exponentialRampToValueAtTime(7000,t+1.6);
    const gg=A.createGain();gg.gain.setValueAtTime(.0001,t);gg.gain.exponentialRampToValueAtTime(.35,t+1.6);gg.gain.setValueAtTime(.0001,t+1.65);
    s.connect(f);f.connect(gg);gg.connect(out);s.start(t);s.stop(t+1.7);
  }
}
function menuAudioTick(dt,on){
  if(on&&!MA)maInit();
  if(!MA)return;const A=MA.A;
  if(on&&A.state==='suspended'){try{A.resume();}catch(e){}}
  if(on!==maOn){maOn=on;MA.out.gain.setTargetAtTime(on?1:0,A.currentTime,on?.4:.08);}
  if(!on||A.state!=='running')return;
  const t=A.currentTime;
  MA.sg.gain.setTargetAtTime(.06+Math.random()*.1,t,.06);
  MA.bp.frequency.setTargetAtTime(1800+Math.random()*2400,t,.08);
  MA.dr.frequency.setTargetAtTime(43+Math.sin(t*.3)*1.2,t,.5);
  maNext-=dt;if(maNext<=0){maNext=4+Math.random()*9;maEvent();}
}
// o navegador só libera áudio depois de um gesto do jogador
['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,()=>{try{maInit();MA&&MA.A.state==='suspended'&&MA.A.resume();}catch(x){}},{passive:true}));
function sfx(n,v=1){switch(n){
  case 'shot':nz(.3,.9,5000,.7,3,.6);nz(.14,.8,800,.6,2);tn(170,40,.15,.8);break;
  case 'step':nz(.09,.35*v,320+Math.random()*120,1,2.5);tn(90,45,.08,.22*v);break;
  case 'rel':nz(.03,.5,3200,2,1,0,'bandpass');tn(1800,900,.03,.06,'square');break;
  case 'drop':nz(.08,.4,700,1.2,2,.1);tn(200,70,.08,.3);break;
  case 'ins':nz(.04,.6,2400,2,1,.1,'bandpass');tn(900,300,.05,.12,'square');nz(.03,.5,3000,2,1,.1,'bandpass',.09);break;
  case 'bolt':nz(.06,.6,2000,2,1.5,.2,'bandpass');tn(300,120,.07,.2,'square');break;
  case 'bolt2':nz(.07,.7,1700,2,1.2,.25,'bandpass');tn(520,150,.06,.25,'square');break;
  case 'shell':nz(.06,.25,6500,3,3,.1,'bandpass');tn(4300,3600,.07,.05);break;
  case 'imp':nz(.07,.4,1400,1,3,.1);break;}}
// ferrolho visivel
const bolt=bx(.006,.02,.05,.0265,.04,.01,MT(0x6b6f73,.4,.6));
Object.assign(W,{bs:0,bt:0,bk:0,lock:false,st:0,lk:false,ex:0});
// cartuchos
const shells=[],sgm=new THREE.CylinderGeometry(.0045,.0045,.03,6),smm=MT(0xb08a3a,.35,.8);
for(let i=0;i<14;i++){const m=new THREE.Mesh(sgm,smm);m.visible=false;scene.add(m);shells.push({m,v:new THREE.Vector3(),w:new THREE.Vector3(),life:0});}
let shi=0;const qq=new THREE.Quaternion(),vr=new THREE.Vector3(),vf=new THREE.Vector3();
function eject(){const s=shells[shi++%shells.length];gun.updateMatrixWorld(true);
  s.m.position.set(.034,.04,.02);gun.localToWorld(s.m.position);s.m.visible=true;s.life=7;
  camera.getWorldQuaternion(qq);vr.set(1,0,0).applyQuaternion(qq);vf.set(0,0,-1).applyQuaternion(qq);
  s.v.copy(vr).multiplyScalar(1.8+Math.random()*1.2).addScaledVector(vf,-.3+Math.random()*.6);s.v.y=1.2+Math.random()*1.2;
  s.w.set((Math.random()-.5)*40,0,(Math.random()-.5)*40);s.m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);}
// impactos
const rc=new THREE.Raycaster();rc.far=60;
const decals=[],sparks=[];let di=0,sk=0;
const dcm=new THREE.MeshBasicMaterial({color:0x050505,transparent:true,opacity:.85,polygonOffset:true,polygonOffsetFactor:-4,depthWrite:false}),dcg=new THREE.CircleGeometry(.035,10);
// marcas de bala removidas: o sistema de destruição já mostra os danos
const spm=new THREE.MeshBasicMaterial({color:0xffb050}),spg=new THREE.BoxGeometry(.012,.012,.012);
for(let i=0;i<140;i++){const m=new THREE.Mesh(spg,spm);m.visible=false;scene.add(m);sparks.push({m,v:new THREE.Vector3(),life:0});}
var TRC=null,tri=0;
function tracerInit(){const g=new THREE.BoxGeometry(.012,.012,1);g.translate(0,0,.5);const m0=new THREE.MeshBasicMaterial({color:0xffd9a0,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});
  TRC=[];for(let i=0;i<10;i++){const m=new THREE.Mesh(g,m0);m.visible=false;m.frustumCulled=false;scene.add(m);TRC.push({m,t:0,from:new V3(),to:new V3(),len:0})}}

function tracer(end,from){if(!TRC)tracerInit();const t=TRC[tri++%TRC.length];if(from)t.from.copy(from);else fl.getWorldPosition(t.from);t.to.copy(end);t.len=t.from.distanceTo(end);if(t.len<.6)return;
  t.t=0;t.m.position.copy(t.from);t.m.lookAt(t.to);t.m.scale.set(1,1,.001);t.m.visible=true}
function tracerTick(dt){if(!TRC)return;for(const t of TRC){if(!t.m.visible)continue;t.t+=dt;const d=t.t*280,tail=Math.max(0,d-5),head=Math.min(t.len,d);
  if(tail>=t.len){t.m.visible=false;continue}t.m.position.copy(t.from).lerp(t.to,tail/t.len);t.m.scale.set(1,1,Math.max(.001,head-tail))}}
// Aplica o impacto de UM acerto (parede, voxel, decoração, vidro, jogador...)
function dispatchHit(h,dir){
  const n=h.face.normal.clone();
  if(h.instanceId!=null){const m4=new THREE.Matrix4();h.object.getMatrixAt(h.instanceId,m4);n.transformDirection(m4);}
  n.transformDirection(h.object.matrixWorld);
  if(h.object.userData.steel){steelImpact(h,n,dir.clone());return;}
  if(hitChunk(h)){voxImpact(h,n,dir.clone());return;}
  if(h.object.userData.glassG){glassImpact(h,n,dir.clone());return;}
  if(h.object.userData.decK&&decImpact(h,n,dir.clone()))return;
  if(h.object.userData.rp){NET.hitPlayer(h.object.userData.rp,h.point,n);return;}
  if(h.object.userData.lampIM){hitLamp(h.instanceId);return;}
  const pp=[+h.point.x.toFixed(3),+h.point.y.toFixed(3),+h.point.z.toFixed(3)],pn=[+n.x.toFixed(3),+n.y.toFixed(3),+n.z.toFixed(3)];
  propFx(new V3(...pp),new V3(...pn));NET.send({t:'pi',p:pp,n:pn});}
// Papelão (caixas/cargas): a bala ATRAVESSA. Retorna a caixa envolvente (mn/mx) se o acerto for numa caixa penetrável, senão null.
function penBounds(h){const c=hitChunk(h);
  if(c)return c.hollow?{mn:c.min,mx:c.max}:null;
  if(h.object.userData.decK!=='m'||h.instanceId==null)return null;
  const b=DECK.m&&DECK.m.L[h.object.userData.decIdx[h.instanceId]];if(!b||b.cv||Math.min(b[3],b[4],b[5])<.35)return null;
  const q=Math.round(b[7]/(Math.PI/2));if(Math.abs(b[7]-q*Math.PI/2)>=.06)return null;
  const odd=Math.abs(q)%2===1,hx=(odd?b[5]:b[3])/2,hy=b[4]/2,hz=(odd?b[3]:b[5])/2;
  return{mn:new V3(b[0]-hx,b[1]-hy,b[2]-hz),mx:new V3(b[0]+hx,b[1]+hy,b[2]+hz)}}
function exitPoint(p,d,bd){let t=1e9;
  for(const ax of ['x','y','z']){const v=d[ax];if(Math.abs(v)<1e-6)continue;const tt=((v>0?bd.mx[ax]:bd.mn[ax])-p[ax])/v;if(tt>0&&tt<t)t=tt}
  return p.clone().addScaledVector(d,Math.min(t,3))}
function hit(){camera.updateMatrixWorld(true);const spr=(1-W.ads*.7)*.02;
  rc.setFromCamera({x:(Math.random()-.5)*spr,y:(Math.random()-.5)*spr},camera);
  const dir=rc.ray.direction.clone();
  let h=spatialRaycast(rc,hitMeshes.concat(decorHit),false)[0];tracer(h?h.point:rc.ray.at(60,new V3()));
  for(let depth=0;h;depth++){
    const bd=depth<3?penBounds(h):null;        // calculado ANTES do impacto (que converte a caixa em voxels)
    dispatchHit(h,dir);
    if(!bd)break;
    const P2=exitPoint(h.point,dir,bd);
    rc.set(P2.clone().addScaledVector(dir,.06),dir.clone().negate());rc.far=.25;  // buraco de saída: raio de fora para dentro na face oposta
    const hx=spatialRaycast(rc,hitMeshes.concat(decorHit),false)[0];
    if(hx)dispatchHit(hx,dir.clone().negate()); // a saída é furada "de fora para dentro" (a direção da bala aponta para fora do material)
    rc.set(P2.clone().addScaledVector(dir,.03),dir);rc.far=60;                   // a bala segue em frente
    h=spatialRaycast(rc,hitMeshes.concat(decorHit),false)[0];
    tracer(h?h.point:P2.clone().addScaledVector(dir,60),P2);}
  rc.far=60}
function propFx(pt,n){
  for(let i=0;i<22;i++){const s=sparks[sk++%sparks.length];s.m.position.copy(pt);s.v.set((Math.random()-.5)*4,Math.random()*3.2,(Math.random()-.5)*4).addScaledVector(n,R2(2,5));s.life=R2(.3,.55);s.m.visible=true;}
  for(let i=0;i<4;i++)deb1(pt,n,'spark',R2(.006,.012),R2(3,7),R2(.4,.8));
  sfx('imp');}
// poeira no ar e feixe da lanterna
const dgm=new THREE.BufferGeometry(),dpp=new Float32Array(900);for(let i=0;i<900;i++)dpp[i]=Math.random()*14;dgm.setAttribute('position',new THREE.BufferAttribute(dpp,3));
const dust=new THREE.Points(dgm,new THREE.ShaderMaterial({uniforms:{cp:{value:new THREE.Vector3()},cf:{value:new THREE.Vector3(0,0,-1)},fo:{value:0},time:{value:0},uH:{value:540}},
  vertexShader:'uniform vec3 cp,cf;uniform float fo,time,uH;varying float al;void main(){vec3 p=position+vec3(sin(time*.2+position.y*3.)*.4,-time*.05,cos(time*.17+position.x*2.)*.4);vec3 q=mod(p-cp+7.,14.)-7.;float L=length(q);float bm=smoothstep(.84,.97,dot(q/L,cf))*fo*(1.-smoothstep(3.,14.,L));al=(.1*(1.-smoothstep(3.,7.,L))+bm*1.1)*smoothstep(.4,1.2,L);vec4 mv=viewMatrix*vec4(cp+q,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.,(.012+bm*.02)*uH/max(-mv.z,.1));}',
  fragmentShader:'varying float al;void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(.85,.95,1.,(1.-smoothstep(.1,.5,r))*al);}',
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
dust.frustumCulled=false;scene.add(dust);
// O facho (spot + cone + poeira) segue a direção real da lanterna/cano: ao recuar a arma perto de paredes, a luz gira junto com ela
const FA_D=new THREE.Vector3();
const bmg=new THREE.ConeGeometry(4.25,12,28,1,true);bmg.translate(0,-6,0);bmg.rotateX(Math.PI/2);
const beam=new THREE.Mesh(bmg,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec3 vn,vv;varying float vy;void main(){vy=clamp(-position.z/12.,0.,1.);vec4 mv=modelViewMatrix*vec4(position,1.);vn=normalMatrix*normal;vv=-mv.xyz;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying vec3 vn,vv;varying float vy;void main(){float f=abs(dot(normalize(vn),normalize(vv)));gl_FragColor=vec4(1.,.95,.8,pow(f,2.5)*(1.-vy)*.2);}'}));
beam.visible=false;beam.frustumCulled=false;gun.add(beam);beam.position.copy(FL_LENS); // cone de luz parte da lanterna da arma
function fxTick(dt,sprint,sp){
  const k=r=>1-Math.exp(-dt*r);
  W.bk*=Math.exp(-dt*30);bolt.position.z+=((W.lock?1:W.bk)*.045+.01-bolt.position.z)*k(45);
  W.bt-=dt;if(W.bt<=0)W.bs=0;
  const st=Math.floor(P.bobT/Math.PI);if(st!==W.st){W.st=st;if(P.onGround&&sp>.6)sfx('step',sprint?1:P.crouch?.4:.7);}
  if(P.landKick>.05&&!W.lk)sfx('step',1.5);W.lk=P.landKick>.05;
  W.ex+=((sprint?1:0)-W.ex)*k(sprint?.35:.12);
  if(AC&&BR)BR.gain.setTargetAtTime((.015+.2*W.ex)*(.55+.45*Math.sin(time*(2.4+W.ex*3.2))),AC.currentTime,.06);
  for(const s of shells){if(!s.m.visible)continue;s.life-=dt;if(s.life<=0){s.m.visible=false;continue;}
    s.v.y-=9.8*dt;s.m.position.addScaledVector(s.v,dt);s.m.rotation.x+=s.w.x*dt;s.m.rotation.z+=s.w.z*dt;
    if(s.m.position.y<.012){s.m.position.y=.012;if(Math.abs(s.v.y)>1.2)sfx('shell');s.v.y*=-.35;s.v.x*=.5;s.v.z*=.5;s.w.multiplyScalar(.5);}}
  for(const s of sparks){if(!s.m.visible)continue;s.life-=dt;if(s.life<=0){s.m.visible=false;continue;}s.v.y-=7*dt;s.m.position.addScaledVector(s.v,dt);s.m.scale.setScalar(Math.min(1,s.life/.35));}
  const U=dust.material.uniforms;U.time.value=time;gun.updateMatrixWorld(true);flash.getWorldPosition(U.cp.value);U.cf.value.set(0,0,-1).transformDirection(gun.matrixWorld);U.fo.value=flashOn?1:0;U.uH.value=rt.height;beam.visible=flashOn;
}
