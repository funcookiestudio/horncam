// [HORNCAM] js/world/street-lights.js
// ---------- Postes da rua e do pátio: luz real. A grade de luz só cobre o interior dos galpões, então 4 PointLights fixas
// (sempre na cena: o nº de luzes não muda e não recompila shader) acompanham o jogador e ficam nos postes mais próximos. ----------
const SLP=[],SLL=[],SLD=[],SLH=[],SLB=[]; // SLD: lâmpada quebrada; SLH: halos; SLB: bulbos (alvo dos tiros)
(function(){
  const add=(x,sz)=>SLP.push(new THREE.Vector3(x,8.5,sz*7.5));
  for(let x=165;x<=485;x+=40)[-1,1].forEach(sz=>add(x,sz));
  for(let x=-120;x<=120;x+=30)[-1,1].forEach(sz=>add(x,sz));
  // halo luminoso em cada lâmpada: visível de longe (inclusive de dentro do galpão, pelo portão aberto)
  {const m=new THREE.SpriteMaterial({map:typeof PT!=='undefined'?PT:null,color:0xffd89a,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false,fog:true});
   const bm=new THREE.MeshBasicMaterial({color:0xffe6b0}),bg=new THREE.BoxGeometry(.9,.35,.9);
   SLP.forEach((p,i)=>{const h=new THREE.Sprite(m);h.position.set(p.x,p.y+.05,p.z);h.scale.set(7,7,1);h.frustumCulled=false;scene.add(h);
     const c=new THREE.Sprite(m);c.position.copy(h.position);c.scale.set(1.6,1.6,1);c.frustumCulled=false;scene.add(c);SLH[i]=[h,c];SLD[i]=false;
     const b=new THREE.Mesh(bg,bm.clone());b.position.set(p.x,p.y-.1,p.z);b.userData.streetLamp=i;scene.add(b);SLB[i]=b;if(typeof hitMeshes!=='undefined')hitMeshes.push(b)})}
  for(let i=0;i<4;i++){const l=new THREE.PointLight(0xffdca0,0,30,1.5);l.position.set(0,-90,0);scene.add(l);SLL.push(l)}
  let acc=1,cur=[-1,-1,-1,-1];
  const loop=()=>{requestAnimationFrame(loop);
    const cp=camera.position,inside=typeof LREG!=='undefined'&&LREG.whAt(cp.x,cp.z)>=0;
    acc+=1/60;if(acc<.2)return;acc=0;
    const near=SLP.map((p,i)=>[(p.x-cp.x)**2+(p.z-cp.z)**2,i]).filter(a=>!SLD[a[1]]&&a[0]<55*55&&(!inside||a[0]>14*14)).sort((a,b)=>a[0]-b[0]).slice(0,4);
    SLL.forEach((l,k)=>{const n=near[k];if(!n){l.intensity=0;return}
      l.position.copy(SLP[n[1]]);l.intensity=inside?1.6:2.6});
  };loop();
})();

// quebrar a lâmpada de um poste: apaga luz e halo, bulbo escurece, faíscas e vidro
function breakStreetLamp(i,quiet){
  if(SLD[i])return;SLD[i]=true;
  if(SLH[i])SLH[i].forEach(h=>h.visible=false);
  if(SLB[i]){SLB[i].material.color.setHex(0x1a1a18)}
  if(quiet||typeof sparkShower==='undefined')return;
  const c=SLP[i].clone();c.y-=.2;sparkShower(c,90);
  for(let k=0;k<6;k++)puff(c.clone().add(new V3(R2(-.5,.5),R2(-.4,0),R2(-.5,.5))),new V3(0,-.2,0),R2(.7,1.3),0x3a3b3a,R2(2.5,4),.5,.3);
  nz(.12,.5,6000,1,2,.2,'highpass');tn(2200,300,.2,.12,'sawtooth');
}
function hitStreetLamp(i){if(SLD[i])return;breakStreetLamp(i,false);NET.send({t:'sl',i})}
