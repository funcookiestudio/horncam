// [HORNCAM] js/world/voxel-system.js
// ===== MAPA VOXEL: sistema de voxel + destruição da Prévia Estruturas de concreto =====
const vchunks=[],VS=.05,TOP=H-.2,V3=THREE.Vector3,R2=(a,b)=>a+Math.random()*(b-a);
const GL=`float h31(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h31(i),h31(i+vec3(1.,0.,0.)),f.x),mix(h31(i+vec3(0.,1.,0.)),h31(i+vec3(1.,1.,0.)),f.x),f.y),mix(mix(h31(i+vec3(0.,0.,1.)),h31(i+vec3(1.,0.,1.)),f.x),mix(h31(i+vec3(0.,1.,1.)),h31(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}
float ff_(vec3 p){return max(max(fwidth(p.x),fwidth(p.y)),fwidth(p.z));}
float mI_(float x,float P,float w){float q=x/P,i=floor(q);return i*w+max((q-i)*P-(P-w),0.);}
float mC_(float x,float P,float w,float f){f=max(f,.0002);float c=(mI_(x+.5*f,P,w)-mI_(x-.5*f,P,w))/f;return mix(c,w/P,smoothstep(.6,1.2,f/P));}`;
const BFR=()=>`vec3 fn_=normalize(cross(dFdx(vWP),dFdy(vWP)));vec3 bc_=vec3(.72,.7,.64);
float uw_=abs(fn_.x)>abs(fn_.z)?vWP.z:vWP.x,dv_=fwidth(vWP.y),du_=fwidth(uw_);
if(abs(fn_.y)<.5){float c_=floor(vWP.y/.1);float up_=uw_+mod(c_,2.)*.1+37.3;float bi_=floor(up_/.2);
float cv_=mC_(vWP.y,.1,.02,dv_),cu_=mC_(up_,.2,.02,du_);cu_=mix(cu_,.1,smoothstep(.5,1.,dv_/.1));
float a1_=1.-smoothstep(.3,1.2,max(du_/.2,dv_/.1)),a2_=1.-smoothstep(.3,.9,max(du_,dv_)*30.),nv_=.5;
if(a2_>.001)nv_=mix(.5,vn(vWP*30.),a2_);
vec3 br_=mix(vec3(.55,.26,.15),vec3(.78,.4,.24),mix(.5,h31(vec3(c_,bi_,3.)),a1_))*(.85+.3*nv_);
bc_=mix(bc_,br_,(1.-cv_)*(1.-cu_));}
diffuseColor.rgb*=bc_*.9;`;
function mkVMat(fr,key){const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,vertexColors:true});m.extensions={derivatives:true};
  m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\nvWP=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;\n#else\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;\n#endif');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;\n'+GL).replace('#include <color_fragment>','#include <color_fragment>\n'+fr)};
  m.customProgramCacheKey=()=>'vox'+key;return m}
const VMB=mkVMat(BFR(),'b'); // um único material/programa para paredes de tijolo (eixo escolhido pela normal da face)
const VM={conc:mkVMat('float f_=ff_(vWP),a9_=1.-smoothstep(.3,.9,f_*9.),a37_=1.-smoothstep(.3,.9,f_*37.),n9_=.5,n37_=.5;if(a9_>.001)n9_=mix(.5,vn(vWP*9.),a9_);if(a37_>.001)n37_=mix(.5,vn(vWP*37.),a37_);diffuseColor.rgb*=vec3(.6)*(.8+.35*n9_+.15*n37_);','c'),bx:VMB,bz:VMB};
VM.floor=mkVMat('float f_=ff_(vWP),a9_=1.-smoothstep(.3,.9,f_*9.),a37_=1.-smoothstep(.3,.9,f_*37.),n9_=.5,n37_=.5;if(a9_>.001)n9_=mix(.5,vn(vWP*9.),a9_);if(a37_>.001)n37_=mix(.5,vn(vWP*37.),a37_);diffuseColor.rgb*=vec3(.42)*(.8+.35*n9_+.15*n37_);','f');
let CUR_EL=null; // elemento estrutural em construção (laje/viga/pilar): define a armadura embutida
let VOX_DEFER=true;const VPEND=[],VBATCH=[];
function mkChunk(mn,mx,type,mk,vs_){const V_=vs_||VS;
  const n=[Math.max(1,Math.round((mx.x-mn.x)/V_)),Math.max(1,Math.round((mx.y-mn.y)/V_)),Math.max(1,Math.round((mx.z-mn.z)/V_))];
  mx=new V3(mn.x+n[0]*V_,mn.y+n[1]*V_,mn.z+n[2]*V_);
  const c={min:mn,max:mx,n,vs:V_,type,mk,el:CUR_EL,hard:mk==='floor'?2.5:1,a:null,fr:null,mesh:null,ib:null,ii:-1};
  if(VOX_DEFER){VPEND.push(c);vchunks.push(c);return c} // intacto: vira instância de um lote (ver finalizeVox)
  const sz=mx.clone().sub(mn);
  const g=new THREE.BoxGeometry(sz.x,sz.y,sz.z);g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(72).fill(1),3));
  const m=new THREE.Mesh(g,VM[mk]);m.position.copy(mn).addScaledVector(sz,.5);m.castShadow=m.receiveShadow=true;m.userData.chunk=c;
  freezeObj(m);scene.add(m);hitMeshes.push(m);c.mesh=m;vchunks.push(c);return c}
