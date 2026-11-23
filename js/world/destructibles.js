// [HORNCAM] js/world/destructibles.js
// ===== OBJETOS DESTRUTÍVEIS: caixas, mesas, prateleiras, empilhadeiras e vidros =====
// A decoração é instanciada (barata). No primeiro dano, a instância é escondida e vira um chunk de voxels
// no mesmo lugar (conversão preguiçosa), com o material do tipo: 'm' = madeira/papelão (mole), 's' = metal (duro).
DM.glass=new THREE.MeshStandardMaterial({color:0xcfe8f2,roughness:.1,transparent:true,opacity:.55,flatShading:true,depthWrite:false});
function dbk(b){if(!b)return 'conc';if(b===1)return 'brick';const k='c'+b;if(!DM[k])DM[k]=new THREE.MeshStandardMaterial({color:b-2,roughness:1,flatShading:true});return k}
const DMAT={m:{hard:.7,rough:.85,met:0},s:{hard:3,rough:.45,met:.35}};
function decMat(k,col){const key='d'+k+col;if(!VM[key])VM[key]=new THREE.MeshStandardMaterial({color:col,roughness:DMAT[k].rough,metalness:DMAT[k].met,vertexColors:true});return key}
function shatter(b,hx,hy,hz){
  const n=hx<hz?new V3(1,0,0):new V3(0,0,1);
  for(let i=0;i<32;i++){const pt=new V3(b[0]+R2(-hx,hx),b[1]+R2(-hy,hy),b[2]+R2(-hz,hz));deb1(pt,n.clone().multiplyScalar(Math.random()<.5?1:-1),'glass',R2(.015,.045),R2(1.5,4),0)}
  nz(.35,.6,5500,2,2.2,.25,'highpass');tn(3200,1800,.15,.08,'triangle')}
function decConv(k,i,quiet){
  const E=DECK[k],b=E&&E.L[i];if(!b||b.cv)return null;
  const q=Math.round(b[7]/(Math.PI/2)),al=Math.abs(b[7]-q*Math.PI/2)<.06;
  if(!al&&k!=='g')return null;
  const odd=Math.abs(q)%2===1,hx=(odd?b[5]:b[3])/2,hy=b[4]/2,hz=(odd?b[3]:b[5])/2;
  b.cv=1;instHide(E.part[i]);
  if(k==='g'){glassMake(b,hx,hy,hz);return null}
  const mkq=k==='s'&&b[4]<=.03&&b[1]<.2, // tinta/faixa no piso: age como o concreto do piso
    vs=mkq&&(2*hx/.0125)*(2*hz/.0125)*Math.max(1,Math.round(2*hy/.0125))<=150000?.0125:(8*hx*hy*hz<=2.3?.025:.05),
    c=mkChunk(new V3(b[0]-hx,b[1]-hy,b[2]-hz),new V3(b[0]+hx,b[1]+hy,b[2]+hz),'conc',decMat(mkq?'m':k,b[6]),vs);
  c.free=true;c.hard=mkq?.35:DMAT[k].hard;c.paint=!!mkq;c.dcode=b[6]+2;
  spatialInsert(spatialVoxels,c,c.min.x,c.max.x,c.min.z,c.max.z);return c}
function decFind(k,q){
  const a=DGRID.get(Math.floor(q[0]/4)+','+Math.floor(q[2]/4));if(!a)return -1;
  for(const [kk,i] of a){if(kk!==k)continue;const b=DECK[k].L[i];if(Math.abs(b[0]-q[0])<.004&&Math.abs(b[1]-q[1])<.004&&Math.abs(b[2]-q[2])<.004)return i}
  return -1}
// explosão: objetos no raio viram voxels (e depois são arrancados); vidros num raio maior estilhaçam
function decBlast(pt,R,quiet){
  const rr=R*3.7+1,x0=Math.floor((pt.x-rr)/4),x1=Math.floor((pt.x+rr)/4),z0=Math.floor((pt.z-rr)/4),z1=Math.floor((pt.z+rr)/4);
  for(let cx=x0;cx<=x1;cx++)for(let cz=z0;cz<=z1;cz++){const a=DGRID.get(cx+','+cz);if(!a)continue;
    for(const [k,i] of a){const b=DECK[k].L[i];if(b.cv&&(k!=='g'||!GLP.has(b)||GLP.get(b).dead))continue;
      const hx=Math.max(b[3],b[5])/2,hy=b[4]/2,d=Math.hypot(Math.max(0,Math.abs(pt.x-b[0])-hx),Math.max(0,Math.abs(pt.y-b[1])-hy),Math.max(0,Math.abs(pt.z-b[2])-hx));
      if(k==='g'){if(d<R*2.2){decConv(k,i,quiet);const G=GLP.get(b);if(G)glassBlast(G,pt,R,d,quiet)}}else if(d<(k==='s'?(b[4]<=.03&&b[1]<.2?R*3.7:R*1.9):R*1.25))decConv(k,i,quiet)}}}
function decFx(k,q,p,n,dir,cnt,s,quiet){
  const i=decFind(k,q);if(i<0)return;const b=DECK[k].L[i];
  if(!b.cv)decConv(k,i,quiet);
  const pt=new V3(...p),nn=new V3(...n),dd=new V3(...dir);
  if(k==='g'){const G=GLP.get(b);if(G)glassHit(G,pt,dd,s,quiet);return}
  voxFx(pt,nn,dd,cnt,b[6]+2,s,quiet);
  if(!quiet&&k==='s'&&!(b[4]<=.03&&b[1]<.2)){const rf=dd.clone().addScaledVector(nn,2*Math.max(0,-dd.dot(nn)));for(let j=0;j<8;j++)deb1(pt,rf,'spark',.007,6,.5);tn(1600+Math.random()*1000,1000,.1,.06,'triangle')}}
function decImpact(h,n,dir){
  const k=h.object.userData.decK,i=h.object.userData.decIdx[h.instanceId],E=DECK[k],b=E&&E.L[i];
  if(!b||b.cv)return false;
  const q=Math.round(b[7]/(Math.PI/2));if(k!=='g'&&Math.abs(b[7]-q*Math.PI/2)>=.06)return false;
  const r3=v=>[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)],r4=v=>[+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4)],
    qc=[+b[0].toFixed(3),+b[1].toFixed(3),+b[2].toFixed(3)],cnt=dmgCount(h.point),s=(Math.random()*1e9)|0,p=r3(h.point),nn=r4(n),dd=r4(dir);
  decFx(k,qc,p,nn,dd,cnt,s,false);
  NET.send({t:'di',k,q:qc,p,n:nn,d:dd,c:cnt,s});return true}
