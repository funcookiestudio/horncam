// [HORNCAM] js/audio/horror-director.js
// ---------- Diretor de terror: piano dissonante, sinos distantes, drones, batimento e "diretor de sustos" ----------
// Tudo sintetizado (Web Audio, sem arquivos), no mesmo bus das armas (MB) e com reverb (RV). Obedece a opção TERROR.
// A tensão sobe com a sanidade baixa e fora do galpão (neblina). Pausas de silêncio antes dos eventos deixam o susto pior.
const HD={drone:null,dg:null,hi:null,hb:0,next:22,last:'',silence:0,T:0,tn:0,gl:-1,hl:-1,sl:false};
function hdT(){ // tensão 0..1
  let t=.22+.6*(1-SAN.v/100);if(SAN.out)t+=.16;if(SAN.lit!==undefined&&SAN.lit<.15)t+=.08;return Math.max(0,Math.min(1,t))}
function hdInit(A){
  if(HD.drone||!MB)return;
  const g=A.createGain();g.gain.value=0;g.connect(MB);if(RV){const r=A.createGain();r.gain.value=.35;g.connect(r);r.connect(RV)}
  // drone grave dissonante (trítono) com filtro lento
  const f=A.createBiquadFilter();f.type='lowpass';f.frequency.value=140;f.Q.value=4;f.connect(g);
  [[55,'sawtooth',.05],[55.4,'sawtooth',.05],[77.9,'sawtooth',.035],[110.7,'triangle',.03]].forEach(([fr,ty,v])=>{const o=A.createOscillator(),og=A.createGain();o.type=ty;o.frequency.value=fr;og.gain.value=v;o.connect(og);og.connect(f);o.start()});
  const lf=A.createOscillator(),lg=A.createGain();lf.frequency.value=.045;lg.gain.value=70;lf.connect(lg);lg.connect(f.frequency);lf.start();
  // fio agudo de tensão (aparece só com sanidade baixa): dois senos quase iguais batendo
  const h=A.createGain();h.gain.value=0;h.connect(MB);
  [[1976,.5],[1996.5,.5],[2637,.25]].forEach(([fr,v])=>{const o=A.createOscillator(),og=A.createGain();o.type='sine';o.frequency.value=fr;og.gain.value=v*.012;o.connect(og);og.connect(h);o.start()});
  HD.drone=f;HD.dg=g;HD.hi=h}
function hdOut(A,pan,lp,gain,wet){
  const g=A.createGain();g.gain.value=gain;const f=A.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;g.connect(f);let last=f;
  if(A.createStereoPanner){const p=A.createStereoPanner();p.pan.value=pan;f.connect(p);last=p}
  last.connect(MB);if(RV){const r=A.createGain();r.gain.value=wet;last.connect(r);r.connect(RV)}return g}
// ----- piano sintetizado: parciais levemente inarmônicos, martelo, decaimento mais rápido nos agudos -----
function hdNote(A,o,t,fr,vel,dur){
  const B=.00025,P=[1,.55,.38,.22,.14,.09,.06];
  P.forEach((a,i)=>{const n=i+1,s=A.createOscillator(),e=A.createGain();s.type='sine';s.frequency.value=fr*n*Math.sqrt(1+B*n*n);
    s.detune.value=(Math.random()-.5)*6;const d=dur/(1+n*.45);
    e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(vel*a*.3,t+.006);e.gain.exponentialRampToValueAtTime(.0004,t+d);
    s.connect(e);e.connect(o);s.start(t);s.stop(t+d+.05)});
  const nz=hsNoise(A,.05),nf=A.createBiquadFilter(),ng=A.createGain();nf.type='bandpass';nf.frequency.value=Math.min(4000,fr*5);nf.Q.value=1.2;
  ng.gain.setValueAtTime(vel*.18,t);ng.gain.exponentialRampToValueAtTime(.001,t+.05);nz.connect(nf);nf.connect(ng);ng.connect(o);nz.start(t);nz.stop(t+.06)}
const HD_MF=m=>440*Math.pow(2,(m-69)/12);
function hdPiano(A,T){
  const root=40+(Math.random()*14|0),iv=[0,1,6,7,10,13],o=hdOut(A,Math.random()*1.4-.7,1800+Math.random()*1800,.5,.9);
  let t=A.currentTime+.05;const n=3+(Math.random()*4|0);
  for(let i=0;i<n;i++){
    const m=root+iv[Math.random()*iv.length|0]+(Math.random()<.2?12:0),vel=(.55-i*.05)*(.8+.4*Math.random());
    hdNote(A,o,t,HD_MF(m)*(T>.65&&Math.random()<.35?1.014:1),vel,3.2+Math.random()*2);
    if(T>.55&&Math.random()<.4)hdNote(A,o,t+.01,HD_MF(m+1),vel*.7,3);   // segunda menor junto: arrepio
    t+=.7+Math.random()*(2.4-T*1.2)}}
