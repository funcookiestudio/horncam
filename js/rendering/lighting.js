// [HORNCAM] js/rendering/lighting.js
// ---------- iluminação otimizada: sombra barata da lanterna + lâmpadas que não vazam luz por paredes ----------
flash.shadow.mapSize.set(1024,1024);
flash.distance=20;
// anti 'borrões pretos' (shadow acne) nas paredes: bias maior + normalBias + near/far justos + PCF suave
flash.shadow.bias=-.0003;flash.shadow.normalBias=.06;flash.shadow.camera.near=.35;flash.shadow.camera.far=22;
// (PCF suave removido: custava caro em GPU integrada; o tipo continua PCFShadowMap do renderer.js)
flash.angle=.34;flash.penumbra=.3;flash.color.setHex(0xf0f0d0); // facho fechado, de borda mais dura, levemente amarelado
let lampRR=0,flashPrev=false,flT=0,flDip=1,flFail=0,flTog=0,flOn=true;
const occRC=new THREE.Raycaster();
function lightTick(dt){
  // sombra da lanterna: só é redesenhada com ela ligada
  const sm=renderer.shadowMap;
  if(flashOn){
    sm.autoUpdate=true;
    if(!flashPrev)sm.needsUpdate=true;
  }else{sm.autoUpdate=false;sm.needsUpdate=false;}
  flashPrev=flashOn;
  if(flashOn){const sanL=typeof SAN!=='undefined'?1-SAN.v/100:0;flT-=dt; // bateria fraca: quedas rápidas de intensidade
    if(flT<=0){if(Math.random()<.08+.22*sanL){flDip=.12+Math.random()*.3;flT=.03+Math.random()*.1}else{flDip=1;flT=.5+Math.random()*2.5}}
    // FALHA da lanterna: contato ruim, apaga e acende em rajadas. Mais comum andando e muito mais correndo
    let tg=2.6*flDip*(1-.28*sanL);   // sanidade baixa: lanterna mais fraca
    if(flFail>0){flFail-=dt;flTog-=dt;
      if(flTog<=0){flOn=!flOn;flTog=flOn?.03+Math.random()*.12:.04+Math.random()*.16;}
      if(flFail<=0)flOn=true;
      if(!flOn)tg=0}
    else{const rate=P.sprinting?.5:(Math.hypot(P.vel.x,P.vel.z)>.5?.1:.04);
      if(Math.random()<rate*dt){flFail=.15+Math.random()*(rate>.4?1.1:.5);flOn=false;flTog=.05+Math.random()*.12}}
    flash.intensity+=(tg-flash.intensity)*Math.min(1,dt*40)}
  // Oclusão dinâmica das lâmpadas removida: evita raycasts contínuos e variação de intensidade.
}

