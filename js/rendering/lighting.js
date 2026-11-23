// [HORNCAM] js/rendering/lighting.js
// ---------- iluminação otimizada: sombra barata da lanterna + lâmpadas que não vazam luz por paredes ----------
flash.shadow.mapSize.set(1024,1024);
flash.distance=20;flash.shadow.bias=-.0006;flash.shadow.normalBias=.025;
let lampRR=0,flashPrev=false;
const occRC=new THREE.Raycaster();
function lightTick(dt){
  // sombra da lanterna: só é redesenhada com ela ligada
  const sm=renderer.shadowMap;
  if(flashOn){
    sm.autoUpdate=true;
    if(!flashPrev)sm.needsUpdate=true;
  }else{sm.autoUpdate=false;sm.needsUpdate=false;}
  flashPrev=flashOn;
  // Oclusão dinâmica das lâmpadas removida: evita raycasts contínuos e variação de intensidade.
}

