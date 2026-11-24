// [HORNCAM] js/ui/visual-options.js
// ---------- Opções visuais (atmosfera de terror): escuridão, reflexos no chão, sujeira. Salvas no navegador ----------
// REFLEXOS e SUJEIRA são os efeitos mais pesados de pixel: o jogador pode desligar ou reduzir se o aparelho sofrer.
const VIS={exp:1};
Object.assign(OPT,{dark:.6,refl:true,reflI:.7,dirt:true,lensDirt:1});
try{const o=JSON.parse(localStorage.getItem('horncam_opt')||'{}'),cl=v=>Math.max(0,Math.min(1,v));
  if(typeof o.dark==='number')OPT.dark=cl(o.dark);if(typeof o.reflI==='number')OPT.reflI=cl(o.reflI);
  if(typeof o.lensDirt==='number')OPT.lensDirt=cl(o.lensDirt);if(typeof o.refl==='boolean')OPT.refl=o.refl;if(typeof o.dirt==='boolean')OPT.dirt=o.dirt}catch(e){}
function visApply(save){
  VIS.exp=1-.4*OPT.dark;LV.gain=1-.25*OPT.dark;
  scene.fog.density=.018*(1+.9*OPT.dark);post.uniforms.dk.value=OPT.dark;
  if(save)optApply()}
// por quadro: efeitos de ambiente só valem dentro da partida (a sala de monitores do menu não leva sujeira nem reflexo)
function visFrame(){LVU.dirt.value=(active&&OPT.dirt)?1:0;LVU.refl.value=(active&&OPT.refl)?.15+.85*OPT.reflI:0}
{
  const g=id=>document.getElementById(id),dk=g('optdark'),dkv=g('optdarkv'),rb=g('optrefl'),ri=g('optreflI'),riv=g('optreflv'),db=g('optdirt'),ld=g('optlens'),ldv=g('optlensv');
  const ui=()=>{dk.value=Math.round(OPT.dark*100);dkv.textContent=Math.round(OPT.dark*100)+'%';
    rb.textContent=OPT.refl?'LIGADO':'DESLIGADO';rb.classList.toggle('on',!OPT.refl);ri.value=Math.round(OPT.reflI*100);ri.disabled=!OPT.refl;riv.textContent=OPT.refl?Math.round(OPT.reflI*100)+'%':'—';
    ld.value=Math.round(OPT.lensDirt*100);ldv.textContent=OPT.lensDirt>.01?Math.round(OPT.lensDirt*100)+'%':'OFF';
    db.textContent=OPT.dirt?'LIGADO':'DESLIGADO';db.classList.toggle('on',!OPT.dirt)};
  ui();visApply(false);
  dk.addEventListener('input',()=>{OPT.dark=dk.value/100;ui();visApply(true)});
  rb.addEventListener('click',()=>{OPT.refl=!OPT.refl;ui();visApply(true)});
  ri.addEventListener('input',()=>{OPT.reflI=ri.value/100;ui();visApply(true)});
  ld.addEventListener('input',()=>{OPT.lensDirt=ld.value/100;ui();visApply(true)});
  db.addEventListener('click',()=>{OPT.dirt=!OPT.dirt;ui();visApply(true)});
  g('optbtn').addEventListener('click',ui)}
