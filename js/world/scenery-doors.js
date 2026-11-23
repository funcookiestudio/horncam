// [HORNCAM] js/world/scenery-doors.js
// ---------- Cenário: relevo, objetos e portas ----------
new Set(hitMeshes.map(m=>m.material)).forEach(mt=>{if(mt.map){mt.bumpMap=mt.map;mt.bumpScale=1.2;mt.needsUpdate=true;}});
function pbox(x,z,w,d,h,mat,y0=0,col=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y0+h/2,z);m.castShadow=m.receiveShadow=true;scene.add(m);hitMeshes.push(m);
  if(col)solids.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});return m;}
const rust=MT(0x6a3f2a,.75,.35),blue=MT(0x2b4256,.6,.45),doorMat=MT(0x474c50,.6,.3),pipeM=MT(0x3b3f43,.5,.6);
function proxy(g,w,h,d){const px=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),blk);px.visible=false;px.position.y=h/2;g.add(px);hitMeshes.push(px);}
function barrel(x,z,mat){const g=new THREE.Group(),m=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.9,14),mat);m.position.y=.45;g.add(m);
  for(const y of [.2,.7]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.04,14),blk);r.position.y=y;g.add(r);}
  g.position.set(x,0,z);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(g);hitMeshes.push(m);solids.push({minX:x-.3,maxX:x+.3,minZ:z-.3,maxZ:z+.3});}
function shelf(x,z,rot){const g=new THREE.Group(),w=1.5,d=.5,mt=MT(0x555a5e,.5,.5);
  for(const sx of [-1,1])for(const sz of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.05,1.9,.05),mt);p.position.set(sx*(w/2-.03),.95,sz*(d/2-.03));g.add(p);}
  for(const y of [.25,.9,1.55]){const b=new THREE.Mesh(new THREE.BoxGeometry(w,.04,d),mt);b.position.y=y;g.add(b);
    for(let i=0;i<3;i++){const s=.2+rnd()*.15,c=new THREE.Mesh(new THREE.BoxGeometry(s,s*.9,s),crateMat);c.position.set(-.5+i*.5+(rnd()-.5)*.1,y+.02+s*.45,(rnd()-.5)*.1);g.add(c);}}
  g.position.set(x,0,z);g.rotation.y=rot?Math.PI/2:0;g.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});scene.add(g);proxy(g,w,1.9,d);
  const hw=(rot?d:w)/2,hd=(rot?w:d)/2;solids.push({minX:x-hw,maxX:x+hw,minZ:z-hd,maxZ:z+hd});}
function table(x,z,rot){const g=new THREE.Group(),mt=MT(0x4b3a2a,.8,.1),t=new THREE.Mesh(new THREE.BoxGeometry(1.6,.05,.8),mt);t.position.y=.8;g.add(t);
  for(const sx of [-1,1])for(const sz of [-1,1]){const l=new THREE.Mesh(new THREE.BoxGeometry(.05,.8,.05),mt);l.position.set(sx*.75,.4,sz*.35);g.add(l);}
  const b=new THREE.Mesh(new THREE.BoxGeometry(.3,.18,.22),gry);b.position.set(-.4,.9,0);g.add(b);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.22,10),MT(0x233b2a,.3,.2));c.position.set(.3,.92,.1);g.add(c);
  g.position.set(x,0,z);g.rotation.y=rot?Math.PI/2:0;g.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});scene.add(g);proxy(g,1.6,1,.8);
  solids.push({minX:x-(rot?.4:.8),maxX:x+(rot?.4:.8),minZ:z-(rot?.8:.4),maxZ:z+(rot?.8:.4)});}
function roomLight(x,z,bad){const l=new THREE.PointLight(0xcfe0ff,.9,10,1.6);l.position.set(x,H-.6,z);scene.add(l);
  const p=new THREE.Mesh(new THREE.BoxGeometry(1.6,.1,.4),panelMat.clone());p.position.set(x,H-.3,z);scene.add(p);lamps.push({l,p,base:.9,ph:x*.37,bad});}
// portas
const doors=[];
function door(hx,hz,sw){const g=new THREE.Group();g.position.set(hx,0,hz);scene.add(g);
  const m=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.1,.07),doorMat);m.position.set(.6,1.05,0);m.castShadow=m.receiveShadow=true;g.add(m);hitMeshes.push(m);
  const hd=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.14),gry);hd.position.set(1.05,1,0);g.add(hd);
  const sol={minX:hx,maxX:hx+1.2,minZ:hz-.07,maxZ:hz+.07};solids.push(sol);doors.push({g,sw,hx,hz,cx:hx+.6,cz:hz,open:false,a:0,sol,sOn:true});}
