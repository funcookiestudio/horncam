// [HORNCAM] js/audio/menu-music.js
// ---------- Trilha do jogo: 4 faixas sintetizadas (sem arquivos), loops de 60 s sem emenda, troca suave entre elas ----------
//  PULSAR MORTO   (tela inicial; também entra no rodízio da partida)
//  CORREDOR VAZIO (exploração)      ALGO NA CÂMERA (tensão)      CAÇADOR (ameaça)
// No menu toca só a Pulsar Morto. Na partida ela continua e, de tempos em tempos, faz crossfade para outra faixa (nunca repete a atual).
// Cada faixa é renderizada uma vez (OfflineAudioContext, 32 kHz) em segundo plano; só depois o áudio toca. Volume próprio no painel (MÚSICA).
Object.assign(OPT,{mus:.8});
try{const o=JSON.parse(localStorage.getItem('horncam_opt')||'{}');if(typeof o.mus==='number')OPT.mus=Math.max(0,Math.min(1,o.mus))}catch(e){}
(function(){
  const L=60,SR=32000,R=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],q=f=>Math.round(f*L)/L; // ciclos inteiros em 60 s = sem estalo no loop
  // ---------- motor de síntese: renderiza 2 loops e guarda o 2º (a cauda do reverb do 1º entra no início = emenda perfeita) ----------
  function eng(oc){
    const end=2*L,bus=oc.createGain();bus.connect(oc.destination);
    const conv=oc.createConvolver(),n=SR*4,ir=oc.createBuffer(2,n,SR);
    for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6)}
    conv.buffer=ir;const sd=oc.createGain();sd.gain.value=.6;const rg=oc.createGain();rg.gain.value=.9;
    bus.connect(sd);sd.connect(conv);conv.connect(rg);rg.connect(oc.destination);
    const nb=oc.createBuffer(1,SR*3,SR),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
    const E={oc,bus};
    E.lp=f=>{const l=oc.createBiquadFilter();l.type='lowpass';l.frequency.value=f;l.connect(bus);return l};
    E.osc=(f,type,v,dest)=>{const o=oc.createOscillator(),g=oc.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(dest||bus);o.start(0);o.stop(end);return g};
    E.lfo=(p,cycles,d)=>{const l=oc.createOscillator(),g=oc.createGain();l.frequency.value=cycles/L;g.gain.value=d;l.connect(g);g.connect(p);l.start(0);l.stop(end)};
    E.tone=(t,f,type,peak,att,rel,pan,dest)=>{const o=oc.createOscillator(),g=oc.createGain(),p=oc.createStereoPanner();o.type=type;o.frequency.value=f;p.pan.value=pan||0;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+rel);o.connect(g);g.connect(p);p.connect(dest||bus);o.start(t);o.stop(t+att+rel+.1)};
    E.thud=(t,f,v,dest)=>{const o=oc.createOscillator(),g=oc.createGain();o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.4,t+.3);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+.5);o.connect(g);g.connect(dest||bus);o.start(t);o.stop(t+.6)};
    E.nz=(t,att,rel,v,type,f,qq,pan)=>{const s=oc.createBufferSource();s.buffer=nb;const fl=oc.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=qq;
      const g=oc.createGain(),p=oc.createStereoPanner();p.pan.value=pan||0;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+rel);
      s.connect(fl);fl.connect(g);g.connect(p);p.connect(bus);s.start(t,1);s.stop(t+att+rel+.05)};
    E.hiss=(type,f,qq,v)=>{const s=oc.createBufferSource();s.buffer=nb;s.loop=true;const fl=oc.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=qq;const g=oc.createGain();g.gain.value=v;s.connect(fl);fl.connect(g);g.connect(bus);s.start(0);s.stop(end)};
    E.hum=v=>{const l=E.lp(700);E.osc(60,'sawtooth',v,l);E.osc(120,'sine',v*.7);E.osc(180,'sine',v*.3)};
    E.both=fn=>[0,L].forEach(fn);
    return E}
  const bell=(E,t,f,v,pan)=>[1,2.76,5.4,8.93].forEach((r,i)=>E.tone(t,f*r,'sine',v/(i+1),.01,4.5/(i+1),pan||0));
  // ---------- as faixas ----------
  const T={
    pulsar:{lvl:1,build(E){ // coração que não deveria bater + sinos metálicos no escuro
      const oc=E.oc;E.osc(q(41.2),'sine',.35);const dg=E.osc(q(82.4),'triangle',.06);E.lfo(dg.gain,4,.05);E.hiss('highpass',6000,.5,.012);
      E.both(o=>{for(let t=0;t<L;t+=2)[0,.34].forEach((dt,i)=>{const s=t+o+dt,x=oc.createOscillator(),g=oc.createGain();
        x.frequency.setValueAtTime(i?62:78,s);x.frequency.exponentialRampToValueAtTime(28,s+.35);
        g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(i?.5:.8,s+.015);g.gain.exponentialRampToValueAtTime(.001,s+.5);x.connect(g);g.connect(E.bus);x.start(s);x.stop(s+.6)})});
      const sc=[220,261.6,311.1,329.6,392,466.2],bl=[];for(let t=3;t<L-5;t+=R(4.5,6.5))bl.push([t,pick(sc)*pick([1,1,2]),R(-.5,.5)]);
      E.both(o=>bl.forEach(b=>bell(E,b[0]+o,b[1],.06,b[2])))}},
    corr:{lvl:.7,build(E){ // CORREDOR VAZIO: grave constante, som de sala e rangidos distantes
      E.hum(.05);E.osc(q(36.7),'sine',.4);E.osc(55,'sine',.18);
      const lp=E.lp(220);E.osc(q(73.4),'sawtooth',.07,lp);E.osc(q(73.9),'sawtooth',.07,lp);E.lfo(lp.frequency,2,120);
      E.hiss('lowpass',300,.5,.07);
      const th=[[7,55,.4],[19,48,.3],[31,60,.35],[44,50,.3],[53,58,.4]],cr=[[12,900,-.5],[26,1400,.4],[38,700,-.3],[49,1100,.5]];
      E.both(o=>{th.forEach(a=>E.thud(a[0]+o,a[1],a[2]));cr.forEach(a=>E.nz(a[0]+o,1,2,.06,'bandpass',a[1],12,a[2]))})}},
    algo:{lvl:.8,build(E){ // ALGO NA CÂMERA: cordas dissonantes, batimento lento e sinos em trítono
      E.hum(.03);E.osc(q(41.2),'sine',.35);
      const lp=E.lp(420);[110,116.5,155.6].forEach(f=>E.osc(q(f),'sawtooth',.045,lp));E.lfo(lp.frequency,3,160);
      const sh=E.osc(q(2093),'sine',.008);E.lfo(sh.gain,7,.007);
      const bl=[[5,220,311.1],[17,233.1,329.6],[29,196,277.2],[41,220,311.1],[50,207.7,293.7]],ris=[14,34,52];
      E.both(o=>{for(let t=0;t<L;t+=1.5)[0,.3].forEach((d,i)=>E.thud(t+o+d,i?58:72,i?.3:.5));
        bl.forEach(b=>{bell(E,b[0]+o,b[1],.05,-.3);bell(E,b[0]+o,b[2],.05,.3)});
        ris.forEach(t=>E.nz(t+o,6,.2,.07,'highpass',3000,.7,0))})}},
    caca:{lvl:.9,build(E){ // CAÇADOR: 100 BPM pesado, estrondos graves, raspar de metal e metais dissonantes
      const bl=E.lp(450);E.osc(q(32.7),'sine',.4);E.hum(.03);E.hiss('lowpass',200,.5,.14);
      E.both(o=>{
        for(let t=0;t<L;t+=2.4){E.thud(t+o,50,.9);E.thud(t+o+1.2,48,.6);E.thud(t+o+1.8,60,.3)}
        [5,21,37,53].forEach(t=>[92.5,98,130.8].forEach(f=>E.tone(t+o,f,'sawtooth',.07,4,5,0,bl)));
        [7,19,33,47].forEach(t=>E.nz(t+o,1.2,1,.06,'bandpass',1200,15,0));
        [14,44].forEach(t=>bell(E,t+o,185,.05,0))})}}};
  const ORDER=['pulsar','corr','algo','caca'],buf={},st={};let rendering=false,cur=null,nextAt=0,pumpAt=0;
  async function render(id){
    const oc=new OfflineAudioContext(2,SR*2*L,SR),E=eng(oc);T[id].build(E);
    const r=await oc.startRendering(),out=new AudioBuffer({length:SR*L,numberOfChannels:2,sampleRate:SR});let peak=0;
    for(let c=0;c<2;c++){const a=r.getChannelData(c),o=out.getChannelData(c);for(let k=0;k<SR*L;k++){o[k]=a[SR*L+k];peak=Math.max(peak,Math.abs(o[k]))}}
    const k=.9*T[id].lvl/peak;for(let c=0;c<2;c++){const o=out.getChannelData(c);for(let j=0;j<o.length;j++)o[j]*=k}
    return out}
  // intervalo entre faixas: a síntese disputa CPU com o áudio e causava estalos no celular
  function pump(){ // renderiza uma faixa por vez, em segundo plano: primeiro a do menu, depois as da partida
    if(rendering||performance.now()<pumpAt)return;const id=ORDER.find(i=>!buf[i]);if(!id)return;
    rendering=true;render(id).then(b=>{buf[id]=b;rendering=false;pumpAt=performance.now()+(buf.pulsar&&id!=='pulsar'?30:8)*1e3}).catch(()=>{rendering=false;buf[id]=null;ORDER.splice(ORDER.indexOf(id),1)})}
  function start(A,id,rand){
    const g=A.createGain();g.gain.value=0;g.connect(mg(A));const s=A.createBufferSource();s.buffer=buf[id];s.loop=true;s.connect(g);
    s.start(0,rand?R(0,L):0);st[id]={s,g}}
  window.menuMusic=function(){};window.menuMusicVol=function(){}; // compat: quem manda agora é o laço abaixo
  setInterval(()=>{
    const A=(typeof AC!=='undefined'&&AC)||null;if(!A||A.state!=='running'||typeof mg!=='function')return;
    const on=OPT.mus>.01,game=typeof active!=='undefined'&&active,now=performance.now();
    if(on)pump();
    let want=cur;
    if(!game){want='pulsar';nextAt=0}
    else{if(!cur)want='pulsar';if(!nextAt)nextAt=now+R(50,80)*1e3;
      if(now>nextAt){const ready=ORDER.filter(i=>buf[i]&&i!==cur);if(ready.length){want=pick(ready);nextAt=now+R(70,110)*1e3}}}
    if(on&&want&&want!==cur&&buf[want]){if(!st[want])start(A,want,game&&cur!==null);cur=want}
    const vol=OPT.mus*(game?.8:1.1);
    for(const id in st){const x=st[id],t=on&&id===cur?vol:0;x.g.gain.setTargetAtTime(t,A.currentTime,2.2);
      if(t===0&&x.g.gain.value<.003){try{x.s.stop()}catch(e){}delete st[id];if(cur===id)cur=null}}
  },250);
  // controle no painel de opções
  const mu=document.getElementById('optmus'),muv=document.getElementById('optmusv');
  if(mu){const ui=()=>{mu.value=Math.round(OPT.mus*100);muv.textContent=OPT.mus>.01?Math.round(OPT.mus*100)+'%':'OFF'};ui();
    mu.addEventListener('input',()=>{OPT.mus=mu.value/100;ui();optApply()});document.getElementById('optbtn').addEventListener('click',ui)}
})();
