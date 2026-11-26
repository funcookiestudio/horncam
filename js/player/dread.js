// [HORNCAM] js/player/dread.js
// ---------- Pavor: neblina que fecha com a tensão, lanterna que falha mais com sanidade baixa e vultos no canto do olho ----------
const DRV=new THREE.Vector3();
const DRD={fog:1,fig:null,t:0,next:25,ang:0,dist:0,age:0,show:false};
function drInit(){
  if(DRD.fig||typeof scene==='undefined')return;
  const c=document.createElement('canvas');c.width=64;c.height=160;const x=c.getContext('2d');
  // silhueta alta e torta: cabeça pequena, ombros caídos, braços longos (preto com borda desfocada)
  x.fillStyle='#000';x.filter='blur(2px)';x.beginPath();x.ellipse(32,22,8,10,0,0,7);x.fill();
  x.beginPath();x.moveTo(18,36);x.quadraticCurveTo(32,30,46,36);x.lineTo(52,110);x.lineTo(46,150);x.lineTo(36,150);x.lineTo(32,100);x.lineTo(28,150);x.lineTo(18,150);x.lineTo(12,110);x.closePath();x.fill();
  const tx=new THREE.CanvasTexture(c);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(.9,2.25),new THREE.MeshBasicMaterial({map:tx,transparent:true,opacity:0,depthWrite:false,fog:false}));
  m.visible=false;m.frustumCulled=false;m.renderOrder=5;scene.add(m);DRD.fig=m}
function dreadTick(dt){
  if(typeof SAN==='undefined'||typeof camera==='undefined')return;
  const on=active&&GS.mode==='play'&&!PH.dead,lo=1-SAN.v/100;
  // neblina: mais densa quanto menor a sanidade, e ainda mais fora do galpão
  if(scene.fog&&typeof OPT!=='undefined'){
    const tg=1+.55*lo+(SAN.out?.3*(.4+lo):0);DRD.fog+=(tg-DRD.fog)*Math.min(1,dt*.25);
    scene.fog.density=.018*(1+.9*(OPT.dark||0))*DRD.fog}
  drInit();const f=DRD.fig;if(!f)return;
  if(!on||lo<.2){f.visible=false;DRD.show=false;return}
  const d=DRV;camera.getWorldDirection(d);const yaw=Math.atan2(d.x,d.z);
  if(!DRD.show){DRD.next-=dt;if(DRD.next<=0){
    DRD.show=true;DRD.age=0;DRD.ang=(Math.random()<.5?-1:1)*(.9+Math.random()*.4);DRD.dist=11+Math.random()*10;
    DRD.next=(45-lo*30)*(.7+Math.random()*.6)}return}
  DRD.age+=dt;const a=yaw+DRD.ang;   // fixo no mundo na direção em que apareceu
  f.position.set(camera.position.x+Math.sin(a)*DRD.dist,1.12,camera.position.z+Math.cos(a)*DRD.dist);
  f.rotation.y=Math.atan2(camera.position.x-f.position.x,camera.position.z-f.position.z);
  // some se o jogador vira para ele (no canto do olho, nunca de frente)
  const dx=f.position.x-camera.position.x,dz=f.position.z-camera.position.z,dl=Math.hypot(dx,dz)||1;
  const look=(d.x*dx+d.z*dz)/(Math.hypot(d.x,d.z)||1)/dl;
  const fade=Math.min(1,DRD.age/.8)*Math.max(0,1-DRD.age/(2.2+lo));
  f.material.opacity=(look>.9?0:.55+.35*lo)*fade;f.visible=f.material.opacity>.01;
  if(DRD.age>2.2+lo||look>.9&&DRD.age>.4){f.visible=false;DRD.show=false}}
{const _h=horrorTick;horrorTick=function(dt){_h(dt);dreadTick(dt)}}
