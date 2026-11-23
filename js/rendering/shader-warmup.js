// [HORNCAM] js/rendering/shader-warmup.js
// ---------- Pré-aquecimento: compila shaders dos efeitos de tiro antes do 1º disparo ----------
function warmup(){
  try{
    const objs=[fl,mag2,...shells.map(q=>q.m),...decals,...sparks.map(q=>q.m)];
    const old=objs.map(o=>o.visible);
    objs.forEach(o=>o.visible=true);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:PT,color:0x6a6c6a,transparent:true,opacity:.45,depthWrite:false}));
    sp.frustumCulled=false;scene.add(sp);
    const dm=[];for(const k in DM){const m=new THREE.Mesh(DG,DM[k]);m.frustumCulled=false;scene.add(m);dm.push(m);}
    camera.updateMatrixWorld(true);
    renderer.setRenderTarget(rt);
    if(renderer.compile)renderer.compile(scene,camera);
    renderer.render(scene,camera);
    renderer.setRenderTarget(null);
    objs.forEach((o,i)=>o.visible=old[i]);
    scene.remove(sp);sp.material.dispose();dm.forEach(m=>scene.remove(m));
  }catch(e){console.warn('warmup',e);}
}
warmup();
tick();

