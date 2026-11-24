// [HORNCAM] js/world/instancing.js
// ===== Lotes instanciados com frustum culling =====
// Um InstancedMesh gigante (todos os 10 galpões) não pode ser cortado pela câmera/sombra e custava ~480 mil triângulos por quadro.
// Aqui as instâncias são separadas por célula espacial (INST_CELL m), cada lote com bounding sphere própria. Resultado visual idêntico.
const INST_CELL=32;
function instRaycast(rc,hits){ // raycast do lote: descarta o lote inteiro pela esfera dele e testa cada instância pela esfera da geometria unitária
  const u=this.userData.ib;if(!rc.ray.intersectsSphere(u.sph))return;
  const g=this.geometry,bs=g.boundingSphere;g.boundingSphere=u.unit;
  try{THREE.InstancedMesh.prototype.raycast.call(this,rc,hits)}finally{g.boundingSphere=bs}}
// info(b) -> [x,y,z,raio]; fill(im,j,b,i) grava matriz/cor da instância j (item global i). Retorna {ims, part[i]={im,j}}
function batchInstanced(geo,mat,L,info,fill){
  if(!geo.boundingSphere)geo.computeBoundingSphere();const unit=geo.boundingSphere.clone(),groups=new Map();
  L.forEach((b,i)=>{const p=info(b),key=Math.floor(p[0]/INST_CELL)+','+Math.floor(p[2]/INST_CELL);let g=groups.get(key);if(!g)groups.set(key,g={idx:[],p:[]});g.idx.push(i);g.p.push(p)});
  const ims=[],part=new Array(L.length);
  for(const g of groups.values()){
    let x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9;
    for(const p of g.p){x0=Math.min(x0,p[0]-p[3]);x1=Math.max(x1,p[0]+p[3]);y0=Math.min(y0,p[1]-p[3]);y1=Math.max(y1,p[1]+p[3]);z0=Math.min(z0,p[2]-p[3]);z1=Math.max(z1,p[2]+p[3])}
    const g2=geo.clone(),sph=new THREE.Sphere(new THREE.Vector3((x0+x1)/2,(y0+y1)/2,(z0+z1)/2),Math.hypot(x1-x0,y1-y0,z1-z0)/2+.01);
    g2.boundingSphere=sph;
    const im=new THREE.InstancedMesh(g2,mat,g.idx.length);im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    g.idx.forEach((i,j)=>{fill(im,j,L[i],i);part[i]={im,j}});
    im.frustumCulled=true;freezeObj(im); // r128: InstancedMesh nasce com frustumCulled=false
    im.userData.ib={sph,unit};im.userData.decIdx=g.idx;im.raycast=instRaycast;ims.push(im)}
  return {ims,part}}
function freezeObj(o){o.updateMatrix();o.updateMatrixWorld(true);o.matrixAutoUpdate=false} // estático: não recalcula matriz todo frame
const INST_ZERO=new THREE.Matrix4().makeScale(0,0,0);
// Caixas da decoração para a colisão da arma (prateleiras, caixas, mesas, empilhadeiras...): grade de 2 m, teste raio x caixa orientada (barato)
const WCB=new Map(),WC_CELL=2;let wcStamp=0;
function wcRegister(geo,L,part){
  if(!geo.boundingBox)geo.computeBoundingBox();const bb=geo.boundingBox;
  L.forEach((b,i)=>{if(b[4]<.05)return; // faixas de tinta no piso: o piso já conta
    const e={x:b[0],y:b[1],z:b[2],c:Math.cos(b[7]),s:Math.sin(b[7]),ix:1/b[3],iy:1/b[4],iz:1/b[5],bb,p:part[i],q:0},r=Math.hypot(b[3],b[5])*.5+.05;
    for(let X=Math.floor((b[0]-r)/WC_CELL);X<=Math.floor((b[0]+r)/WC_CELL);X++)for(let Z=Math.floor((b[2]-r)/WC_CELL);Z<=Math.floor((b[2]+r)/WC_CELL);Z++){
      const k=X+','+Z;let a=WCB.get(k);if(!a)WCB.set(k,a=[]);a.push(e)}})}
function wcBoxes(o,d,len){ // menor distância (0..len) do raio até uma caixa da decoração; Infinity se nada
  const X0=Math.floor(o.x/WC_CELL),Z0=Math.floor(o.z/WC_CELL);let best=Infinity;wcStamp++;
  for(let X=X0-1;X<=X0+1;X++)for(let Z=Z0-1;Z<=Z0+1;Z++){const a=WCB.get(X+','+Z);if(!a)continue;
    for(const e of a){if(e.q===wcStamp||e.p.hid)continue;e.q=wcStamp;
      const rx=o.x-e.x,rz=o.z-e.z,ox=(e.c*rx-e.s*rz)*e.ix,oz=(e.s*rx+e.c*rz)*e.iz,oy=(o.y-e.y)*e.iy,
        dx=(e.c*d.x-e.s*d.z)*e.ix,dz=(e.s*d.x+e.c*d.z)*e.iz,dy=d.y*e.iy,bb=e.bb;let t0=0,t1=Math.min(len,best);
      for(let ax=0;ax<3;ax++){const oo=ax==0?ox:ax==1?oy:oz,dd=ax==0?dx:ax==1?dy:dz,mn=ax==0?bb.min.x:ax==1?bb.min.y:bb.min.z,mx=ax==0?bb.max.x:ax==1?bb.max.y:bb.max.z;
        if(Math.abs(dd)<1e-9){if(oo<mn||oo>mx){t1=-1;break}continue}
        let a1=(mn-oo)/dd,a2=(mx-oo)/dd;if(a1>a2){const t=a1;a1=a2;a2=t}
        if(a1>t0)t0=a1;if(a2<t1)t1=a2;if(t0>t1){t1=-1;break}}
      if(t1>=0&&t0<=t1&&t0<best)best=t0}}
  return best}
function instHide(p){p.hid=true;p.im.setMatrixAt(p.j,INST_ZERO);p.im.instanceMatrix.needsUpdate=true}
