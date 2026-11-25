// [HORNCAM] js/effects/debris.js
// ===== entulho e poeira =====
const debs=[],puffs=[],DG=new THREE.IcosahedronGeometry(1,0),
  DM={conc:new THREE.MeshStandardMaterial({color:0x6a6b68,roughness:1,flatShading:true}),brick:new THREE.MeshStandardMaterial({color:0x8a4a30,roughness:1,flatShading:true}),spark:new THREE.MeshBasicMaterial({color:0xffb050})},
  PT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
function deb1(pt,n,kind,size,spd,life){
  const m=new THREE.Object3D();m.scale.set(size*R2(.6,1.2),size*R2(.5,1),size*R2(.6,1.2));m.position.copy(pt).addScaledVector(n,.03); // não vai para a cena: é desenhado pelos lotes instanciados (debRender)
  debs.push({m,kind,sz:size,life,t:0,rest:false,v:n.clone().multiplyScalar(spd*R2(.4,1)).add(new V3(R2(-1,1),R2(0,1.2),R2(-1,1)).multiplyScalar(spd*.5)),w:new V3(R2(-9,9),R2(-9,9),R2(-9,9))});
  if(debs.length>900)debs.shift()}
function mkFxSprite(col,op,add){const o=new THREE.Object3D();o.material={opacity:op,color:new THREE.Color(col),add:!!add,dispose(){}};return o} // partícula leve: desenhada em lote por fxRender
function puff(pt,n,sz,col,life,op,rise){if(puffs.length>260)return;op=op||.45;const s=mkFxSprite(col===undefined?0x6a6c6a:col,op,false);
  s.position.copy(pt).addScaledVector(n,.05);s.scale.setScalar(sz*.3);puffs.push({s,t:0,l:life||1.6,sz,op,v:n.clone().multiplyScalar(.4).add(new V3(R2(-.2,.2),R2(.1,.4)+(rise||0),R2(-.2,.2)))})}

// ===== Desenho em lote do entulho e das partículas (antes: 1 draw call por pedaço/fumaça, até ~540 por quadro) =====
const DPOOL={},DCAP=900,FXCAP=400;
function debPool(kind){let p=DPOOL[kind];if(p)return p;
  const im=new THREE.InstancedMesh(DG,DM[kind],DCAP);im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.frustumCulled=false;im.count=0;im.visible=false;scene.add(im);return DPOOL[kind]={im,n:0}}
function mkFxGeo(){const g=new THREE.InstancedBufferGeometry(),b=new THREE.PlaneGeometry(1,1);
  g.index=b.index;g.setAttribute('position',b.attributes.position);g.setAttribute('uv',b.attributes.uv);
  g.setAttribute('aOff',new THREE.InstancedBufferAttribute(new Float32Array(FXCAP*3),3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aCol',new THREE.InstancedBufferAttribute(new Float32Array(FXCAP*4),4).setUsage(THREE.DynamicDrawUsage)); // rgb + alpha
  g.setAttribute('aSz',new THREE.InstancedBufferAttribute(new Float32Array(FXCAP),1).setUsage(THREE.DynamicDrawUsage));
  g.instanceCount=0;return g}
function fxMat(add){return new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:PT}}]),fog:true,transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,
  vertexShader:`attribute vec3 aOff;attribute vec4 aCol;attribute float aSz;varying vec2 vUv;varying vec4 vC;
    #include <fog_pars_vertex>
    void main(){vUv=uv;vC=aCol;vec4 mvPosition=viewMatrix*vec4(aOff,1.);mvPosition.xy+=position.xy*aSz;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
  fragmentShader:`uniform sampler2D map;varying vec2 vUv;varying vec4 vC;
    #include <fog_pars_fragment>
    void main(){vec4 t=texture2D(map,vUv);gl_FragColor=vec4(vC.rgb*t.rgb,t.a*vC.a);
    #include <fog_fragment>
    }`})}
const FXP=[0,1].map(add=>{const g=mkFxGeo(),m=new THREE.Mesh(g,fxMat(!!add));m.frustumCulled=false;m.visible=false;scene.add(m);return m});
const FXTMP=[];
function fxDraw(list,add){ // billboards como o THREE.Sprite (tamanho em unidades de mundo), ordenados de trás p/ frente
  const mesh=FXP[add?1:0],g=mesh.geometry,of=g.attributes.aOff.array,co=g.attributes.aCol.array,sz=g.attributes.aSz.array;
  FXTMP.length=0;for(const q of list){const s=q.s;if(!!s.material.add!==add)continue;FXTMP.push(s)}
  const n=Math.min(FXTMP.length,FXCAP);
  if(n>1){const cp=camera.position;for(const s of FXTMP)s.userData.d=s.position.distanceToSquared(cp);FXTMP.sort((a,b)=>b.userData.d-a.userData.d)}
  for(let i=0;i<n;i++){const s=FXTMP[i],c=s.material.color,p=s.position;of[i*3]=p.x;of[i*3+1]=p.y;of[i*3+2]=p.z;co[i*4]=c.r;co[i*4+1]=c.g;co[i*4+2]=c.b;co[i*4+3]=s.material.opacity;sz[i]=s.scale.x}
  g.instanceCount=n;mesh.visible=FXWARM||n>0;
  if(n||FXWARM)for(const a of ['aOff','aCol','aSz']){const at=g.attributes[a];at.updateRange.offset=0;at.updateRange.count=n*at.itemSize;at.needsUpdate=true}}
let FXWARM=false;
function fxRender(){
  // entulho: um InstancedMesh por tipo de material
  for(const k in DPOOL)DPOOL[k].n=0;
  for(const d of debs){const p=debPool(d.kind);d.m.updateMatrix();p.im.setMatrixAt(p.n++,d.m.matrix)}
  for(const k in DPOOL){const p=DPOOL[k],im=p.im;im.count=FXWARM?Math.max(1,p.n):p.n;im.visible=im.count>0;if(p.n){im.instanceMatrix.updateRange.offset=0;im.instanceMatrix.updateRange.count=p.n*16;im.instanceMatrix.needsUpdate=true}}
  // fumaça e brilhos (puffs + bfx): normal e aditivo, em ordem de profundidade
  const all=puffs.concat(bfx);fxDraw(all,false);fxDraw(all,true)}