// ===== Chunks intactos em lotes instanciados (1 draw call por material e por célula de 64 m, com frustum culling) =====
// Antes: ~4.300 malhas (uma por chunk) = ~2.000 draw calls por quadro dentro de um galpão. Chunk danificado volta a ter malha própria (rebuild).
const VZERO=new THREE.Matrix4().makeScale(0,0,0);
function hitChunk(h){const u=h.object.userData;return u.chunk||(u.vox&&u.vox[h.instanceId])||null}
function hideVox(c){const b=c.ib;if(!b)return;b.im.setMatrixAt(c.ii,VZERO);b.alive[c.ii]=0;b.im.instanceMatrix.needsUpdate=true;c.ib=null}
function voxBatchRaycast(rc,hits){ // caixas alinhadas aos eixos: teste de slab exato (só faces externas, como o FrontSide do mesh antigo)
  const b=this.userData.vb,o=rc.ray.origin,d=rc.ray.direction,bb=b.bb,al=b.alive,n=al.length,far=rc.far,near=rc.near;
  const ix=1/d.x,iy=1/d.y,iz=1/d.z;
  for(let i=0;i<n;i++){if(!al[i])continue;const k=i*6;
    let t1=(bb[k]-o.x)*ix,t2=(bb[k+3]-o.x)*ix,tn=Math.min(t1,t2),tf=Math.max(t1,t2),ax=t1<t2?-1:1,ay=0,az=0;
    t1=(bb[k+1]-o.y)*iy;t2=(bb[k+4]-o.y)*iy;let a=Math.min(t1,t2),bq=Math.max(t1,t2);if(a>tn){tn=a;ax=0;ay=t1<t2?-1:1}if(bq<tf)tf=bq;
    t1=(bb[k+2]-o.z)*iz;t2=(bb[k+5]-o.z)*iz;a=Math.min(t1,t2);bq=Math.max(t1,t2);if(a>tn){tn=a;ax=0;ay=0;az=t1<t2?-1:1}if(bq<tf)tf=bq;
    if(tn>tf||tn<near||tn>far||tn!==tn)continue;
    const pt=new THREE.Vector3().copy(d).multiplyScalar(tn).add(o);
    hits.push({distance:tn,point:pt,object:this,instanceId:i,face:{a:0,b:0,c:0,normal:new THREE.Vector3(ax,ay,az),materialIndex:0}})}}
