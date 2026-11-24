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
// portas e portões de metal entram no sistema de destruição de objetos de aço (DECK.s): ao levar tiro/explosão FECHADOS viram voxels de aço
// (furos, estilhaços, arrancados por explosão). Aberto/em movimento, só faísca. Depois de quebrados não abrem mais e deixam de bloquear a passagem.
function regDoor(d,m,box){
  if(!DECK.s)DECK.s={part:[],L:[]};
  const i=DECK.s.L.length;box.door=d;DECK.s.L.push(box);
  DECK.s.part[i]={hid:false,j:0,im:{instanceMatrix:{},setMatrixAt(){breakDoor(d,m)}}};
  const key=Math.floor(box[0]/4)+','+Math.floor(box[2]/4);let a=DGRID.get(key);if(!a)DGRID.set(key,a=[]);a.push(['s',i]);
  m.userData.doorIdx=i;d.bi=i;d.mesh=m}
function breakDoor(d,m){d.broken=true;if(d.plate&&d.plate.mesh){const pm=d.plate.mesh,x2=hitMeshes.indexOf(pm);if(x2>=0)hitMeshes.splice(x2,1);d.g.remove(pm);pm.geometry.dispose();d.plate.mesh=null}m.visible=false;const x=hitMeshes.indexOf(m);if(x>=0)hitMeshes.splice(x,1);
  const i=solids.indexOf(d.sol);if(i>=0)solids.splice(i,1);d.sOn=false}
// Tiro comum: a porta/portão continua funcionando, mas a chapa vira uma grade de voxels (como o vidro) que acompanha o movimento da porta.
// Cada tiro abre um furo de verdade (some o aço, dá para ver através) com a borda levantada no lado de saída. Só a EXPLOSÃO quebra a porta
// (vira voxels livres, ver decBlast); os furos já abertos passam para essa versão (doorPlateToChunk).
function plateEnsure(d){
  if(d.plate)return d.plate;
  const m=d.mesh,gate=d.gate,W=gate?2.8:1.18,H=gate?3.8:2.08,T=gate?.05:.06,gv=.025,nu=Math.round(W/gv),nv=Math.round(H/gv);
  const P={d,W,H,T,nu,nv,su:W/nu,sv:H/nv,a:new Uint8Array(nu*nv),hl:[],hits:[],mesh:null,center:m.position.clone()};
  d.plate=P;m.visible=false;const x=hitMeshes.indexOf(m);if(x>=0)hitMeshes.splice(x,1);return P}
function plateBuild(P){
  const d=P.d,nu=P.nu,nv=P.nv,a=P.a,fr=new Uint8Array(a.length);let any=0;
  if(P.mesh){const x=hitMeshes.indexOf(P.mesh);if(x>=0)hitMeshes.splice(x,1);d.g.remove(P.mesh);P.mesh.geometry.dispose();P.mesh=null}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const k=j*nu+i;if(a[k]!==0)continue;any=1;
    if(i>0&&a[k-1]===2||i<nu-1&&a[k+1]===2||j>0&&a[k-nu]===2||j<nv-1&&a[k+nu]===2)fr[k]=1}
  if(!any)return;
  const g=gmesh({n:[nu,nv,1],a,fr,vs:[P.su,P.sv,P.T],min:{x:-P.W/2,y:-P.H/2,z:-P.T/2}}),ps=g.attributes.position,uv=new Float32Array(ps.count*2);
  for(let k=0;k<ps.count;k++){uv[k*2]=(ps.getX(k)+P.W/2)/P.W;uv[k*2+1]=(ps.getY(k)+P.H/2)/P.H}
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  for(const L of P.hl){for(let k=0;k<ps.count;k++){   // borda levantada no lado de saída, leve afundamento na entrada
    const dx=ps.getX(k)-L.x,dy=ps.getY(k)-L.y,dd=Math.hypot(dx,dy);if(dd>.11)continue;const t=1-dd/.11,q=t*t*(3-2*t),z=ps.getZ(k),ex=z*L.sz>0,fl=.006*q/Math.max(dd,.01);
    ps.setZ(k,z+L.sz*(ex?.024:.007)*q);if(ex){ps.setX(k,ps.getX(k)+dx*fl);ps.setY(k,ps.getY(k)+dy*fl)}}}
  ps.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();
  const m=new THREE.Mesh(g,VM[d.gate?'ds_gate':'ds_exit']);m.position.copy(P.center);m.rotation.y=d.gate?0:-Math.PI/2;m.castShadow=m.receiveShadow=true;
  m.userData.doorIdx=d.bi;d.g.add(m);hitMeshes.push(m);P.mesh=m}
