// [HORNCAM] js/player/horror-events.js
// ---------- Etapas 3 e 4: alucinações da sanidade baixa e gatilhos visuais do diretor de sustos ----------
// Entram como eventos no diretor (HD_EV de audio/horror-director.js), então respeitam tensão, intervalos e a opção TERROR.
const HXV=new THREE.Vector3();
const HX={stare:null,sAge:0,sOn:false,flick:0,dkBase:0};
function hxLo(){return typeof SAN!=='undefined'?1-SAN.v/100:0}
// passos atrás do jogador: aproximam e param de repente (só som)
function hxSteps(A){
  const n=5+(Math.random()*5|0),side=Math.random()*1.6-.8,o=hdOut(A,side,500,.9,.35);let t=A.currentTime+.1,gap=.62-.04*hxLo()*3;
  for(let i=0;i<n;i++){const s=A.createOscillator(),e=A.createGain(),nz=hsNoise(A,.12),nf=A.createBiquadFilter(),ng=A.createGain();
    s.frequency.setValueAtTime(95,t);s.frequency.exponentialRampToValueAtTime(40,t+.12);e.gain.setValueAtTime(.35+i*.07,t);e.gain.exponentialRampToValueAtTime(.001,t+.16);
    nf.type='lowpass';nf.frequency.value=700;ng.gain.setValueAtTime(.2+i*.04,t);ng.gain.exponentialRampToValueAtTime(.001,t+.1);
    s.connect(e);e.connect(o);nz.connect(nf);nf.connect(ng);ng.connect(o);s.start(t);s.stop(t+.2);nz.start(t);nz.stop(t+.12);t+=gap*(.9+Math.random()*.2)}}
// coro de vozes: 3 vozes de formante que sobem e caem de tom
function hxVoices(A){
  const o=hdOut(A,Math.random()*1.2-.6,2600,.5,.9),t=A.currentTime+.05,d=4+Math.random()*3;
  [0,1,2].forEach(i=>{const s=A.createOscillator(),f1=A.createBiquadFilter(),f2=A.createBiquadFilter(),e=A.createGain(),b=130+Math.random()*60+i*38;
    s.type='sawtooth';s.frequency.setValueAtTime(b,t);s.frequency.linearRampToValueAtTime(b*(.8+Math.random()*.5),t+d);
    f1.type='bandpass';f1.frequency.value=600+Math.random()*200;f1.Q.value=8;f2.type='bandpass';f2.frequency.value=1100+Math.random()*500;f2.Q.value=8;
    e.gain.setValueAtTime(.0001,t);e.gain.exponentialRampToValueAtTime(.12,t+d*.45);e.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(f1);s.connect(f2);f1.connect(e);f2.connect(e);e.connect(o);s.start(t);s.stop(t+d+.1)})}
// vulto parado à frente (sanidade < 40): fica visível ~1,6 s; ao se aproximar ou olhar fixo some com um golpe de som e tremor
function hxStare(A){
  if(!DRD.fig||SAN.v>=40||HX.sOn)return;
  if(!HX.stare){HX.stare=new THREE.Mesh(new THREE.PlaneGeometry(1.1,2.7),new THREE.MeshBasicMaterial({map:DRD.fig.material.map,transparent:true,opacity:0,depthWrite:false,fog:false}));
    HX.stare.frustumCulled=false;HX.stare.renderOrder=5;scene.add(HX.stare)}
  const d=new THREE.Vector3();camera.getWorldDirection(d);const yaw=Math.atan2(d.x,d.z)+(Math.random()-.5)*.5,dist=6+Math.random()*4;
  HX.stare.position.set(camera.position.x+Math.sin(yaw)*dist,1.35,camera.position.z+Math.cos(yaw)*dist);HX.sAge=0;HX.sOn=true;HX.stare.visible=true}
function hxVanish(A){
  HX.sOn=false;HX.stare.visible=false;HX.stare.material.opacity=0;
  post.uniforms.shake.value+=1.4;post.uniforms.sig.value=Math.max(post.uniforms.sig.value,.5);
  const o=hdOut(A,0,3000,.8,.5),t=A.currentTime;const s=A.createOscillator(),e=A.createGain();s.type='sawtooth';s.frequency.setValueAtTime(70,t);s.frequency.exponentialRampToValueAtTime(30,t+.5);
  e.gain.setValueAtTime(.8,t);e.gain.exponentialRampToValueAtTime(.001,t+.6);s.connect(e);e.connect(o);s.start(t);s.stop(t+.65)}
// luzes piscando: rajadas rápidas de escuridão + zumbido elétrico
function hxFlicker(A){HX.flick=.6+Math.random()*.9;
  const o=hdOut(A,0,2500,.4,.2),t=A.currentTime,n=hsNoise(A,HX.flick),f=A.createBiquadFilter(),e=A.createGain();f.type='bandpass';f.frequency.value=120;f.Q.value=6;
  e.gain.setValueAtTime(.5,t);e.gain.exponentialRampToValueAtTime(.001,t+HX.flick);n.connect(f);f.connect(e);e.connect(o);n.start(t);n.stop(t+HX.flick)}
// porta que bate sozinha: a porta aberta mais próxima (até 22 m) fecha de repente
function hxSlam(A){
  if(typeof doors==='undefined'||typeof setDoor!=='function')return;
  let b=null,bd=22;for(const d of doors){if(!d.open||d.broken)continue;const q=Math.hypot(d.cx-camera.position.x,d.cz-camera.position.z);if(q<bd){bd=q;b=d}}
  if(b)setDoor(b,false)}
HD_EV.steps=[2,(A)=>{if(hxLo()>.35)hxSteps(A);else HEV.thud(A,hsOut(A,Math.random()*2-1,700,.7),A.currentTime+.02)}];
HD_EV.voices=[1.5,(A)=>{if(hxLo()>.6)hxVoices(A);else hdWhisper(A)}];
HD_EV.stare=[1.5,(A)=>{if(SAN.v<40)hxStare(A);else hdWhisper(A)}];
HD_EV.flicker=[2,(A)=>hxFlicker(A)];
HD_EV.slam=[1.5,(A)=>hxSlam(A)];
function hxTick(dt){
  if(typeof SAN==='undefined'||typeof post==='undefined')return;
  const A=AC;
  if(HX.flick>0){HX.flick-=dt;const base=typeof OPT!=='undefined'?(OPT.dark||0):0;post.uniforms.dk.value=HX.flick>0&&Math.random()<.45?base+1.6:base}
  if(HX.sOn&&HX.stare){
    HX.sAge+=dt;const c=camera.position,p=HX.stare.position,d=HXV;camera.getWorldDirection(d);
    HX.stare.rotation.y=Math.atan2(c.x-p.x,c.z-p.z);
    const dx=p.x-c.x,dz=p.z-c.z,dl=Math.hypot(dx,dz)||1,look=(d.x*dx+d.z*dz)/(Math.hypot(d.x,d.z)||1)/dl;
    HX.stare.material.opacity=Math.min(1,HX.sAge/.5)*(.5+.4*hxLo());
    if(dl<3.2||(look>.96&&HX.sAge>.9)||HX.sAge>2.4){if(A&&A.state==='running')hxVanish(A);else{HX.sOn=false;HX.stare.visible=false}}}
}
{const _h=horrorTick;horrorTick=function(dt){_h(dt);hxTick(dt)}}
