// [HORNCAM] js/world/glass.js
// ===== VIDRO EM VOXELS: trincas radiais + anéis, cacos triangulares que caem (leve: 1 pool instanciado, malhas só sob demanda) =====
const GLP=new Map();
const GMAT=new THREE.MeshStandardMaterial({color:0xb6dcea,roughness:.05,transparent:true,opacity:.3,depthWrite:false}),
  GCRK=new THREE.MeshStandardMaterial({color:0xf4fbff,roughness:.35,emissive:0x1c262c,transparent:true,opacity:.8,depthWrite:false});
const GP_N=240,gp=[],_gm=new THREE.Matrix4(),_gz=new THREE.Matrix4().makeScale(0,0,0),_gq=new THREE.Quaternion(),_gZ=new V3(0,0,1),_gA=new V3(),_ge=new THREE.Euler();
const gpIM=(()=>{const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-.333,-.333,-.5,.667,-.333,-.5,-.333,.667,-.5,-.333,-.333,.5,.667,-.333,.5,-.333,.667,.5],3));
  g.setIndex([0,2,1,3,4,5,0,1,4,0,4,3,1,2,5,1,5,4,2,0,3,2,3,5]);g.computeVertexNormals();
  const m=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:0xd6ecf5,roughness:.06,metalness:.15,transparent:true,opacity:.6,flatShading:true,depthWrite:false,side:THREE.DoubleSide}),GP_N);
  m.frustumCulled=false;return m})();
let gpi=0,gpAct=0;
for(let i=0;i<GP_N;i++){gp.push({on:0,rest:0,done:0,t:0,p:new V3(),v:new V3(),q:new THREE.Quaternion(),w:new V3(),s:new V3(),yaw:0});gpIM.setMatrixAt(i,_gz)}
scene.add(gpIM);
function gShard(pos,vel,sx,sy,th,q0){
  const d=gp[gpi];gpi=(gpi+1)%GP_N;if(!d.on)gpAct++;
  d.on=1;d.rest=0;d.done=0;d.t=0;d.p.copy(pos);d.v.copy(vel);d.s.set(sx,sy,th);
  d.q.copy(q0).multiply(_gq.setFromAxisAngle(_gZ,Math.random()*6.283));
  d.w.set(R2(-7,7),R2(-7,7),R2(-7,7));d.yaw=Math.random()*6.283}
function glassTick(dt){
  if(!gpAct)return;let chg=false;
  for(let i=0;i<GP_N;i++){const d=gp[i];if(!d.on)continue;
    d.t+=dt;
    if(d.t>30){d.on=0;gpAct--;gpIM.setMatrixAt(i,_gz);chg=true;continue}
    if(d.rest&&d.done)continue;
    if(!d.rest){
      d.v.y-=9.8*dt;d.p.addScaledVector(d.v,dt);
      const wl=d.w.length();if(wl>1e-4){_gq.setFromAxisAngle(_gA.copy(d.w).divideScalar(wl),wl*dt);d.q.premultiply(_gq)}
      if(d.p.y<.1){d.p.y=.1;
        if(d.v.y<-1.2){d.v.y*=-.3;d.v.x*=.55;d.v.z*=.55;d.w.multiplyScalar(.5);if(Math.random()<.5)tn(3800+Math.random()*2500,2600,.05,.025,'triangle')}
        else{d.rest=1;d.q.setFromEuler(_ge.set(-Math.PI/2,d.yaw,0,'YXZ'));d.p.y=.102}}}
    else d.done=1;
    _gm.compose(d.p,d.q,d.s);gpIM.setMatrixAt(i,_gm);chg=true}
  if(chg)gpIM.instanceMatrix.needsUpdate=true}
