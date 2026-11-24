// [HORNCAM] js/audio/voice-capture.js
// ---------- Chat de voz (VoIP) por proximidade + captura de trechos de fala ----------
// - Botão VOZ nas opções: pede o microfone, liga a chamada de voz com os outros jogadores da sala (WebRTC via PeerJS, direto entre aparelhos).
// - Volume por distância e balanço estéreo conforme a posição do avatar de quem fala. Desligado por padrão em toda sessão.
// - Em cada aparelho, a fala de cada jogador (inclusive a sua) é recortada em trechos (0,6–4 s, mono 16 kHz) e guardada SÓ NA MEMÓRIA
//   (máx. 30 por jogador). Nada é salvo em disco nem enviado a servidor; desligar apaga tudo. (Etapa seguinte: a entidade usa esses trechos.)
const VOICE={on:false,clips:[],bank:{},level:0,err:'',stream:null,src:null,node:null,SR:16000,MAX:30};
const VOIP={calls:{},ch:{},bound:null,tm:0};
(function(){
  const btn=document.getElementById('optmic'),pb=document.getElementById('optmicp'),hint=document.getElementById('optmich');
  if(!btn)return;
  const nrem=()=>Object.keys(VOIP.ch).length;
  const say=()=>{if(!hint)return;hint.textContent=VOICE.err?VOICE.err:VOICE.on?('MIC LIGADO · OUVINDO '+nrem()+' · TRECHOS: '+VOICE.clips.length+'/'+VOICE.MAX+' · '+'▮'.repeat(Math.min(10,Math.round(VOICE.level*60)))):'Chat de voz por proximidade com a sala. Só liga se você ativar; trechos ficam só na memória e sua voz nunca é salva.'};
  const ui=()=>{btn.textContent=VOICE.on?'LIGADO':'DESLIGADO';btn.classList.toggle('on',VOICE.on);say()};
  // detector de fala: recorta trechos e entrega a push(Float32Array). st guarda o estado de cada fonte de áudio
  function vadTap(A,srcNode,push,st){
    const p=A.createScriptProcessor(2048,1,1),z=A.createGain();z.gain.value=0;
    const ratio=A.sampleRate/VOICE.SR;let cur=null,quiet=0,len=0;st.floor=.01;st.level=0;
    p.onaudioprocess=e=>{
      const x=e.inputBuffer.getChannelData(0);let s=0;for(let i=0;i<x.length;i++)s+=x[i]*x[i];const rms=Math.sqrt(s/x.length),dt=x.length/A.sampleRate;
      st.level+=(rms-st.level)*.3;
      const speech=rms>Math.max(.02,st.floor*3.2);
      if(!speech)st.floor+=(rms-st.floor)*.02;
      if(speech||cur){
        if(!cur){cur=[];len=0;quiet=0}
        for(let i=0;i<x.length;i+=ratio){const a=Math.floor(i),b=Math.min(x.length,Math.floor(i+ratio));let m=0;for(let k=a;k<b;k++)m+=x[k];cur.push(m/Math.max(1,b-a))}
        len+=dt;quiet=speech?0:quiet+dt;
        if(quiet>.4||len>4){const n=cur.length-Math.floor(quiet*VOICE.SR);if(len-quiet>=.6&&n>0)push(Float32Array.from(cur.slice(0,n)));cur=null}
      }
    };
    srcNode.connect(p);p.connect(z);z.connect(A.destination);return p}
  const ring=(arr,a)=>{arr.push(a);if(arr.length>VOICE.MAX)arr.shift()};
  // ----- chamadas -----
  function attach(id,stream){
    detach(id);const A=ac();if(!A)return;
    const au=new Audio();au.srcObject=stream;au.muted=true;au.play().catch(()=>{}); // o Chrome só entrega o áudio da chamada se houver um elemento tocando
    const src=A.createMediaStreamSource(stream),g=A.createGain(),pn=A.createStereoPanner();g.gain.value=0;
    src.connect(g);g.connect(pn);pn.connect(typeof MB!=='undefined'&&MB?MB:A.destination);
    const st={},bank=VOICE.bank[id]||(VOICE.bank[id]=[]);const tap=vadTap(A,src,c=>ring(bank,c),st);
    VOIP.ch[id]={au,src,g,pn,tap};
  }
  function detach(id){const c=VOIP.ch[id];if(!c)return;
    try{c.tap.disconnect()}catch(e){}try{c.src.disconnect()}catch(e){}try{c.g.disconnect()}catch(e){}try{c.pn.disconnect()}catch(e){}try{c.au.srcObject=null}catch(e){}
    delete VOIP.ch[id];delete VOICE.bank[id]}
  function setup(id,call){
    const old=VOIP.calls[id];VOIP.calls[id]=call;if(old&&old!==call)try{old.close()}catch(e){}
    call.on('stream',s=>{if(VOIP.calls[id]===call)attach(id,s)});
    const gone=()=>{if(VOIP.calls[id]===call){delete VOIP.calls[id];detach(id)}};
    call.on('close',gone);call.on('error',gone);
  }
  function bind(){
    const p=typeof NET!=='undefined'&&NET.peer;if(!p||p===VOIP.bound)return;VOIP.bound=p;
    p.on('call',call=>{
      const ex=VOIP.calls[call.peer];
      // os dois lados ligaram ao mesmo tempo: vale a chamada iniciada pelo menor id (uma só, com áudio nos dois sentidos)
      if(ex&&ex.mine&&NET.id<call.peer){try{call.close()}catch(e){}return}
      try{call.answer(VOICE.on?VOICE.stream:undefined)}catch(e){}setup(call.peer,call)});
  }
  function sync(){
    bind();if(!NET.on||!NET.peer||!NET.peer.open)return;
    for(const id in VOIP.calls){if(!NET.players[id]){try{VOIP.calls[id].close()}catch(e){}delete VOIP.calls[id];detach(id)}}
    if(!VOICE.on)return;
    for(const id in NET.players){if(id===NET.id||VOIP.calls[id])continue;
      try{const c=NET.peer.call(id,VOICE.stream);c.mine=true;setup(id,c)}catch(e){}}
  }
  // volume por distância e balanço estéreo (posição do avatar de quem fala)
  const fv=new THREE.Vector3();
  function space(){
    requestAnimationFrame(space);if(!nrem()||typeof camera==='undefined')return;
    camera.getWorldDirection(fv);const cp=camera.position,A=ac();if(!A)return;
    for(const id in VOIP.ch){const c=VOIP.ch[id],r=NET.rem[id];let v=.55,pan=0;
      if(r&&r.has){const dx=r.cur.x-cp.x,dz=r.cur.z-cp.z,d=Math.hypot(dx,dz)||1e-3;v=Math.pow(Math.max(0,1-d/45),1.4)*1.6;pan=Math.max(-.9,Math.min(.9,((-fv.z)*dx+fv.x*dz)/d))}
      c.g.gain.setTargetAtTime(r&&r.dead?v*.4:v,A.currentTime,.08);c.pn.pan.setTargetAtTime(pan,A.currentTime,.08)}
  }
  space();
  // ----- microfone -----
  async function start(){
    VOICE.err='';
    try{
      const A=ac();if(!A)throw new Error('sem áudio');if(A.state==='suspended')await A.resume();
      VOICE.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      VOICE.src=A.createMediaStreamSource(VOICE.stream);
      const st={};VOICE.node=vadTap(A,VOICE.src,c=>ring(VOICE.clips,c),st);VOICE.st=st;VOICE.on=true;
      for(const id in VOIP.calls){try{VOIP.calls[id].close()}catch(e){}delete VOIP.calls[id];detach(id)} // refaz as chamadas já enviando o seu microfone
      clearInterval(VOIP.tm);VOIP.tm=setInterval(()=>{sync();if(VOICE.st)VOICE.level=VOICE.st.level},1500);sync();
    }catch(e){VOICE.err='Microfone indisponível: '+(e&&e.name==='NotAllowedError'?'permissão negada.':(e&&e.message)||'erro.');stop(true)}
    ui();
  }
  function stop(keepErr){
    clearInterval(VOIP.tm);
    for(const id in VOIP.calls){try{VOIP.calls[id].close()}catch(e){}delete VOIP.calls[id];detach(id)}
    try{VOICE.node&&VOICE.node.disconnect()}catch(e){}try{VOICE.src&&VOICE.src.disconnect()}catch(e){}
    try{VOICE.stream&&VOICE.stream.getTracks().forEach(t=>t.stop())}catch(e){}
    VOICE.node=VOICE.src=VOICE.stream=VOICE.st=null;VOICE.on=false;VOICE.clips.length=0;VOICE.bank={};VOICE.level=0;if(!keepErr)VOICE.err='';
    VOIP.tm=setInterval(sync,1500); // continua atendendo chamadas (só ouvir)
    ui()}
  VOIP.tm=setInterval(sync,1500);
  // ouvir um trecho já "tratado" (mais grave, com eco): é como a cópia vai soar
  VOICE.play=function(){
    const c=VOICE.clips[VOICE.clips.length-1],A=ac();if(!c||!A)return false;
    const b=A.createBuffer(1,c.length,VOICE.SR);b.copyToChannel(c,0);
    const s=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();s.buffer=b;s.playbackRate.value=.86;f.type='lowpass';f.frequency.value=2600;g.gain.value=1.2;
    s.connect(f);f.connect(g);g.connect(typeof MB!=='undefined'&&MB?MB:A.destination);if(typeof RV!=='undefined'&&RV){const r=A.createGain();r.gain.value=.6;g.connect(r);r.connect(RV)}
    s.start();return true};
  btn.addEventListener('click',()=>{VOICE.on?stop():start()});
  if(pb)pb.addEventListener('click',()=>{if(!VOICE.play()){VOICE.err='Ainda não há trecho gravado: fale algo com o microfone ligado.';ui();setTimeout(()=>{VOICE.err='';ui()},2500)}});
  document.getElementById('optbtn').addEventListener('click',ui);
  setInterval(()=>{if(document.getElementById('opt').classList.contains('show'))say()},250);
  addEventListener('pagehide',()=>{try{VOICE.stream&&VOICE.stream.getTracks().forEach(t=>t.stop())}catch(e){}});
  ui();
})();
