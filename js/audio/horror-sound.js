// [HORNCAM] js/audio/horror-sound.js
// ---------- Som de terror: zumbido grave contínuo + eventos distantes (rangidos, batidas, metal, arrasto, respiração) ----------
// Tudo sintetizado (sem arquivos), passa pelo mesmo bus das armas (MB) e obedece volume/mudo. Opção própria no painel.
Object.assign(OPT,{horror:true,tvl:1});
try{const o=JSON.parse(localStorage.getItem('horncam_opt')||'{}');if(typeof o.horror==='boolean')OPT.horror=o.horror;if(typeof o.tvl==='number')OPT.tvl=Math.max(0,Math.min(1,o.tvl))}catch(e){}
const HS={node:null,next:6,lvl:0};
function hsInit(A){
  if(HS.node||!MB)return;
  const g=A.createGain();g.gain.value=0;g.connect(MB);
  const o1=A.createOscillator(),o2=A.createOscillator(),lf=A.createOscillator(),lg=A.createGain();
  o1.type='sine';o1.frequency.value=38;o2.type='sine';o2.frequency.value=40.6;lf.frequency.value=.07;lg.gain.value=.5;
  const og=A.createGain();og.gain.value=.5;lf.connect(lg);lg.connect(og.gain);o1.connect(og);o2.connect(og);og.connect(g);
  o1.start();o2.start();lf.start();HS.node=g}
function hsOut(A,pan,lp,gain){ // saída com posição (esq/dir), distância (low-pass) e volume
  const g=A.createGain();g.gain.value=gain;const f=A.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;
  let last=f;g.connect(f);
  if(A.createStereoPanner){const p=A.createStereoPanner();p.pan.value=pan;f.connect(p);last=p}
  last.connect(MB);if(RV){const r=A.createGain();r.gain.value=.5;last.connect(r);r.connect(RV)}
  return g}
function hsNoise(A,dur){const n=A.sampleRate*dur|0,b=A.createBuffer(1,n,A.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=l*.9+(Math.random()*2-1)*.1;d[i]=l*3}
  const s=A.createBufferSource();s.buffer=b;return s}
const HEV={
  creak(A,o,t){ // rangido de metal/madeira: serra que oscila de altura, filtrada
    const d=1.4+Math.random()*1.8,s=A.createOscillator(),f=A.createBiquadFilter(),e=A.createGain(),v=A.createOscillator(),vg=A.createGain();
    s.type='sawtooth';const f0=48+Math.random()*60;s.frequency.setValueAtTime(f0,t);s.frequency.linearRampToValueAtTime(f0*(.7+Math.random()*.7),t+d);
    v.frequency.value=5+Math.random()*6;vg.gain.value=f0*.05;v.connect(vg);vg.connect(s.frequency);
    f.type='bandpass';f.frequency.value=380+Math.random()*500;f.Q.value=9;
    e.gain.setValueAtTime(.0001,t);e.gain.exponentialRampToValueAtTime(.5,t+d*.35);e.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(f);f.connect(e);e.connect(o);s.start(t);v.start(t);s.stop(t+d+.05);v.stop(t+d+.05)},
  thud(A,o,t){ // batida distante: pancada grave, às vezes dupla
    const hit=(tt,k)=>{const s=A.createOscillator(),e=A.createGain(),n=hsNoise(A,.4),nf=A.createBiquadFilter(),ng=A.createGain();
      s.frequency.setValueAtTime(85*k,tt);s.frequency.exponentialRampToValueAtTime(26,tt+.4);e.gain.setValueAtTime(.9*k,tt);e.gain.exponentialRampToValueAtTime(.001,tt+.5);
      nf.type='lowpass';nf.frequency.value=380;ng.gain.setValueAtTime(.6*k,tt);ng.gain.exponentialRampToValueAtTime(.001,tt+.3);
      s.connect(e);e.connect(o);n.connect(nf);nf.connect(ng);ng.connect(o);s.start(tt);s.stop(tt+.55);n.start(tt);n.stop(tt+.4)};
    hit(t,1);if(Math.random()<.45)hit(t+.35+Math.random()*.4,.7)},
  clank(A,o,t){ // metal batendo: parciais inarmônicas que decaem
    const b=180+Math.random()*260;[1,1.58,2.31,3.07].forEach((m,i)=>{const s=A.createOscillator(),e=A.createGain();s.type='sine';s.frequency.value=b*m;
      e.gain.setValueAtTime(.35/(i+1),t);e.gain.exponentialRampToValueAtTime(.0005,t+1.5-i*.2);s.connect(e);e.connect(o);s.start(t);s.stop(t+1.6)})},
  scrape(A,o,t){ // algo sendo arrastado
    const d=1.2+Math.random()*1.4,n=hsNoise(A,d),f=A.createBiquadFilter(),e=A.createGain(),tr=A.createOscillator(),tg=A.createGain();
    f.type='bandpass';f.Q.value=3;f.frequency.setValueAtTime(260,t);f.frequency.linearRampToValueAtTime(900+Math.random()*500,t+d);
    tr.frequency.value=9+Math.random()*7;tg.gain.value=.5;e.gain.setValueAtTime(.0001,t);e.gain.exponentialRampToValueAtTime(.55,t+d*.3);e.gain.exponentialRampToValueAtTime(.0001,t+d);
    tr.connect(tg);tg.connect(e.gain);n.connect(f);f.connect(e);e.connect(o);n.start(t);n.stop(t+d);tr.start(t);tr.stop(t+d)}};
const HK=Object.keys(HEV);let hLast='';
function horrorTick(dt){
  const A=AC;if(!A||!MB)return;
  const on=active&&OPT.horror;
  hsInit(A);if(HS.node)HS.node.gain.setTargetAtTime(on?.02:0,A.currentTime,on?1.5:.2);
  if(!on||A.state!=='running')return;
  HS.next-=dt;if(HS.next>0)return;
  HS.next=5+Math.random()*11;
  let k;do{k=HK[Math.random()*HK.length|0]}while(k===hLast);hLast=k;
  const far=.35+Math.random()*.65,o=hsOut(A,Math.random()*2-1,500+(1-far)*3500,.45+.55*(1-far)*.8);
  HEV[k](A,o,A.currentTime+.02)}
{
  const hb=document.getElementById('opthorror');
  if(hb){const ui=()=>{hb.textContent=OPT.horror?'LIGADO':'DESLIGADO';hb.classList.toggle('on',!OPT.horror)};ui();
    hb.addEventListener('click',()=>{OPT.horror=!OPT.horror;ui();optApply()});document.getElementById('optbtn').addEventListener('click',ui)}}
function tvGain(){return OPT.tvl*.05} // 100% do controle = o volume que antes era 5% (o ideal)
// estática das TVs da tela inicial: volume próprio (0 = desligada), independente do volume geral
{
  const tv=document.getElementById('opttv'),tvv=document.getElementById('opttvv');
  if(tv){const ui=()=>{tv.value=Math.round(OPT.tvl*100);tvv.textContent=OPT.tvl>.01?Math.round(OPT.tvl*100)+'%':'OFF'};ui();
    tv.addEventListener('input',()=>{OPT.tvl=tv.value/100;ui();optApply();});
    document.getElementById('optbtn').addEventListener('click',ui)}}