function glassMake(b,hx,hy,hz){
  const thinZ=hz<=hx,W=2*(thinZ?hx:hz),Hh=2*hy,T=Math.max(.02,2*(thinZ?hz:hx)),gv=.03,
    nu=Math.max(3,Math.round(W/gv)),nv=Math.max(3,Math.round(Hh/gv)),
    tU=thinZ?new V3(1,0,0):new V3(0,0,1),up=new V3(0,1,0),N=tU.clone().cross(up),
    G={b,C:new V3(b[0],b[1],b[2]),tU,N,W,Hh,T,nu,nv,su:W/nu,sv:Hh/nv,a:new Uint8Array(nu*nv),hits:0,m1:null,m2:null,dead:false,qc:[+b[0].toFixed(3),+b[1].toFixed(3),+b[2].toFixed(3)]};
  G.q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tU,up,N));
  GLP.set(b,G);return G}
// a[]: 0 = vidro inteiro, 1 = trinca (voxel branco fosco), 2 = removido (buraco)
function glassBuild(G){
  for(const k of ['m1','m2']){const m=G[k];if(m){const x=hitMeshes.indexOf(m);if(x>=0)hitMeshes.splice(x,1);scene.remove(m);m.geometry.dispose();G[k]=null}}
  if(G.dead)return;
  const nu=G.nu,nv=G.nv,a=G.a,su=G.su,sv=G.sv,W=G.W,Hh=G.Hh,h=G.T/2,PA=[[],[]],IA=[[],[]],NA=[[],[]];
  for(let j=0;j<nv;j++)for(let i=0;i<nu;){
    const t=a[j*nu+i];if(t===2){i++;continue}
    let e=i+1;while(e<nu&&a[j*nu+e]===t)e++;
    const P=PA[t],I=IA[t],NN=NA[t],u0=i*su-W/2,u1=e*su-W/2,v0=j*sv-Hh/2,v1=v0+sv,z=h+(t?.002:0);
    for(const s of [1,-1]){const o=P.length/3;P.push(u0,v0,s*z,u1,v0,s*z,u1,v1,s*z,u0,v1,s*z);NN.push(0,0,s,0,0,s,0,0,s,0,0,s);
      if(s>0)I.push(o,o+1,o+2,o,o+2,o+3);else I.push(o,o+2,o+1,o,o+3,o+2)}
    i=e}
  [GMAT,GCRK].forEach((mt,t)=>{if(!PA[t].length)return;
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(PA[t],3));g.setAttribute('normal',new THREE.Float32BufferAttribute(NA[t],3));g.setIndex(IA[t]);g.computeBoundingSphere();
    const m=new THREE.Mesh(g,mt);m.position.copy(G.C);m.quaternion.copy(G.q);m.userData.glassG=G;m.renderOrder=1;scene.add(m);hitMeshes.push(m);G['m'+(t+1)]=m})}
function gCell(G,pt){
  const d=pt.clone().sub(G.C),i=Math.floor((d.dot(G.tU)+G.W/2)/G.su),j=Math.floor((d.y+G.Hh/2)/G.sv);
  return [Math.max(0,Math.min(G.nu-1,i)),Math.max(0,Math.min(G.nv-1,j))]}
function gLine(G,x0,y0,x1,y1){
  const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;
  for(let n=0;n<300;n++){
    if(x0>=0&&y0>=0&&x0<G.nu&&y0<G.nv){const k=y0*G.nu+x0;if(G.a[k]===0)G.a[k]=1}
    if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}}
