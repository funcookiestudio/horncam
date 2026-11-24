// [HORNCAM] js/debug/profiler.js
// ===== Diagnóstico de desempenho por etapa (F4) e testes A/B =====
let perfDiagOn=false,perfBypassPost=false,perfVolLight=true,perfShadows=true,perfVoxelsVisible=true,perfSamples=0,perfReportTimer=0;
const perfTimes={logic:0,network:0,effects:0,lighting:0,scene:0,post:0,total:0};
const perfPanel=document.createElement('pre');
perfPanel.id='horncam-perf-panel';
perfPanel.style.cssText='display:none;position:fixed;z-index:99999;left:12px;top:90px;max-width:min(560px,90vw);padding:12px;background:rgba(0,0,0,.88);color:#9fffb0;border:1px solid #4a8;border-radius:6px;font:12px/1.5 monospace;white-space:pre-wrap;pointer-events:none';
document.body.appendChild(perfPanel);
if(/[?&]perf=1/.test(location.search)){perfDiagOn=true;perfPanel.style.display='block';perfPanel.style.fontSize='10px';perfPanel.style.pointerEvents='none'} // ?perf=1: painel só de diagnóstico, visível no celular (não altera gráficos)
addEventListener('keydown',e=>{
 if(e.code==='F4'){perfDiagOn=!perfDiagOn;perfPanel.style.display=perfDiagOn?'block':'none';e.preventDefault();}
 if(e.code==='F5'){perfVolLight=!perfVolLight;LVU.on.value=perfVolLight&&LV.ready?1:0;e.preventDefault();}
 if(e.code==='F6'){perfShadows=!perfShadows;renderer.shadowMap.enabled=perfShadows;if(!perfShadows){renderer.shadowMap.autoUpdate=false;}else{renderer.shadowMap.autoUpdate=true;renderer.shadowMap.needsUpdate=true;}e.preventDefault();}
 if(e.code==='F7'){perfBypassPost=!perfBypassPost;e.preventDefault();}
 if(e.code==='F8'){perfVoxelsVisible=!perfVoxelsVisible;for(const c of vchunks)if(c.mesh)c.mesh.visible=perfVoxelsVisible;for(const b of VBATCH)b.visible=perfVoxelsVisible;e.preventDefault();}
 if(e.code==='Backslash'){const v=(post.uniforms.dbg.value+1)%5;post.uniforms.dbg.value=v;document.title='HORNCAM · pós: '+['completo','sem distorção/aberração','sem scanlines/ruído','sem vinheta','sem brilho de lente'][v];console.log('[post] diag',['completo','sem distorção/aberração','sem scanlines/ruído','sem vinheta','sem brilho de lente'][v]);e.preventDefault();}
 if(e.code==='F10'){gun.visible=!gun.visible;e.preventDefault();} // diagnóstico: esconde a arma
 if(e.code==='F9'){lensEffectsEnabled=!lensEffectsEnabled;if(!lensEffectsEnabled){const cv=document.getElementById('lens');if(cv){const cx=cv.getContext('2d');cx.clearRect(0,0,cv.width,cv.height);}glareS=0;post.uniforms.glare.value=0;}e.preventDefault();}
});
function perfReport(dt){
 if(!perfDiagOn)return;perfReportTimer+=dt;if(perfReportTimer<.5)return;perfReportTimer=0;
 const r=renderer.info.render,mem=renderer.info.memory;
 let lightCount=0,meshCount=0;scene.traverse(o=>{if(o.isLight)lightCount++;if(o.isMesh||o.isInstancedMesh)meshCount++;});
 const f=x=>x.toFixed(2)+' ms';
 perfPanel.textContent='HORNCAM / PERFIL DE DESEMPENHO (médias)\n'+
 'F5 luz das luminárias (volume): '+(perfVolLight?'LIGADA':'DESLIGADA')+' | F6 sombras: '+(perfShadows?'LIGADAS':'DESLIGADAS')+' | F7 pós-processo: '+(perfBypassPost?'IGNORADO':'ATIVO')+' | F8 voxels: '+(perfVoxelsVisible?'VISÍVEIS':'OCULTOS')+' | F9 efeitos lente: '+(lensEffectsEnabled?'ATIVOS':'DESLIGADOS')+'\n'+
 'CPU por quadro (amostra): '+f(perfTimes.total)+' | estimativa CPU: '+(perfTimes.total>0?(1000/perfTimes.total).toFixed(1):'--')+'\n'+
 'Lógica: '+f(perfTimes.logic)+' | rede: '+f(perfTimes.network)+' | efeitos: '+f(perfTimes.effects)+'\n'+
 'Iluminação: '+f(perfTimes.lighting)+' | render cena: '+f(perfTimes.scene)+' | pós: '+f(perfTimes.post)+'\n'+
 'Luzes na cena: '+lightCount+' | meshes: '+meshCount+' | lâmpadas: '+lamps.length+' | volume de luz: galpão '+(LV.ready?LV.wi+1:'-')+' · recálculos '+LV.stats.fulls+' · deltas '+LV.stats.deltas+' · último '+LV.stats.buildMs.toFixed(0)+' ms\n'+
 'Draw calls: '+r.calls+' | triângulos: '+r.triangles+' | geometrias: '+mem.geometries+' | texturas: '+mem.textures+'\n'+
 'Nota: amostras recentes; render mede submissão CPU, não GPU. Compare no mesmo ponto/câmera.';
}
function updateSpatialDiagnostics(dt){
  if(!spatialDiagOn)return;diagTimer-=dt;if(diagTimer>0)return;diagTimer=.25;
  const info=renderer.info,tri=info.render.triangles||0;
  let loaded=VBATCH.length,visible=0;for(const b of VBATCH)if(b.visible)visible++;for(const c of vchunks){if(c.mesh){loaded++;if(c.mesh.visible)visible++;}}
  const draw=info.render.calls||0;
  const mem=performance&&performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576)+' MB':'n/d';
  spdiagEl.textContent='HORNCAM / SPATIAL DIAGNOSTICS\\n'+
    'FPS: '+fpsEl.textContent+'\\n'+
    'Voxel chunks mesh: '+loaded+' | visíveis: '+visible+'\\n'+
    'Células espaciais: sólidos '+spatialStats.solidCells+' / voxels '+spatialStats.voxelCells+'\\n'+
    'Candidatos colisão: sólidos '+spatialStats.solidCandidates+' / voxels '+spatialStats.voxelCandidates+'\\n'+
    'Raycasts: '+spatialStats.raycasts+' | objetos consultados acumulados: '+spatialStats.raycastObjects+'\\n'+
    'Draw calls: '+draw+' | triângulos: '+tri+'\\n'+
    'Geometrias: '+info.memory.geometries+' | texturas: '+info.memory.textures+' | heap: '+mem;
}
const p2=n=>String(n).padStart(2,'0');
function tick(){
  requestAnimationFrame(tick);
  if(VOX_DEFER)finalizeVox(); // 1º quadro: todo o mapa já foi gerado; agrupa chunks intactos em lotes instanciados
  const frameStart=performance.now();
  const dt=Math.min(clock.getDelta(),.05); time+=dt;
  let t0=performance.now();if(active) update(dt);perfTimes.logic=performance.now()-t0;
  t0=performance.now();netTick(dt);perfTimes.network=performance.now()-t0;
  t0=performance.now();fxVox(dt);rebuildTick();visFrame();progWatch();horrorTick(dt);if(active)lvTick(dt);fxRender();ammoBoxTick(dt);ecgTick(dt);perfTimes.effects=performance.now()-t0;
  t0=performance.now();expo(dt);{let on=0;for(const L of RL)if(!(L.off&&L.fz<=0))on++;AMB+=(on/RL.length-AMB)*(1-Math.exp(-dt*3));}
  hemi.intensity=(.04+.31*AMB)*EXPO; rim.intensity=(.15+.35*AMB)*EXPO;
  lampTick(dt);perfTimes.lighting=performance.now()-t0;
  post.uniforms.time.value=time;
  t0=performance.now();
  // Acumula estatísticas dos dois passes (cena + pós-processamento), em vez de medir apenas o último.
  renderer.info.reset();
  introTick(dt);
  const MENU=!active&&ov.style.display!=='none';
  menuFrame(dt,MENU);
  if(MENU){renderer.setRenderTarget(rt);renderer.render(menuScene,menuCam);perfTimes.scene=performance.now()-t0;
    t0=performance.now();renderer.setRenderTarget(null);renderer.render(quadScene,quadCam);perfTimes.post=performance.now()-t0;}
  else if(perfBypassPost){renderer.setRenderTarget(null);renderer.render(scene,camera);perfTimes.scene=performance.now()-t0;perfTimes.post=0;}
  else{renderer.setRenderTarget(rt);renderer.render(scene,camera);perfTimes.scene=performance.now()-t0;
    t0=performance.now();renderer.setRenderTarget(null);renderer.render(quadScene,quadCam);perfTimes.post=performance.now()-t0;}
  updateSpatialDiagnostics(dt);perfReport(dt);
  lensTick(dt);
  perfTimes.total=performance.now()-frameStart;
  // HUD
  if(active&&!PH.dead)aliveT+=dt;
  if(MENU_ON){const d=new Date();tsEl.textContent=p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear()+'  '+p2(d.getHours())+':'+p2(d.getMinutes())+':'+p2(d.getSeconds());}
  else{const t=Math.floor(aliveT);tsEl.textContent='TEMPO VIVO '+p2(t/3600|0)+':'+p2((t/60|0)%60)+':'+p2(t%60);}
  fpsAcc+=dt;fpsN++; if(fpsAcc>.5){fpsEl.textContent=Math.round(fpsN/fpsAcc)+' FPS';fpsAcc=fpsN=0;}
}
function update(dt){
  // entrada
  let f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y;
  let s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x;
  if(PH.dead){f=0;s=0;}
  const m=Math.hypot(f,s); if(m>1){f/=m;s/=m;}
  const sprint=(keys.ShiftLeft||keys.ShiftRight||input.sprint||joy.run)&&!P.crouch&&f>0;P.sprinting=!!sprint;
  const jump=(keys.Space||input.jump)&&!PH.dead; input.jump=false;
  const speed=(P.crouch?1.7:(sprint?6.2:3.4))*(1-W.ads*.4);
  // velocidade com aceleração
  const sin=Math.sin(P.yaw),cos=Math.cos(P.yaw);
  const tx=(-sin*f+cos*s)*speed,tz=(-cos*f-sin*s)*speed;
  const a=1-Math.exp(-dt*(P.onGround?10:2));
  P.vel.x+=(tx-P.vel.x)*a; P.vel.z+=(tz-P.vel.z)*a;
  P.pos.x+=P.vel.x*dt; collide(); P.pos.z+=P.vel.z*dt; collide();
  // pulo/gravidade
  if(jump&&P.onGround&&!P.crouch){P.vy=5.2;P.onGround=false;}
  P.vy-=15*dt; P.y+=P.vy*dt;
  if(P.y<=0){ if(!P.onGround&&P.vy<-3) P.landKick=Math.min(.12,-P.vy*.014); P.y=0;P.vy=0;P.onGround=true; }
  const sp=Math.hypot(P.vel.x,P.vel.z);
  // altura (câmera no peito)
  const targetEye=PH.dead?.35:P.crouch?1.2:1.7; P.eye+=(targetEye-P.eye)*(1-Math.exp(-dt*10));
  // balanço de caminhada
  const moving=P.onGround?Math.min(1,sp/3.4):0;
  P.bobT+=dt*sp*(sprint?1.9:2.3);
  P.bob+=(moving-P.bob)*(1-Math.exp(-dt*8));
  P.landKick*=Math.exp(-dt*7);
  // câmera com atraso (corpo gira, câmera no peito segue)
  P.camYaw+=(P.yaw-P.camYaw)*(1-Math.exp(-dt*9));
  P.camPitch+=(P.pitch-P.camPitch)*(1-Math.exp(-dt*12));
  const amp=(sprint?1.7:1)*P.bob;
  const bobY=Math.abs(Math.sin(P.bobT))*.07*amp-P.landKick;
  const swayX=Math.cos(P.bobT)*.045*amp+.12;
  const lagRoll=(P.yaw-P.camYaw)*.6;
  camera.position.set(P.pos.x+Math.cos(P.camYaw)*swayX,P.y+P.eye+bobY,P.pos.z-Math.sin(P.camYaw)*swayX);
  // tilt ao mirar: suavemente inclina a camera para a direita
  if(P.aimTilt===undefined)P.aimTilt=0;
  P.aimTilt+=(-0.055*W.ads-P.aimTilt)*(1-Math.exp(-dt*8));
  camera.rotation.order='YXZ';
  camera.rotation.y=P.camYaw;
  const wk=wakeCam(dt);
  camera.rotation.x=P.camPitch+Math.sin(P.bobT*2)*.012*amp-P.landKick*.8+wk.p;
  camera.rotation.z=Math.cos(P.bobT)*.02*amp+lagRoll+P.aimTilt+DR+wk.r;
  camera.fov+=((sprint?86:80)+wk.f-camera.fov)*(1-Math.exp(-dt*6)); camera.updateProjectionMatrix();
  weaponUpdate(dt,sprint,sp,amp);sgUpdate(dt);rvUpdate(dt);
  post.uniforms.shake.value=amp+P.landKick*10+W.rk*20+BSH*25;
  spdEl.textContent=P.crouch?'CROUCH':sprint?'SPRINT':sp>.5?'WALK':'IDLE';
}
