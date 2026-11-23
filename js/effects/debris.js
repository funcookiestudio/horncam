// [HORNCAM] js/effects/debris.js
// ===== entulho e poeira =====
const debs=[],puffs=[],DG=new THREE.IcosahedronGeometry(1,0),
  DM={conc:new THREE.MeshStandardMaterial({color:0x6a6b68,roughness:1,flatShading:true}),brick:new THREE.MeshStandardMaterial({color:0x8a4a30,roughness:1,flatShading:true}),spark:new THREE.MeshBasicMaterial({color:0xffb050})},
  PT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
function deb1(pt,n,kind,size,spd,life){
  const m=new THREE.Mesh(DG,DM[kind]);m.scale.set(size*R2(.6,1.2),size*R2(.5,1),size*R2(.6,1.2));m.position.copy(pt).addScaledVector(n,.03);scene.add(m);
  debs.push({m,sz:size,life,t:0,rest:false,v:n.clone().multiplyScalar(spd*R2(.4,1)).add(new V3(R2(-1,1),R2(0,1.2),R2(-1,1)).multiplyScalar(spd*.5)),w:new V3(R2(-9,9),R2(-9,9),R2(-9,9))});
  if(debs.length>420){const o=debs.shift();scene.remove(o.m)}}
function puff(pt,n,sz,col,life,op,rise){if(puffs.length>120)return;op=op||.45;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:PT,color:col===undefined?0x6a6c6a:col,transparent:true,opacity:op,depthWrite:false}));
  s.position.copy(pt).addScaledVector(n,.05);s.scale.setScalar(sz*.3);scene.add(s);puffs.push({s,t:0,l:life||1.6,sz,op,v:n.clone().multiplyScalar(.4).add(new V3(R2(-.2,.2),R2(.1,.4)+(rise||0),R2(-.2,.2)))})}