// portões de doca (2,80 x 3,80 m, encaixados no vão) e portas de emergência (1,20 x 2,10 m): sempre fechados no início, abrem com [G]
(function(){
  const gc=document.createElement('canvas');gc.width=32;gc.height=320;const g=gc.getContext('2d');
  g.fillStyle='#b4bbc1';g.fillRect(0,0,32,320);
  for(let i=0;i<10;i++){g.fillStyle='#8f979d';g.fillRect(0,i*32+29,32,3);g.fillStyle='#c8cfd4';g.fillRect(0,i*32,32,2);}
  g.fillStyle='#3a3f44';g.fillRect(12,300,8,6);
  const gateMat=new THREE.MeshStandardMaterial({map:texQ(new THREE.CanvasTexture(gc)),roughness:.55,metalness:.45});
  const dc=document.createElement('canvas');dc.width=64;dc.height=128;const h=dc.getContext('2d');
  h.fillStyle='#a8312a';h.fillRect(0,0,64,128);h.strokeStyle='#7a1f1a';h.lineWidth=3;h.strokeRect(4,4,56,120);
  h.fillStyle='#e8e8e8';h.fillRect(6,64,52,6);h.fillStyle='#2e7d32';h.fillRect(10,12,44,18);
  h.fillStyle='#ffffff';h.font='bold 11px sans-serif';h.textAlign='center';h.textBaseline='middle';h.fillText('SAÍDA',32,21);
  const emMat=new THREE.MeshStandardMaterial({map:texQ(new THREE.CanvasTexture(dc)),roughness:.5,metalness:.35});
  const GG=new THREE.BoxGeometry(2.8,3.8,.05),DG=new THREE.BoxGeometry(.06,2.08,1.18);
  PORTALS.forEach(p=>{
    if(p.k==='g'){
      const g=new THREE.Group();g.position.set(p.cx,3.9,p.cz);scene.add(g);
      const m=new THREE.Mesh(GG,gateMat);m.position.y=-1.9;m.castShadow=m.receiveShadow=true;g.add(m);hitMeshes.push(m);
      const sol={minX:p.cx-1.41,maxX:p.cx+1.41,minZ:p.cz-.12,maxZ:p.cz+.12};solids.push(sol);
      doors.push({g,gate:true,sw:0,hx:p.cx,hz:p.cz,cx:p.cx,cz:p.cz,open:false,a:0,sol,sOn:true});
    }else{
      const g=new THREE.Group();g.position.set(p.x,0,p.hz);scene.add(g);
      const m=new THREE.Mesh(DG,emMat);m.position.set(0,1.15,p.s*.6);m.castShadow=m.receiveShadow=true;g.add(m);hitMeshes.push(m);
      const sol={minX:p.x-.1,maxX:p.x+.1,minZ:p.z0,maxZ:p.z1};solids.push(sol);
      doors.push({g,sw:p.n*p.s,hx:p.x,hz:p.hz,cx:p.x,cz:p.cz,open:false,a:0,sol,sOn:true});
    }});
})();
function nearDoor(){let b=null,bd=2.4;for(const d of doors){const ax=Math.abs(P.pos.x-d.cx),az=Math.abs(P.pos.z-d.cz);if(ax>bd||az>bd)continue;const q=Math.hypot(ax,az);if(q<bd){bd=q;b=d;}}return b;}
function doorSnd(o){tn(o?140:90,o?70:60,.5,.08,'sawtooth');nz(.25,.25,500,1,2,.3);if(!o)nz(.08,.5,900,1,3,.3,'lowpass',.45);}
function setDoor(d,o,quiet){
  if(d.open===o)return;
  d.open=o;
  if(o){if(!d.gate&&d.sOn){const i=solids.indexOf(d.sol);if(i>=0)solids.splice(i,1);d.sOn=false;}} // portão só libera a passagem quando já subiu (ver worldTick)
  else if(!d.sOn){solids.push(d.sol);d.sOn=true;}
  if(!quiet)doorSnd(o);}
function useDoor(){const d=nearDoor();if(!d)return;
  if(d.open){const s=d.sol;if(P.pos.x>s.minX-.6&&P.pos.x<s.maxX+.6&&P.pos.z>s.minZ-.6&&P.pos.z<s.maxZ+.6)return;} // não fecha em cima do jogador
  setDoor(d,!d.open);NET.send({t:'dr',i:doors.indexOf(d),o:d.open?1:0});}
addEventListener('keydown',e=>{if(e.code==='KeyG')useAct();});
const hint=document.createElement('div');hint.style.cssText='position:fixed;left:0;right:0;bottom:34%;text-align:center;font:bold 14px Courier New,monospace;letter-spacing:2px;color:#e8e8e8;text-shadow:0 0 3px #000,1px 1px 0 #000;pointer-events:none;z-index:4;display:none';document.body.appendChild(hint);
const useBtn=document.getElementById('btn-use');
useBtn.addEventListener('pointerdown',e=>{e.preventDefault();useAct();});
