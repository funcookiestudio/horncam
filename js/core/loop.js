// [HORNCAM] js/core/loop.js
// ---------- Loop ----------
const clock=new THREE.Clock(); let fpsAcc=0,fpsN=0,time=0;
const tsEl=document.getElementById('ts'),fpsEl=document.getElementById('fps'),spdEl=document.getElementById('spd');
const spdiagEl=document.getElementById('spdiag');let spatialDiagOn=false,diagTimer=0;
addEventListener('keydown',e=>{if(e.code==='F3'){spatialDiagOn=!spatialDiagOn;spdiagEl.style.display=spatialDiagOn?'block':'none';e.preventDefault();}});