// trincas: raios irregulares a partir do impacto + anéis concêntricos (teia de aranha) com falhas
function gCracks(G,cx,cy,nR,nRings,gap){
  const nu=G.nu,nv=G.nv,a=G.a,rays=[],a0=VR()*6.2832;
  for(let r=0;r<nR;r++){
    let ang=a0+(r+(VR()-.5)*.7)*6.2832/nR,x=cx+.5,y=cy+.5;const path=[],mx=VR()<.25?6+VR()*20:500;
    for(let s=0;s<mx;s++){
      x+=Math.cos(ang);y+=Math.sin(ang);ang+=(VR()-.5)*.3;
      const ix=Math.floor(x),iy=Math.floor(y);if(ix<0||iy<0||ix>=nu||iy>=nv)break;
      const k=iy*nu+ix;if(G.hits>1&&s>3&&a[k]===1)break;
      path.push(ix,iy);if(a[k]===0)a[k]=1}
    rays.push(path)}
  const ring=[3+VR()*2,7+VR()*3,12+VR()*4,19+VR()*5,28+VR()*6];
  for(let q=0;q<nRings;q++){const rho=Math.floor(ring[q]);
    for(let r=0;r<nR;r++){const p0=rays[r],p1=rays[(r+1)%nR];
      if(p0.length<rho*2+2||p1.length<rho*2+2||VR()<gap)continue;
      gLine(G,p0[rho*2],p0[rho*2+1],p1[rho*2],p1[rho*2+1])}}}
// regiões de vidro inteiro delimitadas por trincas (flood fill 4-vizinhos)
function gRegions(G,cx,cy){
  const nu=G.nu,nv=G.nv,a=G.a,seen=new Uint8Array(a.length),out=[],stk=[];
  for(let s=0;s<a.length;s++){
    if(a[s]!==0||seen[s])continue;
    let edge=false,n=0,x0=nu,x1=0,y0=nv,y1=0,d2=1e9;const cells=[];
    stk.length=0;stk.push(s);seen[s]=1;
    while(stk.length){const k=stk.pop(),i=k%nu,j=(k/nu)|0;cells.push(k);n++;
      if(i===0||j===0||i===nu-1||j===nv-1)edge=true;
      if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j;
      const dd=(i-cx)*(i-cx)+(j-cy)*(j-cy);if(dd<d2)d2=dd;
      if(i>0&&a[k-1]===0&&!seen[k-1]){seen[k-1]=1;stk.push(k-1)}
      if(i<nu-1&&a[k+1]===0&&!seen[k+1]){seen[k+1]=1;stk.push(k+1)}
      if(j>0&&a[k-nu]===0&&!seen[k-nu]){seen[k-nu]=1;stk.push(k-nu)}
      if(j<nv-1&&a[k+nu]===0&&!seen[k+nu]){seen[k+nu]=1;stk.push(k+nu)}}
    out.push({cells,n,edge,x0,x1,y0,y1,d2})}
  return out}
function gSpawn(G,r,vel0,spread){
  const u=(r.x0+r.x1+1)/2*G.su-G.W/2,v=(r.y0+r.y1+1)/2*G.sv-G.Hh/2,pos=G.C.clone().addScaledVector(G.tU,u);pos.y+=v;
  const sx=Math.max(.02,(r.x1-r.x0+1)*G.su*1.15),sy=Math.max(.02,(r.y1-r.y0+1)*G.sv*1.15),
    vel=vel0.clone().add(new V3(R2(-spread,spread),R2(.1,.9),R2(-spread,spread)));
  gShard(pos,vel,sx,sy,G.T,G.q)}
function gFall(G,cx,cy,rh,dir,quiet){
  const regs=gRegions(G,cx,cy),hits=G.hits,Rg=(hits-2)*9;let sp=0;
  for(const r of regs){
    let fall=false;
    if(!r.edge)fall=hits>1||(r.d2<110&&vh(r.x0,r.y0,hits*3.7)<.75);
    else if(hits>1&&r.n<30&&r.d2<(rh+5)*(rh+5))fall=true;
    else if(hits>=3&&r.d2<Rg*Rg&&r.n<500*hits)fall=true;
    if(!fall)continue;
    for(const k of r.cells)G.a[k]=2;
    if(quiet||sp>=26)continue;
    sp++;gSpawn(G,r,dir.clone().multiplyScalar(R2(.4,1.6)),.5)}}
