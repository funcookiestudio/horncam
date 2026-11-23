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
  document.getElementById('optbtn').addEventListener('click',()=>{ui();op.classList.add('show');});
  document.getElementById('optclose').addEventListener('click',()=>op.classList.remove('show'));
  op.addEventListener('click',e=>{if(e.target===op)op.classList.remove('show');});
  ov_.addEventListener('input',()=>{OPT.vol=ov_.value/100;if(OPT.vol>0)OPT.mute=false;ui();optApply();});
  const step=d=>{OPT.vol=Math.max(0,Math.min(1,Math.round((OPT.vol*100+d)/10)*10/100));if(OPT.vol>0)OPT.mute=false;ui();optApply();try{tn(660,660,.08,.12,'square')}catch(e){}}; // botões −/+ (passos de 10%)
  document.getElementById('optdn').addEventListener('click',()=>step(-10));
  document.getElementById('optup').addEventListener('click',()=>step(10));
  mt.addEventListener('click',()=>{OPT.mute=!OPT.mute;ui();optApply();});
  addEventListener('keydown',e=>{if(e.code==='Escape')op.classList.remove('show');});}
