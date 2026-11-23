// [HORNCAM] js/weapons/shot-effects.js
// ---------- Realismo: audio, luz, efeitos de tiro ----------
hitMeshes.forEach(m=>{m.castShadow=true;m.receiveShadow=true;});
flash.castShadow=true; flash.shadow.mapSize.set(1024,1024); flash.shadow.camera.near=.1; flash.shadow.camera.far=30; flash.shadow.bias=-.0005;

const hemi=scene.children.find(o=>o.isHemisphereLight);
let EXPO=1,AMB=1;
function expo(dt){let L=0;for(const q of RL){if(q.off&&q.fz<=0)continue;const d=Math.hypot(q.l.position.x-camera.position.x,q.l.position.z-camera.position.z);L=Math.max(L,Math.max(0,1-d/12));}
  L=Math.min(1,L+(flashOn?.35:0));const T=1.5-.7*L;EXPO+=(T-EXPO)*(1-Math.exp(-dt*(T<EXPO?2.5:.8)));}
// audio
let MB,RV,BR;
function ac(){if(AC)return AC;try{AC=new (window.AudioContext||window.webkitAudioContext)();
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
  const hz=AC.createGain();hz.gain.value=.006;ns.connect(hz);hz.connect(MB);ns.start();
  }catch(e){}return AC;}
ov.addEventListener('click',()=>{const A=ac();if(A&&A.state==='suspended')A.resume();if(A&&MB&&!window.__aw){window.__aw=1;const g=MB.gain.value;MB.gain.value=0;try{sfx('shot');sfx('imp');}catch(e){}setTimeout(()=>{MB.gain.value=g;},450);}});
function nz(dur,gain,f,q,dec=3,rev=0,type='lowpass',when=0){const A=ac();if(!A)return;const n=A.sampleRate*dur|0,b=A.createBuffer(1,n,A.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,dec);
  const s=A.createBufferSource(),fl2=A.createBiquadFilter(),g=A.createGain();s.buffer=b;fl2.type=type;fl2.frequency.value=f;fl2.Q.value=q;g.gain.value=gain*SV;s.connect(fl2);fl2.connect(g);g.connect(MB);
  if(rev){const r=A.createGain();r.gain.value=rev;g.connect(r);r.connect(RV);}s.start(A.currentTime+when);}
function tn(f0,f1,dur,gain,type='sine',when=0){const A=ac();if(!A)return;const o=A.createOscillator(),g=A.createGain(),t=A.currentTime+when;o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(Math.max(.0002,gain*SV),t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(MB);o.start(t);o.stop(t+dur+.02);}
