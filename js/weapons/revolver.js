// [HORNCAM] js/weapons/revolver.js
// ---------- Revólver .357 Magnum (inox, cano 3", empunhadura emborrachada) ----------
// Mesmo rig da MK4/Winchester (mão direita na empunhadura, cano em -Z, clarão e lanterna compartilhados). Tecla 5 (ou botão REVÓLVER).
//  · tiro: 1 projétil forte, martelo e tambor giram, coice alto; semi-automático (cada disparo é um clique)
//  · recarga: tambor abre para a esquerda, cápsulas caem, mão busca o carregador rápido no colete, insere os 6 cartuchos e fecha
//  · troca: um seletor único cuida das três armas (MK4 ↔ Winchester ↔ Revólver); a arma atual desce e a outra sobe
var RVL={on:false,mag:6,res:30,store:{mag:30,res:120,auto:true},rl:false,ct:0,sw:-1,to:'mk4',sd:false,vis:[],fl0:null,rp:0,st:9,cyl:0,cylT:0,sw2:0,ej:false,ld:false};
const RVMAX=6,RVRESMAX=42,RVT=2.05;
const rvInox=MT(0xc4cbcf,.34,.35),rvInox2=MT(0xa0a9ae,.4,.4),rvBlack=MT(0x0b0d0e,.8,.2),rvRubber=MT(0x141516,.9,.02),rvOrange=MT(0xd8601a,.5,.1),rvBrass=MT(0xa8863a,.3,.85);
const rvPivot=new THREE.Group();rvPivot.visible=false;gun.add(rvPivot);
// armação, cano com nervura, massa de mira laranja e alça
rbx(.026,.058,.095,0,-.022,.036,rvInox,rvPivot,0,.007);
cy(.0098,.11,0,-.011,-.105,rvInox,rvPivot);
bx(.008,.004,.11,0,-.0005,-.105,rvInox2,rvPivot);
cy(.0085,.09,0,-.034,-.095,rvInox2,rvPivot);                   // capa da vareta ejetora
cy(.0108,.01,0,-.011,-.158,rvInox2,rvPivot);                   // boca do cano
bx(.005,.011,.012,0,.0065,-.143,rvOrange,rvPivot);
bx(.014,.007,.014,0,.0105,.066,rvBlack,rvPivot);
// martelo (gira ao disparar)
const rvHam=new THREE.Group();rvHam.position.set(0,.004,.082);rvPivot.add(rvHam);
bx(.007,.02,.012,0,.008,.004,rvInox2,rvHam);bx(.007,.006,.016,0,.017,.01,rvBlack,rvHam);
// guarda-mato e gatilho
bx(.008,.003,.075,0,-.073,.03,rvInox2,rvPivot);bx(.008,.024,.003,0,-.06,-.007,rvInox2,rvPivot);bx(.004,.02,.006,0,-.055,.034,rvInox,rvPivot);
// empunhadura de borracha com friso
rbx(.034,.108,.052,0,-.098,.096,rvRubber,rvPivot,-.28,.013);
for(let i=0;i<4;i++)bx(.0345,.004,.054,0,-.07-i*.018,.1+i*.0055,rvBlack,rvPivot,-.28);
// tambor sobre a grua: balança para a esquerda na recarga
const rvSwing=new THREE.Group();rvSwing.position.set(-.015,-.036,-.025);rvPivot.add(rvSwing);
const rvCylG=new THREE.Group();rvCylG.position.set(.015,.022,0);rvSwing.add(rvCylG);
cy(.0215,.05,0,0,0,rvInox,rvCylG);
for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6,f=bx(.008,.005,.034,Math.cos(a)*.0212,Math.sin(a)*.0212,-.004,rvBlack,rvCylG);f.rotation.z=a-Math.PI/2}
for(let i=0;i<6;i++){const a=i*Math.PI/3,h=cy(.0052,.004,Math.cos(a)*.0135,Math.sin(a)*.0135,-.0255,rvBlack,rvCylG)}
cy(.007,.052,0,0,0,rvInox2,rvCylG);
// carregador rápido (speedloader) que a mão leva
const rvLoader=new THREE.Group();rvLoader.visible=false;gun.add(rvLoader);
cy(.0235,.03,0,0,0,rvBlack,rvLoader);
for(let i=0;i<6;i++){const a=i*Math.PI/3;cy(.0052,.022,Math.cos(a)*.0135,Math.sin(a)*.0135,-.024,rvBrass,rvLoader)}
cy(.0045,.012,0,0,.02,rvOrange,rvLoader);
// mão direita no revólver: indicador dobrado para a esquerda sobre o gatilho; polegar menor abraçando a empunhadura
const rvIdx=rh.children[5],rvThb=rh.children[6];                  // indicador e polegar da pose da MK4/Winchester
chain([[.022,-.056,.104],[.025,-.054,.072],[.013,-.055,.05],[.0015,-.056,.0375]],.0088,glove,rvPivot,.93);
chain([[-.012,-.043,.112],[-.02,-.041,.088],[-.021,-.036,.06]],.0072,glove,rvPivot,.93);
// mão esquerda: apoia por baixo da empunhadura; vai ao tambor e ao colete na recarga
const RV_IDLE=new THREE.Vector3(-.09,-.30,.14),RV_CYL=new THREE.Vector3(-.085,-.07,-.025),RV_POUCH=new THREE.Vector3(-.15,-.2,.1);
function rvLH(v,idle){
  sgLH(v,0,0);
  lh.rotation.set(-.2*(1-idle),0,-.25*(1-idle));}