function doorBullet(d,pt,n,seed){
  const P=plateEnsure(d);if(!P.mesh)plateBuild(P);const m=P.mesh;if(!m)return;
  d.g.updateMatrixWorld(true);if(P.mesh)P.mesh.updateMatrixWorld(true);
  const lp=m.worldToLocal(pt.clone()),ln=n.clone().applyQuaternion(m.getWorldQuaternion(new THREE.Quaternion()).invert()),sz=ln.z>0?-1:1,
    nu=P.nu,nv=P.nv,a=P.a,cx=Math.floor((lp.x+P.W/2)/P.su)+.5,cy=Math.floor((lp.y+P.H/2)/P.sv)+.5;
  let e=P.hits.find(q=>Math.hypot(q.x-cx,q.y-cy)<6);if(e)e.c++;else{e={x:cx,y:cy,c:1};P.hits.push(e)}const c=e.c;
  seedV(seed);
  const kill=(x,y)=>{x=Math.round(x-.5);y=Math.round(y-.5);if(x<0||y<0||x>=nu||y>=nv)return;a[y*nu+x]=2};
  const r=1.35+Math.min(c,7)*.5;
  for(let j=-Math.ceil(r)-1;j<=Math.ceil(r)+1;j++)for(let i=-Math.ceil(r)-1;i<=Math.ceil(r)+1;i++)if(Math.hypot(i,j)<r*(.8+.4*VR()))kill(cx+i,cy+j);
  if(c>=2){const nr=1+Math.min(c,4);for(let k=0;k<nr;k++){const an=VR()*6.283,L=r+2+VR()*(2+c);for(let t=0;t<L;t+=.5)kill(cx+Math.cos(an)*t,cy+Math.sin(an)*t)}}
  unseedV();
  // pedaços soltos (sem ligação com a borda da chapa) caem e somem
  {const seen=new Uint8Array(a.length),st=[];for(let s0=0;s0<a.length;s0++){if(a[s0]!==0||seen[s0])continue;const comp=[];let anch=false;st.length=0;st.push(s0);seen[s0]=1;
    while(st.length){const k=st.pop();comp.push(k);const x=k%nu,y=(k/nu)|0;if(x===0||y===0||x===nu-1||y===nv-1)anch=true;
      if(x>0&&a[k-1]===0&&!seen[k-1]){seen[k-1]=1;st.push(k-1)}if(x<nu-1&&a[k+1]===0&&!seen[k+1]){seen[k+1]=1;st.push(k+1)}
      if(y>0&&a[k-nu]===0&&!seen[k-nu]){seen[k-nu]=1;st.push(k-nu)}if(y<nv-1&&a[k+nu]===0&&!seen[k+nu]){seen[k+nu]=1;st.push(k+nu)}}
    if(!anch)for(const k of comp)a[k]=2}}
  P.hl.push({x:lp.x,y:lp.y,sz});if(P.hl.length>40)P.hl.shift();
  plateBuild(P)}
function doorPlateToChunk(d,c){   // explosão: leva os furos de bala já abertos para a versão em voxels livres
  const P=d.plate;if(!P)return;voxAlloc(c);const [nx,ny,nz]=c.n;
  for(let j=0;j<P.nv&&j<ny;j++)for(let i=0;i<P.nu;i++){if(P.a[j*P.nu+i]!==2)continue;
    if(d.gate){if(i<nx)for(let z=0;z<nz;z++)c.a[(j*nz+z)*nx+i]=0}else if(i<nz)for(let x=0;x<nx;x++)c.a[(j*nz+i)*nx+x]=0}
  if(typeof RBQ!=='undefined')RBQ.add(c)}
