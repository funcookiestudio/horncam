// [HORNCAM] js/rendering/lighting.js
// ---------- iluminação otimizada: sombra barata da lanterna + lâmpadas que não vazam luz por paredes ----------
flash.shadow.mapSize.set(1024,1024);
flash.distance=20;flash.shadow.bias=-.0006;flash.shadow.normalBias=.025;
flash.angle=.34;flash.penumbra=.3;flash.color.setHex(0xf0f0d0); // facho fechado, de borda mais dura, levemente amarelado
let lampRR=0,flashPrev=false,flT=0,flDip=1;
const occRC=new THREE.Raycaster();
function lightTick(dt){
  // sombra da lanterna: só é redesenhada com ela ligada
  const sm=renderer.shadowMap;
  if(flashOn){
    sm.autoUpdate=true;
    if(!flashPrev)sm.needsUpdate=true;
  }else{sm.autoUpdate=false;sm.needsUpdate=false;}
  flashPrev=flashOn;
  if(flashOn){flT-=dt; // bateria fraca: quedas rápidas de intensidade
    if(flT<=0){if(Math.random()<.08){flDip=.12+Math.random()*.3;flT=.03+Math.random()*.1}else{flDip=1;flT=.5+Math.random()*2.5}}
    flash.intensity+=(2.6*flDip-flash.intensity)*Math.min(1,dt*40)}
  // Oclusão dinâmica das lâmpadas removida: evita raycasts contínuos e variação de intensidade.
}