function glassCollapse(G,dir,quiet){
  if(!quiet){let sp=0;for(const r of gRegions(G,0,0)){if(sp++>=32)break;gSpawn(G,r,dir.clone().multiplyScalar(R2(.3,1.4)),.7)}
    nz(.35,.6,5500,2,2.2,.25,'highpass');tn(3200,1800,.15,.08,'triangle')}
  G.dead=true;glassBuild(G)}
function glassHit(G,pt,dir,seed,quiet){
  if(G.dead)return;
  seedV(seed);G.hits++;
  const hits=G.hits,cc=gCell(G,pt),cx=cc[0],cy=cc[1],nu=G.nu,nv=G.nv;
  gCracks(G,cx,cy,hits===1?8+(VR()*5|0):4+(VR()*3|0),hits===1?4:2,hits===1?.3:.45);
  const rh=1.6+Math.min(hits,6)*.9,Rc=Math.ceil(rh*1.6);let gc=0;
  for(let j=Math.max(0,cy-Rc);j<=Math.min(nv-1,cy+Rc);j++)for(let i=Math.max(0,cx-Rc);i<=Math.min(nu-1,cx+Rc);i++){
    const k=j*nu+i;if(G.a[k]===2)continue;
    if(Math.hypot(i-cx,j-cy)<rh*(.65+.7*vh(i,j,hits))){G.a[k]=2;
      if(!quiet&&gc<8&&vh(i,j,2)<.18){gc++;const p=G.C.clone().addScaledVector(G.tU,(i+.5)*G.su-G.W/2);p.y+=(j+.5)*G.sv-G.Hh/2;
        gShard(p,dir.clone().multiplyScalar(R2(.5,2)).add(new V3(R2(-.6,.6),R2(0,1),R2(-.6,.6))),R2(.025,.05),R2(.025,.05),G.T,G.q)}}}
  gFall(G,cx,cy,rh,dir,quiet);
  let alive=0;for(let k=0;k<G.a.length;k++)if(G.a[k]===0)alive++;
  unseedV();
  if(!quiet&&hits===1){nz(.1,.4,4500,1,2.5,.2,'highpass');tn(4200,2600,.09,.06,'triangle')}
  if(hits>=7||alive<G.a.length*.06)glassCollapse(G,dir,quiet);else glassBuild(G)}
function glassBlast(G,pt,R,d,quiet){
  if(G.dead)return;G.dead=true;glassBuild(G);
  if(quiet)return;
  let alive=0;for(let k=0;k<G.a.length;k++)if(G.a[k]===0)alive++;
  const f=Math.max(.15,1-d/(R*2.2)),n=Math.min(38,Math.round(G.W*G.Hh*16*alive/G.a.length)+4);
  for(let i=0;i<n;i++){
    const pos=G.C.clone().addScaledVector(G.tU,R2(-.5,.5)*G.W);pos.y+=R2(-.5,.5)*G.Hh;
    const sz=Math.sqrt(G.W*G.Hh/Math.max(8,n))*R2(.5,1.5),dv=pos.clone().sub(pt);dv.y+=.4;dv.normalize();
    gShard(pos,dv.multiplyScalar(R2(3,9)*f).add(new V3(R2(-1,1),R2(0,2),R2(-1,1))),sz,sz*R2(.6,1.3),G.T,G.q)}
  nz(.35,.6,5500,2,2.2,.25,'highpass');tn(3200,1800,.15,.08,'triangle')}
function glassImpact(h,n,dir){
  const G=h.object.userData.glassG;if(!G||G.dead)return;
  const r3=v=>[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)],r4=v=>[+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4)],
    p=r3(h.point),nn=r4(n),dd=r4(dir),cnt=dmgCount(h.point),s=(Math.random()*1e9)|0;
  decFx('g',G.qc,p,nn,dd,cnt,s,false);NET.send({t:'di',k:'g',q:G.qc,p,n:nn,d:dd,c:cnt,s})}