function doorImpact(h,n,dir){
  const i=h.object.userData.doorIdx,b=DECK.s&&DECK.s.L[i];if(!b||b.cv||b.door.broken)return false;
  const r3=v=>[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)],r4=v=>[+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4)],p=r3(h.point),nn=r4(n),sd=(Math.random()*1e9)|0;
  const P_=new V3(...p),N_=new V3(...nn);doorBullet(b.door,P_,N_,sd);propFx(P_,N_);
  NET.send({t:'dh',i:doors.indexOf(b.door),p,n:nn,s:sd});return true}
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
  window.DOORTEX={gate:gateMat.map,exit:emMat.map};
  const GG=new THREE.BoxGeometry(2.8,3.8,.05),DG=new THREE.BoxGeometry(.06,2.08,1.18);
  PORTALS.forEach(p=>{
    if(p.k==='g'){
      const g=new THREE.Group();g.position.set(p.cx,3.9,p.cz);scene.add(g);
      const m=new THREE.Mesh(GG,gateMat);m.position.y=-1.9;m.castShadow=m.receiveShadow=true;g.add(m);hitMeshes.push(m);
      const sol={minX:p.cx-1.41,maxX:p.cx+1.41,minZ:p.cz-.12,maxZ:p.cz+.12};solids.push(sol);
      const dg={g,gate:true,sw:0,hx:p.cx,hz:p.cz,cx:p.cx,cz:p.cz,open:false,a:0,sol,sOn:true};doors.push(dg);{const b=[p.cx,2.0,p.cz,2.8,3.8,.05,0xa8b0b6,0];b.mkKey='ds_gate';b.uvf=(x,y)=>[(x-(b[0]-1.4))/2.8,(y-(b[1]-1.9))/3.8];regDoor(dg,m,b)}
    }else{
      const g=new THREE.Group();g.position.set(p.x,0,p.hz);scene.add(g);
      const m=new THREE.Mesh(DG,emMat);m.position.set(0,1.15,p.s*.6);m.castShadow=m.receiveShadow=true;g.add(m);hitMeshes.push(m);
      const sol={minX:p.x-.1,maxX:p.x+.1,minZ:p.z0,maxZ:p.z1};solids.push(sol);
      const dd=({g,sw:p.n*p.s,hx:p.x,hz:p.hz,cx:p.x,cz:p.cz,open:false,a:0,sol,sOn:true});doors.push(dd);{const b=[p.x,1.15,p.hz+p.s*.6,.06,2.08,1.18,0xa8312a,0];b.mkKey='ds_exit';b.uvf=(x,y,z)=>[(z-(b[2]-.59))/1.18,(y-(b[1]-1.04))/2.08];regDoor(dd,m,b)}
    }});
})();
// materiais de aço com a textura original (a malha de voxels ganha UV pela posição; ver rebuild em spatial-manager.js)
VM.ds_gate=new THREE.MeshStandardMaterial({map:DOORTEX.gate,roughness:.55,metalness:.45,vertexColors:true});
VM.ds_exit=new THREE.MeshStandardMaterial({map:DOORTEX.exit,roughness:.5,metalness:.35,vertexColors:true});
const DOORWARM=[VM.ds_gate,VM.ds_exit].map(mt=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.01,0,0,0,.01,0],3));g.setAttribute('normal',new THREE.Float32BufferAttribute([0,0,1,0,0,1,0,0,1],3));
  g.setAttribute('color',new THREE.Float32BufferAttribute([1,1,1,1,1,1,1,1,1],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1],2));
  const m=new THREE.Mesh(g,mt);m.position.y=-80;m.visible=false;m.frustumCulled=false;scene.add(m);return m});
function nearDoor(){let b=null,bd=2.4;for(const d of doors){if(d.broken)continue;const ax=Math.abs(P.pos.x-d.cx),az=Math.abs(P.pos.z-d.cz);if(ax>bd||az>bd)continue;const q=Math.hypot(ax,az);if(q<bd){bd=q;b=d;}}return b;}
function doorSnd(o){tn(o?140:90,o?70:60,.5,.08,'sawtooth');nz(.3,.3,900,5,3,.2,'bandpass');nz(.25,.25,500,1,2,.3);nz(.09,.45,2300,6,4,.1,'bandpass',o?0:.42);if(!o)nz(.08,.5,900,1,3,.3,'lowpass',.45);}
// portão de enrolar: trava pesada ao partir, chocalhar de lâminas + estalos de corrente enquanto sobe/desce, baque ao chegar
function gateStart(o){nz(.14,.55,500,2,4,.2);tn(80,45,.22,.22,'square');nz(.12,.4,2600,7,5,.1,'bandpass',.05)}
function gateRattle(){nz(.05,.2,2200+Math.random()*2600,6,4,.05,'bandpass');nz(.1,.15,650+Math.random()*500,3,3,.05,'bandpass');if(Math.random()<.5)nz(.03,.18,3400+Math.random()*1800,9,6,.03,'bandpass',.03);nz(.22,.1,170,1,1,.05)}
function gateStop(o){nz(.2,.6,320,1,3,.25);tn(62,36,.26,.4);nz(.22,.22,1800,8,4,.1,'bandpass',.03);if(!o)nz(.1,.3,3000,6,5,.1,'bandpass',.12)}
function setDoor(d,o,quiet){
  if(d.open===o||d.broken)return;
  d.open=o;
  if(o){if(!d.gate&&d.sOn){const i=solids.indexOf(d.sol);if(i>=0)solids.splice(i,1);d.sOn=false;}} // portão só libera a passagem quando já subiu (ver worldTick)
  else if(!d.sOn){solids.push(d.sol);d.sOn=true;}
  if(!quiet){if(d.gate)gateStart(o);else doorSnd(o)}}
function useDoor(){const d=nearDoor();if(!d||d.broken)return;
  if(d.open){const s=d.sol;if(P.pos.x>s.minX-.6&&P.pos.x<s.maxX+.6&&P.pos.z>s.minZ-.6&&P.pos.z<s.maxZ+.6)return;} // não fecha em cima do jogador
  setDoor(d,!d.open);NET.send({t:'dr',i:doors.indexOf(d),o:d.open?1:0});}
addEventListener('keydown',e=>{if(e.code==='KeyG')useAct();});
const hint=document.createElement('div');hint.style.cssText='position:fixed;left:0;right:0;bottom:34%;text-align:center;font:bold 14px Courier New,monospace;letter-spacing:2px;color:#e8e8e8;text-shadow:0 0 3px #000,1px 1px 0 #000;pointer-events:none;z-index:4;display:none';document.body.appendChild(hint);
const useBtn=document.getElementById('btn-use');
useBtn.addEventListener('pointerdown',e=>{e.preventDefault();useAct();});
