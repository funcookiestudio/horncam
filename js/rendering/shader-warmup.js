// [HORNCAM] js/rendering/shader-warmup.js
// ---------- Pré-aquecimento: compila shaders dos efeitos de tiro antes do 1º disparo ----------
function warmup(){
  try{
    const objs=[fl,mag2,sgPivot,sgShell,rvPivot,rvLoader,...shells.map(q=>q.m),...decals,...sparks.map(q=>q.m)];
    const old=objs.map(o=>o.visible);
    objs.forEach(o=>o.visible=true);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:PT,color:0x6a6c6a,transparent:true,opacity:.45,depthWrite:false}));
    sp.frustumCulled=false;scene.add(sp);
    decMat('m',0x808080);decMat('s',0x808080);bxInit(); // materiais de chunk de decor e marcas da explosão: criados sob demanda → compilavam no 1º tiro/explosão
    const bxo=[BX.ring,...BX.sc.map(q=>q.m)],bxv=bxo.map(o=>o.visible);bxo.forEach(o=>{o.visible=true;o.frustumCulled=false;o.position.set(0,-80,0)});
    const vw=[];{const g=new THREE.BoxGeometry(.01,.01,.01);g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(72).fill(1),3));
      for(const k in VM){const m=new THREE.Mesh(g,VM[k]);m.frustumCulled=false;m.position.set(0,-80,0);scene.add(m);vw.push(m)}
      const m=new THREE.Mesh(g,RBM);m.frustumCulled=false;m.position.set(0,-80,0);scene.add(m);vw.push(m)} // + vergalhão exposto (RBM) // chunk danificado usa o programa NÃO instanciado: compila agora, não no 1º tiro
    FXWARM=true;debPool(dbk(0x808082));for(const k in DM)debPool(k); // + entulho colorido (kinds c###)
    fxRender(); // compila as variantes instanciadas do entulho e das partículas
    camera.updateMatrixWorld(true);
    renderer.setRenderTarget(rt);
    if(renderer.compile)renderer.compile(scene,camera);
    renderer.render(scene,camera);
    renderer.setRenderTarget(null);
    objs.forEach((o,i)=>o.visible=old[i]);bxo.forEach((o,i)=>o.visible=bxv[i]);
    // a luz do clarão do tiro (fl) muda o nº de luzes pontuais (15 ↔ 14) e três recompila os programas por isso: compila as duas variantes agora
    renderer.setRenderTarget(rt);renderer.render(scene,camera);renderer.setRenderTarget(null);
    scene.remove(sp);sp.material.dispose();vw.forEach(m=>scene.remove(m));FXWARM=false;fxRender();
  }catch(e){console.warn('warmup',e);}
}
// Vigia: depois do warmup, qualquer programa novo = compilação síncrona no meio do jogo (trava). Avisa no console com o que mudou.
let PW_N=-1;window.PROG_LATE=[];
function progWatch(){const P=renderer.info.programs;if(!P)return;if(PW_N<0){PW_N=P.length;return}
  if(P.length>PW_N){const nw=P.slice(PW_N).map(p=>p.name+'#'+p.id+' '+(p.cacheKey||'').slice(0,120));PW_N=P.length;PROG_LATE.push(...nw);console.warn('[shader] '+nw.length+' programa(s) compilado(s) após o warmup (possível trava):',nw)}}
warmup();
tick();