function sfxRV(){nz(.5,1,1500,.7,2.2,.7);nz(.1,.9,5500,.8,3,.3);tn(160,26,.24,1);nz(.8,.4,450,.8,1.5,.7)}
// ---- sobrescritas (encadeiam com as da Winchester/MK4) ----
const _rv0={shoot,reload,toggleMode,toggleSight,toggleLauncher,beginGrenadeMode,eject};
shoot=function(){
  if(!RVL.on)return _rv0.shoot();
  if(RVL.rl||RVL.sw>=0||W.mag<=0)return;
  W.mag--;W.cd=.3;W.rk+=.085;W.rz+=.06;W.fl=.06;W.bs++;
  P.pitch=Math.min(1.45,P.pitch+.028);P.yaw+=(Math.random()-.5)*.008;
  RVL.st=0;RVL.cylT+=Math.PI/3;
  sfxRV();updAmmo();NET.send({t:'sh'});hit()};
reload=function(){
  if(RVL.sw>=0||SG.sw>=0)return;
  if(!RVL.on)return _rv0.reload();
  if(RVL.rl||W.mag>=RVMAX||W.res<=0||PH.dead)return;
  RVL.rl=true;RVL.ct=0;RVL.ej=false;RVL.ld=false;W.trig=false};
eject=function(){_rv0.eject();if(RVL.on){const s=shells[(shi-1+shells.length)%shells.length];s.m.scale.setScalar(1.4)}};
const rvBlock=(f,msg)=>function(){if(RVL.on){feed(msg);return}return f.apply(this,arguments)};
toggleMode=rvBlock(_rv0.toggleMode,'REVÓLVER: SÓ TIRO SEMI');
toggleSight=rvBlock(_rv0.toggleSight,'SEM MIRA HOLOGRÁFICA NO REVÓLVER');
toggleLauncher=rvBlock(_rv0.toggleLauncher,'LANÇADOR SÓ NA MK4');
beginGrenadeMode=rvBlock(_rv0.beginGrenadeMode,'MUNIÇÃO EXPLOSIVA SÓ NA MK4');
// ---- seletor único de armas ----
const wpnCur=()=>SG.on?'sg':RVL.on?'rv':'mk4';
function wpnGo(t){
  if(PH.dead||RVL.sw>=0||SG.sw>=0||wpnCur()===t||W.rl||grenadeMode||grenadeLoading||WA.inspectT>=0)return;
  RVL.sw=0;RVL.to=t;RVL.sd=false;W.trig=false;W.aim=false;SG.rl=false;RVL.rl=false;sfx('rel')}
function wpnCycle(){wpnGo({mk4:'sg',sg:'rv',rv:'mk4'}[wpnCur()])}
sgSwitch=function(to){wpnGo(to?'sg':'mk4')};
function rvApply(on){
  const hs=sgHide();
  if(on){RVL.store={mag:W.mag,res:W.res,auto:W.auto};W.mag=RVL.mag;W.res=Math.min(RVRESMAX,RVL.res);W.auto=false;RVL.fl0=fl.position.clone();RVL.vis=hs.map(o=>o.visible);hs.forEach(o=>o.visible=false)}
  else{RVL.mag=W.mag;RVL.res=W.res;W.mag=RVL.store.mag;W.res=RVL.store.res;W.auto=RVL.store.auto;if(RVL.fl0)fl.position.copy(RVL.fl0);fl.scale.setScalar(1);
    hs.forEach((o,i)=>{o.visible=RVL.vis[i]===undefined?true:RVL.vis[i]});launcher.visible=launcherEquipped;shells.forEach(q=>q.m.scale.setScalar(1));rvLoader.visible=false}
  // lanterna: no revólver fica presa embaixo do cano (na MK4 fica na lateral do cano longo)
  const fp=on?[0,-.058,-.13]:[.052,.012,-.39],fz=on?-.2:-.47,fy=on?-.058:.012,fx=on?0:.052;
  flashlightAttachment.position.set(fp[0],fp[1],fp[2]);FL_LENS.set(fx,fy,fz);flash.position.copy(FL_LENS);flash.target.position.set(fx,fy,-8);beam.position.copy(FL_LENS);
  rvIdx.visible=rvThb.visible=!on;
  RVL.on=on;RVL.rl=false;W.rl=false;rvPivot.visible=on;
  updAmmo();if(on)feed('REVÓLVER .357 EQUIPADO')}
