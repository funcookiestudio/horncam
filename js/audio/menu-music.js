// [HORNCAM] js/audio/menu-music.js
// ---------- Música da tela inicial: "Pulsar Morto" (coração que não deveria bater + sinos metálicos no escuro) ----------
// Gerada por síntese (sem arquivo): renderizada offline uma vez, em loop sem emenda de 60 s. Toca só na tela inicial; volume próprio no painel (MÚSICA).
Object.assign(OPT,{mus:.6});
try{const o=JSON.parse(localStorage.getItem('horncam_opt')||'{}');if(typeof o.mus==='number')OPT.mus=Math.max(0,Math.min(1,o.mus))}catch(e){}
(function(){
  const L=60,TAIL=6,SR=44100,R=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],q=f=>Math.round(f*L)/L; // ciclos inteiros em 60 s = loop sem estalo
  let buf=null,rendering=false,src=null,gn=null,playing=false;
  async function render(){
    const oc=new OfflineAudioContext(2,SR*(L+TAIL),SR),bus=oc.createGain();bus.connect(oc.destination);
    const conv=oc.createConvolver(),n=SR*4,ir=oc.createBuffer(2,n,SR);
    for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6)}
    conv.buffer=ir;const send=oc.createGain();send.gain.value=.6;const rg=oc.createGain();rg.gain.value=.9;
    bus.connect(send);send.connect(conv);conv.connect(rg);rg.connect(oc.destination);
    // drone, coração e chiado param exatamente em L; sinos e reverb seguem na cauda, que depois é dobrada sobre o início
    const osc=(f,type,v)=>{const o=oc.createOscillator(),g=oc.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(bus);o.start(0);o.stop(L);return g};
    const tone=(t,f,type,peak,att,rel,pan)=>{const o=oc.createOscillator(),g=oc.createGain(),p=oc.createStereoPanner();o.type=type;o.frequency.value=f;p.pan.value=pan||0;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+rel);o.connect(g);g.connect(p);p.connect(bus);o.start(t);o.stop(t+att+rel+.1)};
    osc(q(41.2),'sine',.35);
    const dg=osc(q(82.4),'triangle',.06),lf=oc.createOscillator(),lg=oc.createGain();lf.frequency.value=4/L;lg.gain.value=.05;lf.connect(lg);lg.connect(dg.gain);lf.start(0);lf.stop(L);
    for(let t=0;t<L;t+=2){[0,.34].forEach((dt,i)=>{const o=oc.createOscillator(),g=oc.createGain(),s=t+dt;
      o.frequency.setValueAtTime(i?62:78,s);o.frequency.exponentialRampToValueAtTime(28,s+.35);
      g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(i?.5:.8,s+.015);g.gain.exponentialRampToValueAtTime(.001,s+.5);
      o.connect(g);g.connect(bus);o.start(s);o.stop(s+.6)})}
    const sc=[220,261.6,311.1,329.6,392,466.2];
    for(let t=3;t<L-5;t+=R(4.5,6.5)){const f=pick(sc)*pick([1,1,2]),pan=R(-.5,.5);[1,2.76,5.4,8.93].forEach((r,i)=>tone(t,f*r,'sine',.06/(i+1),.01,4.5/(i+1),pan))}
    const nb=oc.createBuffer(1,SR*3,SR),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const s=oc.createBufferSource();s.buffer=nb;s.loop=true;const hp=oc.createBiquadFilter();hp.type='highpass';hp.frequency.value=6000;
    const ng=oc.createGain();ng.gain.value=.012;s.connect(hp);hp.connect(ng);ng.connect(bus);s.start(0);s.stop(L);
    const r=await oc.startRendering(),out=new AudioBuffer({length:SR*L,numberOfChannels:2,sampleRate:SR});let peak=0;
    for(let c=0;c<2;c++){const a=r.getChannelData(c),o=out.getChannelData(c);
      for(let i=0;i<SR*L;i++)o[i]=a[i]+(i<SR*TAIL?a[SR*L+i]:0);
      for(let i=0;i<o.length;i++)peak=Math.max(peak,Math.abs(o[i]))}
    const k=.9/peak;for(let c=0;c<2;c++){const o=out.getChannelData(c);for(let i=0;i<o.length;i++)o[i]*=k}
    return out}
  const vol=()=>OPT.mus*.55;
  window.menuMusic=function(on){
    const A=(typeof AC!=='undefined'&&AC)||null;if(!A||A.state!=='running')return;
    if(on&&!buf&&!rendering&&OPT.mus>.01){rendering=true;render().then(b=>{buf=b;rendering=false}).catch(()=>{rendering=false})}
    const want=on&&buf&&OPT.mus>.01;
    if(want&&!playing){
      if(!gn){gn=A.createGain();gn.gain.value=0;gn.connect(mg(A))}
      const b=A.createBuffer(2,buf.length,buf.sampleRate);b.copyToChannel(buf.getChannelData(0),0);b.copyToChannel(buf.getChannelData(1),1);
      src=A.createBufferSource();src.buffer=b;src.loop=true;src.connect(gn);src.start();playing=true}
    if(gn)gn.gain.setTargetAtTime(want?vol():0,A.currentTime,want?1.2:.25);
    if(!want&&playing&&gn.gain.value<.004){try{src.stop()}catch(e){}src=null;playing=false}};
  window.menuMusicVol=()=>{try{if(gn&&playing)gn.gain.setTargetAtTime(vol(),AC.currentTime,.05)}catch(e){}};
  // controle no painel de opções
  const mu=document.getElementById('optmus'),muv=document.getElementById('optmusv');
  if(mu){const ui=()=>{mu.value=Math.round(OPT.mus*100);muv.textContent=OPT.mus>.01?Math.round(OPT.mus*100)+'%':'OFF'};ui();
    mu.addEventListener('input',()=>{OPT.mus=mu.value/100;ui();optApply();menuMusicVol()});document.getElementById('optbtn').addEventListener('click',ui)}
})();