// ----- sino distante: parciais inarmônicos de bronze, batida lenta -----
function hdBell(A,T){
  const base=96+Math.random()*70,R=[.5,1,1.19,1.5,2,2.51,3.1,4.2],V=[.5,1,.7,.5,.45,.3,.2,.12];
  const hits=1+(Math.random()*(T>.6?4:2)|0),o=hdOut(A,Math.random()*1.6-.8,900+Math.random()*700,.9,1.1);
  for(let h=0;h<hits;h++){const t=A.currentTime+.05+h*(3.6+Math.random()*1.6);
    R.forEach((r,i)=>{[0,1].forEach(k=>{const s=A.createOscillator(),e=A.createGain(),d=(9-i*.9)*(k?.8:1);s.type='sine';s.frequency.value=base*r*(k?1.004:1);
      e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(V[i]*.22,t+.012);e.gain.exponentialRampToValueAtTime(.0003,t+d);s.connect(e);e.connect(o);s.start(t);s.stop(t+d+.1)})})}}
// ----- batimento cardíaco (sanidade baixa) -----
function hdBeat(A,v){
  const o=hdOut(A,0,260,v,.2),t=A.currentTime+.01;
  [[0,1],[.26,.7]].forEach(([dt,k])=>{const s=A.createOscillator(),e=A.createGain();s.frequency.setValueAtTime(70,t+dt);s.frequency.exponentialRampToValueAtTime(32,t+dt+.16);
    e.gain.setValueAtTime(.8*k,t+dt);e.gain.exponentialRampToValueAtTime(.001,t+dt+.22);s.connect(e);e.connect(o);s.start(t+dt);s.stop(t+dt+.25)})}
// ----- passos/sussurro fantasmas: ruído filtrado em formante, bem baixo -----
function hdWhisper(A){
  const d=1.6+Math.random()*1.6,n=hsNoise(A,d),f=A.createBiquadFilter(),f2=A.createBiquadFilter(),e=A.createGain(),o=hdOut(A,Math.random()*2-1,3500,.35,.6),t=A.currentTime+.05;
  f.type='bandpass';f.Q.value=5;f.frequency.setValueAtTime(1500,t);f.frequency.linearRampToValueAtTime(900+Math.random()*1200,t+d);f2.type='highpass';f2.frequency.value=500;
  e.gain.setValueAtTime(.0001,t);e.gain.exponentialRampToValueAtTime(.7,t+d*.4);e.gain.exponentialRampToValueAtTime(.0001,t+d);
  n.connect(f);f.connect(f2);f2.connect(e);e.connect(o);n.start(t);n.stop(t+d)}
// ----- silêncio súbito: o drone some e, depois de uns segundos, vem uma nota só -----
function hdSilence(A,T){
  HD.silence=6+Math.random()*5;
  setTimeout(()=>{if(AC&&AC.state==='running'){const o=hdOut(AC,Math.random()-.5,2600,.6,1);hdNote(AC,o,AC.currentTime+.02,HD_MF(52+(Math.random()*6|0)),.7,5);
    if(T>.5&&Math.random()<.6)HEV.thud(AC,hsOut(AC,Math.random()*2-1,700,.8),AC.currentTime+2.2)}},(HD.silence-1.2)*1000)}
const HD_EV={bell:[3,hdBell],piano:[4,hdPiano],silence:[2,hdSilence],whisper:[2,(A,T)=>hdWhisper(A)],creak:[2,(A)=>{const k=['creak','thud','clank','scrape'][Math.random()*4|0];HEV[k](A,hsOut(A,Math.random()*2-1,900,.8),A.currentTime+.02)}]};
function hdPick(T){
  const ks=Object.keys(HD_EV).filter(k=>k!==HD.last&&(k!=='whisper'||T>.45)&&(k!=='silence'||T>.35));let w=0;ks.forEach(k=>w+=HD_EV[k][0]);let r=Math.random()*w;
  for(const k of ks){r-=HD_EV[k][0];if(r<=0)return k}return ks[0]}
function hdTick(dt){
  const A=AC;if(!A||!MB||typeof SAN==='undefined')return;
  const on=active&&OPT.horror&&GS.mode==='play'&&!PH.dead;
  hdInit(A);if(!HD.dg)return;
  const T=HD.T+=(hdT()-HD.T)*Math.min(1,dt*.3);
  if(HD.silence>0)HD.silence-=dt;
  const dgT=on&&HD.silence<=0?.55+.45*T:0;
  const gT=on?(HD.silence>0?0:.9+T):0,hT=on&&HD.silence<=0?Math.max(0,(T-.45)*1.6):0;   // só reagenda quando muda (evita acumular automações a 60/s)
  if(Math.abs(gT-HD.gl)>.02||HD.sl!==(HD.silence>0)){HD.gl=gT;HD.sl=HD.silence>0;HD.dg.gain.setTargetAtTime(gT,A.currentTime,HD.sl?.15:1.8)}
  if(HD.hi&&Math.abs(hT-HD.hl)>.03){HD.hl=hT;HD.hi.gain.setTargetAtTime(hT,A.currentTime,2)}
  if(!on||A.state!=='running')return;
  if(SAN.v<38){HD.hb-=dt;const bpm=62+(38-SAN.v)*1.6;if(HD.hb<=0){hdBeat(A,.22+(38-SAN.v)/38*.5);HD.hb=60/bpm}}
  HD.next-=dt;if(HD.next>0||HD.silence>0)return;
  HD.next=(34-T*22)*(.7+Math.random()*.6);   // calmo: ~30 s entre eventos; tenso: ~12 s
  const k=hdPick(T);HD.last=k;HD_EV[k][1](A,T)}
// engancha no laço de som que já roda todo frame (horrorTick), sem mexer no loop principal
{const _ht=horrorTick;horrorTick=function(dt){_ht(dt);hdTick(dt)}}
