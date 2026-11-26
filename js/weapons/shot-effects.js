// [HORNCAM] js/weapons/shot-effects.js
// ---------- Realismo: audio, luz, efeitos de tiro ----------
hitMeshes.forEach(m=>{m.castShadow=true;m.receiveShadow=true;});
flash.castShadow=true; // parâmetros da sombra (mapa, bias, near/far) ficam em rendering/lighting.js

const hemi=scene.children.find(o=>o.isHemisphereLight);
let EXPO=1,AMB=1;
function expo(dt){let L=0;for(const q of LREG.nearLamps()){if(q.off&&q.fz<=0)continue;const d=Math.hypot(q.l.position.x-camera.position.x,q.l.position.z-camera.position.z);L=Math.max(L,Math.max(0,1-d/12));}
  L=Math.min(1,L+(flashOn?.35:0));const T=(1.5-.7*L)*(typeof VIS!=='undefined'?VIS.exp:1);EXPO+=(T-EXPO)*(1-Math.exp(-dt*(T<EXPO?2.5:.8)));}
// audio
let MB,RV,BR;
function ac(){if(AC)return AC;try{AC=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'balanced'}); // buffer maior que o 'interactive': evita estalos no celular
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;
  const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=90;
  const cm=AC.createDynamicsCompressor();cm.threshold.value=-18;cm.ratio.value=6;
  MB=AC.createGain();MB.gain.value=.9;MB.connect(hp);hp.connect(lp);lp.connect(cm);cm.connect(mg(AC));
  const n=AC.sampleRate*1.1|0,ir=AC.createBuffer(1,n,AC.sampleRate),d=ir.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.5);
  RV=AC.createConvolver();RV.buffer=ir;const rg=AC.createGain();rg.gain.value=.35;RV.connect(rg);rg.connect(MB);
  const hum=AC.createOscillator();hum.type='sawtooth';hum.frequency.value=100;const hl=AC.createBiquadFilter();hl.type='lowpass';hl.frequency.value=300;const hg=AC.createGain();hg.gain.value=.012;hum.connect(hl);hl.connect(hg);hg.connect(MB);hum.start();
  const nb=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  const ns=AC.createBufferSource();ns.buffer=nb;ns.loop=true;
  const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=800;bp.Q.value=.5;BR=AC.createGain();BR.gain.value=0;ns.connect(bp);bp.connect(BR);BR.connect(MB);
  ns.start(); // chiado contínuo de fundo removido (só o ruído da respiração, via BR, continua)
  }catch(e){}return AC;}
ov.addEventListener('click',()=>{const A=ac();if(A&&A.state==='suspended')A.resume();if(A&&MB&&!window.__aw){window.__aw=1;const g=MB.gain.value;MB.gain.value=0;try{sfx('shot');sfx('imp');}catch(e){}setTimeout(()=>{MB.gain.value=g;},450);}});
// som espacial: SPOS={x,z,k?} marca de onde o som sai. Volume cai com a distância até a câmera (k = rapidez da queda) e o som vai para o lado certo (estéreo).
// Eventos que já chegam atenuados pela rede (SV<1) só ganham o balanço estéreo.
let SPOS=null;
function spat(){if(!SPOS||typeof camera==='undefined')return null;
  const dx=SPOS.x-camera.position.x,dz=SPOS.z-camera.position.z,d=Math.hypot(dx,dz),yw=P.camYaw||0;
  const att=(typeof SV!=='undefined'&&SV<1)?1:Math.max(.02,1/(1+d*(SPOS.k||.18)));
  const pan=d>.01?(dx*Math.cos(yw)-dz*Math.sin(yw))/d*Math.min(1,d/1.5)*.85:0;
  return {a:att,p:pan}}
function spOut(A,node){const sp=spat();if(sp&&A.createStereoPanner){const pn=A.createStereoPanner();pn.pan.value=sp.p;node.connect(pn);pn.connect(MB)}else node.connect(MB)}
function sndAt(pos,fn,k){const old=SPOS;SPOS=pos?{x:pos.x,z:pos.z,k:k}:null;try{return fn()}finally{SPOS=old}}
function nz(dur,gain,f,q,dec=3,rev=0,type='lowpass',when=0){const A=ac();if(!A)return;const n=A.sampleRate*dur|0,b=A.createBuffer(1,n,A.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,dec);
  const s=A.createBufferSource(),fl2=A.createBiquadFilter(),g=A.createGain();s.buffer=b;fl2.type=type;fl2.frequency.value=f;fl2.Q.value=q;{const sp=spat();g.gain.value=gain*SV*(sp?sp.a:1)}s.connect(fl2);fl2.connect(g);spOut(A,g);
  if(rev){const r=A.createGain();r.gain.value=rev;g.connect(r);r.connect(RV);}s.start(A.currentTime+when);}
function tn(f0,f1,dur,gain,type='sine',when=0){const A=ac();if(!A)return;const o=A.createOscillator(),g=A.createGain(),t=A.currentTime+when;o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);{const sp=spat();g.gain.setValueAtTime(Math.max(.0002,gain*SV*(sp?sp.a:1)),t)}g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);spOut(A,g);o.start(t);o.stop(t+dur+.02);}