function finalizeVox(){
  if(!VOX_DEFER)return;VOX_DEFER=false;
  const groups=new Map(),CELL=32;
  for(const c of VPEND){const mat=VM[c.mk],cx=Math.floor((c.min.x+c.max.x)/2/CELL),cz=Math.floor((c.min.z+c.max.z)/2/CELL),key=mat.uuid+'|'+cx+'|'+cz;
    let g=groups.get(key);if(!g)groups.set(key,g={mat,list:[]});g.list.push(c)}
  const unit=new THREE.BoxGeometry(1,1,1);unit.setAttribute('color',new THREE.BufferAttribute(new Float32Array(72).fill(1),3));
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),pos=new V3(),scl=new V3();
  for(const g of groups.values()){
    const N=g.list.length,geo=unit.clone(),im=new THREE.InstancedMesh(geo,g.mat,N),bb=new Float32Array(N*6),alive=new Uint8Array(N).fill(1);
    let mnx=1e9,mny=1e9,mnz=1e9,mxx=-1e9,mxy=-1e9,mxz=-1e9;
    g.list.forEach((c,i)=>{pos.set((c.min.x+c.max.x)/2,(c.min.y+c.max.y)/2,(c.min.z+c.max.z)/2);scl.set(c.max.x-c.min.x,c.max.y-c.min.y,c.max.z-c.min.z);
      m4.compose(pos,q,scl);im.setMatrixAt(i,m4);
      bb[i*6]=c.min.x;bb[i*6+1]=c.min.y;bb[i*6+2]=c.min.z;bb[i*6+3]=c.max.x;bb[i*6+4]=c.max.y;bb[i*6+5]=c.max.z;
      mnx=Math.min(mnx,c.min.x);mny=Math.min(mny,c.min.y);mnz=Math.min(mnz,c.min.z);mxx=Math.max(mxx,c.max.x);mxy=Math.max(mxy,c.max.y);mxz=Math.max(mxz,c.max.z);
      c.ib={im,alive};c.ii=i});
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    geo.boundingSphere=new THREE.Sphere(new V3((mnx+mxx)/2,(mny+mxy)/2,(mnz+mxz)/2),Math.hypot(mxx-mnx,mxy-mny,mxz-mnz)/2+.01); // só para o frustum culling (raycast é próprio)
    im.frustumCulled=true;freezeObj(im);im.castShadow=im.receiveShadow=true;im.userData.vox=g.list;im.userData.vb={bb,alive};im.raycast=voxBatchRaycast;
    scene.add(im);hitMeshes.push(im);VBATCH.push(im)}
  VPEND.length=0}
function block(x0,y0,z0,x1,y1,z1,type,mk,tx,ty,tz){
  // Todas as fronteiras de chunk caem na grade de voxels (VS): sem frestas nem sobreposição entre blocos vizinhos
  // (antes cada chunk era arredondado para a grade mas o vizinho começava fora dela -> fendas escuras nas paredes de tijolo).
  const V=VS,sp=(a,b,t)=>{const s0=Math.round(a/V);let N=Math.round(b/V)-s0;if(b-a<.6||N<1)N=Math.max(1,Math.round((b-a)/V));return{s0,N,A:Math.max(1,Math.ceil(N*V/t-1e-6))}},
    X=sp(x0,x1,tx),Y=sp(y0,y1,ty),Z=sp(z0,z1,tz),q=(o,i)=>(o.s0+Math.round(o.N*i/o.A))*V;
  for(let i=0;i<X.A;i++)for(let j=0;j<Y.A;j++)for(let k=0;k<Z.A;k++)
    mkChunk(new V3(q(X,i),q(Y,j),q(Z,k)),new V3(q(X,i+1),q(Y,j+1),q(Z,k+1)),type,mk)}
// parede reta com aberturas [a,b,yBaixo,yCima] (porta: 0..2.1, janela: 1..2.2)
function wall(ax,az,bx,bz,th,type,ops,hh){
  hh=hh||TOP;ops=ops||[];const xd=Math.abs(bx-ax)>Math.abs(bz-az),u0=xd?Math.min(ax,bx):Math.min(az,bz),u1=xd?Math.max(ax,bx):Math.max(az,bz),c=xd?az:ax,
    pts=[...new Set([u0,u1,...ops.flatMap(o=>[o[0],o[1]])])].sort((a,b)=>a-b),br=type==='brick',mk=br?(xd?'bx':'bz'):'conc',tl=br?2:3;
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],m=(a+b)/2,op=ops.find(o=>m>o[0]&&m<o[1]);
    (op?[[0,op[2]],[op[3],hh]]:[[0,hh]]).forEach(([y0,y1])=>{if(y1-y0<.02)return;
      if(xd)block(a,y0,c-th/2,b,y1,c+th/2,type,mk,tl,2.5,9);else block(c-th/2,y0,a,c+th/2,y1,b,type,mk,9,2.5,tl)})}}
