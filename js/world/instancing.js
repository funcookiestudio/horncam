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
function freezeObj(o){o.updateMatrix();o.matrixAutoUpdate=false} // estático: não recalcula matriz todo frame
const INST_ZERO=new THREE.Matrix4().makeScale(0,0,0);
function instHide(p){p.im.setMatrixAt(p.j,INST_ZERO);p.im.instanceMatrix.needsUpdate=true}
