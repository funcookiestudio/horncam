// [HORNCAM] js/world/spatial-manager.js
// ===== GERENCIADOR ESPACIAL: broad-phase para colisão e voxels =====
// Mantém o estado global intacto; somente reduz as listas examinadas a cada operação.
const SPATIAL_SIZE=10, spatialSolids=new Map(), spatialVoxels=new Map();
const spatialKey=(x,z)=>Math.floor(x/SPATIAL_SIZE)+','+Math.floor(z/SPATIAL_SIZE);
function spatialInsert(map,obj,minX,maxX,minZ,maxZ){
  const x0=Math.floor(minX/SPATIAL_SIZE),x1=Math.floor(maxX/SPATIAL_SIZE);
  const z0=Math.floor(minZ/SPATIAL_SIZE),z1=Math.floor(maxZ/SPATIAL_SIZE);
  for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){
    const k=x+','+z;let a=map.get(k);if(!a)map.set(k,a=[]);a.push(obj);
  }
}
function spatialQuery(map,minX,maxX,minZ,maxZ){
  const found=new Set(),x0=Math.floor(minX/SPATIAL_SIZE),x1=Math.floor(maxX/SPATIAL_SIZE);
  const z0=Math.floor(minZ/SPATIAL_SIZE),z1=Math.floor(maxZ/SPATIAL_SIZE);
  for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){
    const a=map.get(x+','+z);if(a)for(const o of a)found.add(o);
  }
  return found;
}
for(const b of solids)spatialInsert(spatialSolids,b,b.minX,b.maxX,b.minZ,b.maxZ);
for(const c of vchunks)spatialInsert(spatialVoxels,c,c.min.x,c.max.x,c.min.z,c.max.z);
const spatialStats={solidCells:spatialSolids.size,voxelCells:spatialVoxels.size,solidCandidates:0,voxelCandidates:0,raycasts:0,raycastObjects:0};
function spatialRaycast(raycaster,objects,recursive=false){
  spatialStats.raycasts++;spatialStats.raycastObjects+=objects.length;
  return raycaster.intersectObjects(objects,recursive);
}

// geração da malha: greedy meshing (só faces expostas, fundidas em retângulos); faces recém-expostas ficam mais claras
function rebuild(c){
  if(c.mesh){const i=hitMeshes.indexOf(c.mesh);if(i>=0)hitMeshes.splice(i,1);scene.remove(c.mesh);c.mesh.geometry.dispose();c.mesh=null}
  const [nx,ny,nz]=c.n,a=c.a,fr=c.fr,vs=c.vs,dims=[nx,ny,nz],st=[1,nz*nx,nx],P=[],NM=[],CO=[],IX=[],p=[0,0,0];
  const emit=(d,u,v,sg,kp,i,j,w,h,m)=>{const k=m==2?1.35:1,b=P.length/3;
    [[i,j],[i+w,j],[i+w,j+h],[i,j+h]].forEach(([s1,s2])=>{const q=[0,0,0];q[d]=kp;q[u]=s1;q[v]=s2;P.push(c.min.x+q[0]*vs,c.min.y+q[1]*vs,c.min.z+q[2]*vs);const nn=[0,0,0];nn[d]=sg;NM.push(nn[0],nn[1],nn[2]);CO.push(k,k,k)});
    if(sg>0)IX.push(b,b+1,b+2,b,b+2,b+3);else IX.push(b,b+2,b+1,b,b+3,b+2)};
  const emitW=(d,u,v,sg,kp,i,j,w,h,m)=>{if(!c.warps||(w<3&&h<3)){emit(d,u,v,sg,kp,i,j,w,h,m);return}for(let jj=0;jj<h;jj+=2)for(let ii=0;ii<w;ii+=2)emit(d,u,v,sg,kp,i+ii,j+jj,Math.min(2,w-ii),Math.min(2,h-jj),m)};
  for(let d=0;d<3;d++){const u=(d+1)%3,v=(d+2)%3,dd=dims[d],du=dims[u],dv=dims[v],mask=new Int32Array(du*dv);
    for(let sg=-1;sg<=1;sg+=2)for(let k=0;k<dd;k++){const kn=k+sg,edge=kn<0||kn>=dd;let any=0;
      for(let j=0;j<dv;j++)for(let i=0;i<du;i++){const bi=k*st[d]+i*st[u]+j*st[v];
        if(a[bi]&&(edge||!a[bi+sg*st[d]])){mask[j*du+i]=fr[bi]?2:1;any=1}else mask[j*du+i]=0}
      if(!any)continue;
      for(let j=0;j<dv;j++)for(let i=0;i<du;){const m=mask[j*du+i];if(!m){i++;continue}
        let w=1;while(i+w<du&&mask[j*du+i+w]===m)w++;
        let h=1;out:while(j+h<dv){for(let t=0;t<w;t++)if(mask[(j+h)*du+i+t]!==m)break out;h++}
        for(let y=0;y<h;y++)for(let t=0;t<w;t++)mask[(j+y)*du+i+t]=0;
        emitW(d,u,v,sg,k+(sg>0?1:0),i,j,w,h,m);i+=w}}}
  if(!P.length)return;
  if(c.warps)warpP(c,P);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(NM,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(CO,3));
  geo.setIndex(IX);if(c.warps)geo.computeVertexNormals();geo.computeBoundingSphere();
  const mesh=new THREE.Mesh(geo,VM[c.mk]);mesh.castShadow=mesh.receiveShadow=true;mesh.userData.chunk=c;scene.add(mesh);hitMeshes.push(mesh);c.mesh=mesh}
