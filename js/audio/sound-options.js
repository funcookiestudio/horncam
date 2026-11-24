// [HORNCAM] js/audio/sound-options.js
// ---------- Opções de som: volume mestre + mudo (salvo no navegador) ----------
const OPT={vol:1,mute:false};
try{const o=JSON.parse(localStorage.getItem('horncam_opt')||'{}');if(typeof o.vol==='number')OPT.vol=Math.max(0,Math.min(1,o.vol));OPT.mute=!!o.mute;}catch(e){}
function optGain(){return OPT.mute?0:OPT.vol*OPT.vol;}
function mg(A){if(!A._mg){A._mg=A.createGain();A._mg.gain.value=optGain();A._mg.connect(A.destination);}return A._mg;}
function optApply(){try{if(AC&&AC._mg)AC._mg.gain.setTargetAtTime(optGain(),AC.currentTime,.03);}catch(e){}
  try{localStorage.setItem('horncam_opt',JSON.stringify(OPT));}catch(e){}}
// ---------- Painel OPÇÕES (volume −/+, slider, mudo) ----------
{
  const op=document.getElementById('opt'),ov_=document.getElementById('optvol'),vl=document.getElementById('optv'),mt=document.getElementById('optmute');
  const ui=()=>{ov_.value=Math.round(OPT.vol*100);vl.textContent=OPT.mute?'—':Math.round(OPT.vol*100)+'%';mt.textContent=OPT.mute?'LIGADO':'DESLIGADO';mt.classList.toggle('on',OPT.mute);};
  ui();
  // abrir/fechar o painel: no PC o Esc (que solta o mouse) abre; no celular a engrenagem do topo abre. Em jogo, fechar recaptura o mouse.
  let openT=0;window.optPaused=false;
  window.optOpen=pause=>{ui();document.getElementById('opthome').hidden=GS.mode==='menu';op.classList.add('show');openT=performance.now();window.optPaused=!!pause;for(const k in keys)keys[k]=false};
  window.optClose=()=>{if(!op.classList.contains('show'))return;op.classList.remove('show');
    if(window.optPaused){window.optPaused=false;try{if(!isTouch&&canvas.requestPointerLock)canvas.requestPointerLock()}catch(e){}}};
  document.getElementById('optbtn').addEventListener('click',()=>window.optOpen(false));
  document.getElementById('optclose').addEventListener('click',()=>window.optClose());
  // INÍCIO: volta à tela inicial (sala de monitores) a partir da partida
  document.getElementById('opthome').addEventListener('click',()=>{window.optPaused=false;op.classList.remove('show');
    try{if(document.pointerLockElement)document.exitPointerLock()}catch(e){}
    try{introCancel()}catch(e){}GS.mode='menu';ov.style.display='flex';active=false;for(const k in keys)keys[k]=false;
    });
  op.addEventListener('click',e=>{if(e.target===op)window.optClose();});
  // com o painel aberto as teclas não chegam ao jogo (WASD, tiro etc.); Esc continua fechando
  addEventListener('keydown',e=>{if(op.classList.contains('show')&&e.code!=='Escape'&&!/^(INPUT|BUTTON)$/.test(e.target.tagName))e.stopImmediatePropagation()},true);
  ov_.addEventListener('input',()=>{OPT.vol=ov_.value/100;if(OPT.vol>0)OPT.mute=false;ui();optApply();});
  const step=d=>{OPT.vol=Math.max(0,Math.min(1,Math.round((OPT.vol*100+d)/10)*10/100));if(OPT.vol>0)OPT.mute=false;ui();optApply();try{tn(660,660,.08,.12,'square')}catch(e){}}; // botões −/+ (passos de 10%)
  document.getElementById('optdn').addEventListener('click',()=>step(-10));
  document.getElementById('optup').addEventListener('click',()=>step(10));
  mt.addEventListener('click',()=>{OPT.mute=!OPT.mute;ui();optApply();});
  addEventListener('keydown',e=>{if(e.code==='Escape'&&performance.now()-openT>400)window.optClose();});}
