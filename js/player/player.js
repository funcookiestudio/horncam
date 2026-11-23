// [HORNCAM] js/player/player.js
// ---------- Jogador ----------
const P={pos:new THREE.Vector3(0,0,87),vel:new THREE.Vector3(),vy:0,y:0,yaw:0,pitch:0,camYaw:0,camPitch:0,
  eye:1.7,bobT:0,bob:0,landKick:0,onGround:true,crouch:false,r:.38};
const input={f:0,s:0,sprint:false,jump:false};
const keys={};
let active=false;

addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(e.code==='KeyF') toggleLight();
  if(e.code==='KeyC') P.crouch=!P.crouch;
  if(e.code==='ControlLeft') P.crouch=true;
  if(e.code==='Space') e.preventDefault();
});
addEventListener('keyup',e=>{keys[e.code]=false; if(e.code==='ControlLeft')P.crouch=false;});
addEventListener('mousemove',e=>{
  if(document.pointerLockElement!==canvas||!active) return;
  P.yaw-=e.movementX*.0022; P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch-e.movementY*.0022));
});
function toggleLight(){flashOn=!flashOn;flash.intensity=flashOn?2.6:0;if(typeof flashlightAttachment!=='undefined')flashlightAttachment.visible=flashOn;document.getElementById('fl').textContent=flashOn?'ON':'OFF';if(typeof updAmmo==='function')updAmmo();}