function wpnApply(t){
  if(RVL.on)rvApply(false);
  if(SG.on)sgApply(false);
  if(t==='sg')sgApply(true);else if(t==='rv')rvApply(true)}
addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='Digit5'||e.code==='Numpad5')wpnGo(RVL.on?'mk4':'rv')});
document.querySelectorAll('.btn[data-a="wswap2"]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();wpnGo(RVL.on?'mk4':'rv')}));
// ---- por quadro (chamado depois de sgUpdate) ----
function rvUpdate(dt){
  const k=r=>1-Math.exp(-dt*r);let dn=0;
  if(RVL.sw>=0){RVL.sw+=dt;if(!RVL.sd&&RVL.sw>=.26){RVL.sd=true;wpnApply(RVL.to)}
    dn=RVL.sw<.26?ss(0,.26,RVL.sw):1-ss(.26,.64,RVL.sw);if(RVL.sw>=.64)RVL.sw=-1;W.cd=Math.max(W.cd,.1)}
  if(RVL.on){
    sgHide().forEach(o=>o.visible=false);
    if(W.res>RVRESMAX)W.res=RVRESMAX;
    fl.position.set(0,-.011,-.17);fl.scale.setScalar(1.35);
    RVL.st+=dt;
    // martelo: sobe e cai no disparo; tambor gira 60° por tiro
    rvHam.rotation.x=RVL.st<.05?.7*(1-RVL.st/.05):0;
    RVL.cyl+=(RVL.cylT-RVL.cyl)*k(28);rvCylG.rotation.z=RVL.cyl;
    let hand=null,swing=0,loader=false,hv=0;
    if(RVL.rl&&!W.rl){
      RVL.ct+=dt;const t=RVL.ct;
      swing=ss(.05,.38,t)*(1-ss(1.55,1.88,t));
      if(t>=.5&&!RVL.ej){RVL.ej=true;W.res=Math.min(RVRESMAX,W.res+W.mag);W.mag=0;sfx('drop');for(let i=0;i<6;i++)eject();updAmmo()}
      if(t>=1.36&&!RVL.ld){RVL.ld=true;const n=Math.min(RVMAX,W.res);W.mag=n;W.res-=n;sfx('ins');updAmmo()}
      if(t>=1.86&&RVL.ld&&RVL.ld!==2){RVL.ld=2;sfx('bolt2')}
      // trajetória da mão esquerda: tambor → colete → tambor (com carregador) → volta ao apoio
      const a=ss(.12,.4,t),b=ss(.55,.9,t),c=ss(.95,1.36,t),d=ss(1.5,1.9,t);
      hand=RV_IDLE.clone().lerp(RV_CYL,a).lerp(RV_POUCH,b).lerp(RV_CYL,c).lerp(RV_IDLE,d);
      hv=1-Math.max(0,a-d);                      // 1 = mão de apoio; 0 = mão livre
      loader=t>.88&&t<1.46;
      if(RVL.ct>=RVT){RVL.rl=false;RVL.ct=0}}
    RVL.rp+=((RVL.rl?1:0)-RVL.rp)*k(9);RVL.sw2+=(swing-RVL.sw2)*k(14);
    rvSwing.rotation.z=1.35*RVL.sw2;
    if(loader){rvLoader.visible=true;rvLoader.position.set(hand.x+.004,hand.y+.025,hand.z-.03);rvLoader.rotation.set(Math.PI/2,0,0)}else rvLoader.visible=false;
    rvLH(hand||RV_IDLE,hand?Math.max(0,hv-.3)/.7:1);
    // arma inclina para a esquerda na recarga, expondo o tambor
    gun.rotation.z+=-.34*RVL.rp;gun.rotation.x+=.18*RVL.rp;gun.position.x+=.03*RVL.rp;gun.position.y+=.05*RVL.rp;
    gun.position.y+=.02*W.ads;
  }
  if(dn>0){gun.position.y-=.30*dn;gun.rotation.x-=.55*dn}}
