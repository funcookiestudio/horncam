// [HORNCAM] js/player/weapon-body.js
// ---------- Arma e corpo: parede, fôlego, inclinar, modo de tiro, mira ----------
Object.assign(W,{bq:1,tired:false,wp:0,tl:false,auto:true,hs:false,hv:0,lean:0});
for(let i=0;i<11;i++)bx(.03,.004,.008,0,.0725,-.16+i*.024,blk);
const sel=bx(.006,.012,.02,-.0245,-.014,.045,blk);
const holo=new THREE.Group();holo.visible=false;gun.add(holo);
bx(.034,.012,.075,0,.077,-.06,blk,holo);bx(.006,.04,.06,-.0175,.103,-.06,blk,holo);bx(.006,.04,.06,.0175,.103,-.06,blk,holo);bx(.04,.006,.07,0,.126,-.06,blk,holo);
const gl=new THREE.Mesh(new THREE.PlaneGeometry(.029,.034),new THREE.MeshBasicMaterial({color:0x88aacc,transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false}));gl.position.set(0,.103,-.03);holo.add(gl);
const rmat=new THREE.MeshBasicMaterial({color:0xff2020,side:THREE.DoubleSide});
const ret=new THREE.Mesh(new THREE.RingGeometry(.0042,.0054,24),rmat);ret.position.set(0,.106,-.029);holo.add(ret);
const rdt=new THREE.Mesh(new THREE.CircleGeometry(.0006,8),rmat);rdt.position.set(0,.106,-.0289);holo.add(rdt);
function toggleMode(){W.auto=!W.auto;{const l=document.getElementById('modeLbl');if(l)l.textContent=W.auto?'AUTO':'SEMI';}sel.rotation.z=W.auto?.6:0;sfx('rel');updAmmo();}
function toggleSight(){W.hs=!W.hs;holo.visible=W.hs;iron.forEach(m=>{m.visible=!W.hs;});sfx('rel');updAmmo();}
function toggleLauncher(){
  if(W.rl||grenadeLoading||WA.inspectT>=0||WA.switchT>=0)return;
  WA.switchFrom=launcherEquipped;WA.switchTo=!launcherEquipped;WA.switchT=0;
  launcherEquipped=!launcherEquipped;launcher.visible=true;
  if(launcherEquipped)launcher.scale.setScalar(.001);
  if(!launcherEquipped&&grenadeMode){grenadeMode=false;grenadeLoading=false;grenadeReady=false;grenadeProp.visible=false;grenadeLoadT=0;launcherHinge.rotation.x=0;W.trig=false;W.tl=false;}
  lh.position.copy(launcherEquipped?new THREE.Vector3(0,-.075,-.355):new THREE.Vector3(0,-.018,-.285));
  lh.rotation.set(0,0,0);sfx('rel');updAmmo();
  feed(launcherEquipped?'LANÇADOR EQUIPADO':'LANÇADOR DESEQUIPADO');
}
addEventListener('keydown',e=>{
  if(e.repeat)return;
  if(e.code==='Digit1'||e.code==='Numpad1')toggleLight();
  if(e.code==='Digit2'||e.code==='Numpad2'){if(!W.hs)toggleSight();else toggleSight();}
  if(e.code==='Digit3'||e.code==='Numpad3')toggleLauncher();
  if(e.code==='KeyI'&&!e.repeat&&!W.rl&&!grenadeLoading&&!PH.dead&&WA.switchT<0){WA.inspectT=0;W.trig=false;W.aim=false;}
  if(e.code==='KeyB')toggleMode();if(e.code==='KeyV')toggleSight();
});
document.querySelectorAll('.btn').forEach(b=>{const a=b.dataset.a;
  if(a==='lq'||a==='le'){const c=a==='lq'?'KeyQ':'KeyE';b.addEventListener('pointerdown',e=>{e.preventDefault();keys[c]=true;b.classList.add('on');});['pointerup','pointercancel','pointerleave'].forEach(v=>b.addEventListener(v,()=>{keys[c]=false;b.classList.remove('on');}));}
  if(a==='mode')b.addEventListener('pointerdown',e=>{e.preventDefault();toggleMode();});
  if(a==='sight')b.addEventListener('pointerdown',e=>{e.preventDefault();toggleSight();});
});
function wallCheck(dt){camera.getWorldDirection(vf);rc.set(camera.position,vf);rc.far=1.1;
  const h=spatialRaycast(rc,hitMeshes,false)[0];rc.far=60;
  const t=h?Math.max(0,Math.min(1,(.95-h.distance)/.5)):0;W.wp+=(t-W.wp)*(1-Math.exp(-dt*12));}
function fxPost(dt,a){
  const k=r=>1-Math.exp(-dt*r);
  wallCheck(dt); worldTick(dt);
  const hb=a>.8&&(keys.ShiftLeft||keys.ShiftRight||input.sprint)&&W.bq>0&&!W.tired;
  if(hb){W.bq=Math.max(0,W.bq-dt/4.5);if(W.bq===0)W.tired=true;}else{W.bq=Math.min(1,W.bq+dt/(W.tired?5:3));if(W.bq>.35)W.tired=false;}
  const am=(hb?.12:1)*(1+W.ex*1.6+(W.tired?1.2:0))*a;
  W.hv+=((W.hs?1:0)-W.hv)*k(10);
  gun.position.x+=Math.sin(time*1.3)*.0016*am;
  gun.position.y+=(Math.sin(time*.9)*.0022+Math.sin(time*2.3)*.0008)*am-.018*W.hv*a;
  gun.position.z+=.22*W.wp;gun.position.y-=.04*W.wp;gun.rotation.x+=.55*W.wp;
  const want=(keys.KeyE?1:0)-(keys.KeyQ?1:0);let lim=1;
  if(want){vr.set(Math.cos(P.camYaw),0,-Math.sin(P.camYaw)).multiplyScalar(want);rc.set(new THREE.Vector3(P.pos.x,camera.position.y,P.pos.z),vr);rc.far=.7;
    const hh=spatialRaycast(rc,hitMeshes,false)[0];rc.far=60;if(hh)lim=Math.max(0,Math.min(1,(hh.distance-(want>0?.24:.1))/.3));}
  W.lean+=(want*lim-W.lean)*k(8);
  camera.position.x+=Math.cos(P.camYaw)*.3*W.lean;camera.position.z-=Math.sin(P.camYaw)*.3*W.lean;
  camera.rotation.z-=.2*W.lean;
}