function vh(x,y,z){const q=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return q-Math.floor(q)}
function vnz(x,y,z){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),sz=fz*fz*(3-2*fz);
  const L=(p,q,t)=>p+(q-p)*t,g=(i,j,k)=>vh(ix+i,iy+j,iz+k);
  return L(L(L(g(0,0,0),g(1,0,0),sx),L(g(0,1,0),g(1,1,0),sx),sy),L(L(g(0,0,1),g(1,0,1),sx),L(g(0,1,1),g(1,1,1),sx),sy),sz)}
const dmgPts=[];
function dmgCount(pt){let e=dmgPts.find(q=>q.p.distanceToSquared(pt)<.0324);if(e){e.c++;e.p.lerp(pt,.3)}else{e={p:pt.clone(),c:1};dmgPts.push(e);if(dmgPts.length>300)dmgPts.shift()}return e.c}
// ilhas pequenas de voxels sem ligação com o resto caem como entulho
function dropOrphans(c,x0,x1,y0,y1,z0,z1,nrm){
  const nx=c.n[0],ny=c.n[1],nz=c.n[2],a=c.a,vs=c.vs,LIM=c.free?800:60,seen=new Set(),D6=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  x0=Math.max(0,x0-1);y0=Math.max(0,y0-1);z0=Math.max(0,z0-1);x1=Math.min(nx-1,x1+1);y1=Math.min(ny-1,y1+1);z1=Math.min(nz-1,z1+1);
  let removed=0,spawned=0;
  for(let iy=y0;iy<=y1;iy++)for(let iz=z0;iz<=z1;iz++)for(let ix=x0;ix<=x1;ix++){
    const id0=(iy*nz+iz)*nx+ix;if(!a[id0]||seen.has(id0))continue;
    const q=[id0],vis=new Set([id0]);let anch=false;
    for(let h=0;h<q.length&&!anch;h++){const id=q[h],x=id%nx,z=((id/nx)|0)%nz,y=(id/(nx*nz))|0;
      if((c.free?y==0:(x==0||y==0||z==0||x==nx-1||y==ny-1||z==nz-1))){anch=true;break}
      for(const o of D6){const j=((y+o[1])*nz+z+o[2])*nx+x+o[0];if(!a[j]||vis.has(j))continue;if(seen.has(j)){anch=true;break}vis.add(j);q.push(j);if(q.length>LIM){anch=true;break}}}
    if(anch){vis.forEach(i=>seen.add(i));continue}
    for(const id of q){a[id]=0;removed++;if(spawned<5){spawned++;const x=id%nx,z=((id/nx)|0)%nz,y=(id/(nx*nz))|0;
      deb1(new V3(c.min.x+(x+.5)*vs,c.min.y+(y+.5)*vs,c.min.z+(z+.5)*vs),nrm,dbk(c.dcode||(c.type==='brick'?1:0)),R2(.012,.025),1.2,0)}}}
  return removed}
const NBR=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
// remove voxels dentro de esferas irregulares (lobes) e de um túnel opcional (trajetória da bala)
// PRNG com semente: a mesma destruição é reproduzida igual em todos os jogadores
let VR=Math.random,DEFER=false,ISL=false,PNT=false;const DIRTY=new Set();
function seedV(s){let a=s>>>0;VR=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function unseedV(){VR=Math.random;}

