// [HORNCAM] js/ui/start-flow.js
// ---------- Fluxo da tela inicial: overlay #ov, boot da câmera, ajuda e captura do mouse ----------
// A tela inicial (sala de monitores, menu-scene.js) é separada do jogo (scene/camera). Estados em GS (core/game-state.js):
// menu -> intro (zoom na TV + chiado, ui/intro-transition.js) -> play (câmera do jogador).
const ov=document.getElementById('ov');
let aliveT=0,hudReady=false,unlockForResp=false,bootTm=0;
const hudEl=document.getElementById('hud'),bootEl=document.getElementById('boot');
// câmera desligada -> liga (abertura tipo CRT + sinal voltando), depois o HUD aparece
function startBoot(){
  aliveT=0;hudReady=false;hudEl.classList.remove('on');
  bootEl.classList.remove('go');void bootEl.offsetWidth;bootEl.classList.add('go');
  try{DA.back=true;DA.sig=1;DA.vis=1;}catch(e){}
  // som de iniciar removido
  clearTimeout(bootTm);bootTm=setTimeout(()=>{hudReady=true;bootEl.classList.remove('go');},1150);
}
ov.addEventListener('click',e=>{
  if(e.target.closest('#lobby,#helpbtn,#optbtn'))return;
  if(GS.mode!=='menu')return;
  // o pedido de captura do mouse precisa nascer do toque/clique do usuário; a transição roda depois
  if(!isTouch&&canvas.requestPointerLock)canvas.requestPointerLock();
  introBegin();
});
{const hp=document.getElementById('help'),hs=v=>hp.classList.toggle('show',v);
  document.getElementById('helpbtn').addEventListener('click',()=>hs(true));
  document.getElementById('helpclose').addEventListener('click',()=>hs(false));
  hp.addEventListener('click',e=>{if(e.target===hp)hs(false);});
  addEventListener('keydown',e=>{if(e.code==='Escape')hs(false);});}
document.addEventListener('pointerlockchange',()=>{
  if(document.pointerLockElement===canvas)unlockForResp=false;
  // Esc (o navegador solta o mouse) durante a partida: abre o painel de opções, sem voltar à tela inicial; FECHAR recaptura o mouse
  if(!isTouch&&document.pointerLockElement!==canvas&&!unlockForResp&&GS.mode==='play'&&active&&!(typeof PH!=='undefined'&&PH.dead)&&window.optOpen){window.optOpen(true);return}
  if(!isTouch&&document.pointerLockElement!==canvas&&!unlockForResp&&GS.mode!=='outro'){introCancel();GS.mode='menu';ov.style.display='flex';active=false;}
});
document.addEventListener('pointerlockerror',()=>{if(unlockForResp&&!PH.dead){unlockForResp=false;introCancel();GS.mode='menu';ov.style.display='flex';active=false;}});
