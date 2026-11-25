// [HORNCAM] js/weapons/shotgun.js
// ---------- Winchester Model 12 (espingarda pump-action) ----------
// Modelo procedural encaixado no mesmo rig da MK4: mesma posição de mão direita (empunhadura), mesma mão esquerda na empunhadura frontal (aqui o
// guarda-mão que corre sobre o tubo), mesma direção do cano (-Z), mesmo clarão e lanterna. Animações próprias:
//  · tiro: coice forte, 9 chumbos, bombeada automática (guarda-mão recua, ejeta o cartucho e volta)
//  · recarga: cartucho por cartucho (mão busca no colete, leva à janela inferior, insere); atirar interrompe; bombeia se a câmara estava vazia
//  · troca (tecla 4 ou botão ARMA): a arma atual desce, a outra sobe
var SG={on:false,mag:6,res:18,store:{mag:30,res:120,auto:true},rl:false,ct:0,pumpT:-1,pw:-1,pumped:0,needPump:false,sw:-1,swTo:false,swd:false,fl0:null,vis:[],lastIns:false,rp:0};
const SGMAX=6,SGRESMAX=36,SGC=.66;
const sgSteel=MT(0x1c2329,.42,.78),sgSteel2=MT(0x2b3238,.5,.62),sgDark=MT(0x07090a,.9,.1),sgWood=MT(0x5a3a1f,.68,.05),sgWoodD=MT(0x432913,.74,.05),sgBrass=MT(0x9a7a3a,.32,.85),sgRed=MT(0xa8281c,.6,.05);
const sgPivot=new THREE.Group();sgPivot.visible=false;gun.add(sgPivot);
// cano, tubo do carregador, boca e massa de mira
cy(.0105,.62,0,-.011,-.41,sgSteel,sgPivot);
cy(.0095,.52,0,-.035,-.38,sgSteel2,sgPivot);
cy(.0125,.018,0,-.035,-.636,sgSteel,sgPivot);
cy(.0118,.014,0,-.011,-.715,sgSteel2,sgPivot);
{const b=new THREE.Mesh(new THREE.SphereGeometry(.0026,8,6),sgBrass);b.position.set(0,.0035,-.712);sgPivot.add(b)}
// caixa com bordas arredondadas (raio r): caixa subdividida, vértices empurrados para fora de uma caixa interna
function rbx(w,h,d,x,y,z,mat,p,rx=0,r=.006){
  r=Math.min(r,w/2.2,h/2.2,d/2.2);
  const g=new THREE.BoxGeometry(w,h,d,4,4,4),ps=g.attributes.position,nm=g.attributes.normal,hw=w/2-r,hh=h/2-r,hd=d/2-r;
  for(let i=0;i<ps.count;i++){
    const vx=ps.getX(i),vy=ps.getY(i),vz=ps.getZ(i);
    const cx=Math.max(-hw,Math.min(hw,vx)),cy=Math.max(-hh,Math.min(hh,vy)),cz=Math.max(-hd,Math.min(hd,vz));
    let nx=vx-cx,ny=vy-cy,nz=vz-cz;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
    ps.setXYZ(i,cx+nx*r,cy+ny*r,cz+nz*r);nm.setXYZ(i,nx,ny,nz);}
  const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);m.rotation.x=rx;p.add(m);return m;}
// caixa da culatra, janela de ejeção, janela de carga inferior
rbx(.036,.056,.20,0,-.008,-.01,sgSteel,sgPivot,0,.007);bx(.03,.012,.20,0,.022,-.01,sgSteel2,sgPivot);
bx(.002,.022,.07,.0185,.004,-.035,sgDark,sgPivot);bx(.026,.004,.05,0,-.037,-.03,sgDark,sgPivot);rbx(.034,.052,.03,0,-.01,.1,sgSteel,sgPivot,0,.006);
// guarda-mato e gatilho
bx(.010,.004,.085,0,-.060,.04,sgSteel2,sgPivot);bx(.010,.026,.004,0,-.047,.083,sgSteel2,sgPivot);bx(.010,.020,.004,0,-.05,-.003,sgSteel2,sgPivot);bx(.004,.022,.006,0,-.045,.036,sgSteel,sgPivot);
// coronha de nogueira: pescoço (onde fica a mão direita), pente e soleira
rbx(.034,.085,.045,0,-.072,.1,sgWood,sgPivot,-.3,.011);rbx(.032,.05,.2,0,-.03,.2,sgWood,sgPivot,.15,.012);rbx(.04,.12,.22,0,-.12,.27,sgWoodD,sgPivot,.2,.016);rbx(.042,.13,.012,0,-.125,.385,sgSteel2,sgPivot,.2,.005);
// abraçadeira da lanterna: liga o cano à lanterna lateral da arma (.052)
cy(.0135,.02,0,-.011,-.39,sgSteel2,sgPivot);bx(.040,.01,.02,.028,0,-.39,sgSteel2,sgPivot);
// guarda-mão (a bomba): corre sobre o tubo; com as duas barras de ação
const sgSlide=new THREE.Group();sgPivot.add(sgSlide);
{const w=new THREE.Mesh((()=>{const g=new THREE.CylinderGeometry(.0275,.0275,.19,18);g.rotateX(Math.PI/2);return g})(),sgWood);sgSlide.add(w);
 for(let i=0;i<6;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(.0277,.0016,6,20),sgWoodD);r.position.z=-.07+i*.0235;sgSlide.add(r)}
 for(const s of [-1,1])bx(.004,.004,.30,s*.014,.012,.245,sgSteel2,sgSlide);
 cy(.0285,.012,0,0,-.098,sgSteel2,sgSlide)}
// cartucho (calibre 12) que a mão carrega na recarga
const sgShell=new THREE.Group();sgShell.visible=false;gun.add(sgShell);
cy(.0105,.06,0,0,0,sgRed,sgShell);cy(.0108,.018,0,0,.039,sgBrass,sgShell);
const SG_FORE=new THREE.Vector3(0,-.075,-.36),SG_POUCH=new THREE.Vector3(-.15,-.2,.1),SG_PORT=new THREE.Vector3(-.008,-.085,-.02);
function sgLH(v,rx,rz){
  lh.position.copy(v);lh.rotation.set(rx||0,0,rz||0);fg.rotation.set(0,0,0);
  const wr=v.clone().add(new THREE.Vector3(-.04,-.012,.085)),el=armShoulder.clone().lerp(wr,.53);el.x-=.025;el.y-=.028;el.z+=.012;
  poseArmBone(upperArmBone,armShoulder,el);poseArmBone(foreArmBone,el,wr);elbowJoint.position.copy(el)}
function sfxSG(){nz(.42,1,1800,.7,2.4,.6);nz(.12,.9,5200,.8,3,.3);tn(120,30,.28,1);nz(.9,.5,500,.8,1.6,.8)}
// ---- sobrescritas: a MK4 continua igual; com a Winchester na mão, estas funções passam a valer para ela ----
const _sg0={shoot,reload,toggleMode,toggleSight,toggleLauncher,beginGrenadeMode,eject};
shoot=function(){
  if(!SG.on)return _sg0.shoot();
  if(SG.rl){if(W.mag>0)SG.rl=false;else return}
  if(SG.pumpT>=0||SG.pw>=0||W.mag<=0)return;
  W.mag--;W.cd=.85;W.rk+=.07;W.rz+=.1;W.fl=.07;W.bs++;
  P.pitch=Math.min(1.45,P.pitch+.034);P.yaw+=(Math.random()-.5)*.01;
  sfxSG();updAmmo();NET.send({t:'sh'});
  // 9 chumbos em leque: 1 central + 8 em anel (ângulo e raio com sorteio), círculo de ~6° (metade com mira); cada um fura/destrói separado
  {const R=.17*(1-W.ads*.45),asp=innerHeight/innerWidth,a0=Math.random()*6.283;
    for(let i=0;i<9;i++){if(i===0){hit(0,0);continue}const a=a0+(i-1)/8*6.283+(Math.random()-.5)*.5,r=R*(.45+.55*Math.random());hit(Math.cos(a)*r*asp,Math.sin(a)*r)}}
  SG.pw=.2;SG.pumped=0};                      // a bombeada começa logo após o coice
reload=function(){
  if(!SG.on)return _sg0.reload();
  if(SG.rl||SG.pumpT>=0||SG.pw>=0||SG.sw>=0||W.mag>=SGMAX||W.res<=0||PH.dead)return;
  SG.rl=true;SG.ct=0;SG.lastIns=false;SG.needPump=W.mag===0;W.trig=false};
eject=function(){_sg0.eject();const s=shells[(shi-1+shells.length)%shells.length];s.m.scale.setScalar(SG.on?2.6:1)};
const sgBlock=(f,msg)=>function(){if(SG.on){feed(msg);return}return f.apply(this,arguments)};
toggleMode=sgBlock(_sg0.toggleMode,'WINCHESTER: SÓ TIRO SEMI (BOMBA)');
toggleSight=sgBlock(_sg0.toggleSight,'SEM MIRA HOLOGRÁFICA NA WINCHESTER');
toggleLauncher=sgBlock(_sg0.toggleLauncher,'LANÇADOR SÓ NA MK4');
beginGrenadeMode=sgBlock(_sg0.beginGrenadeMode,'MUNIÇÃO EXPLOSIVA SÓ NA MK4');
// ---- troca de arma ----
const sgGripMesh=()=>gun.children.find(o=>o.isMesh&&Math.abs(o.position.y+.075)<.001&&Math.abs(o.position.z-.075)<.001);
const sgHide=()=>[legacyWeapon,mk4Pivot,launcher,mag,holo,sgGripMesh()].filter(Boolean);
function sgSwitch(to){
  if(PH.dead||SG.sw>=0||SG.on===to||W.rl||grenadeMode||grenadeLoading||WA.inspectT>=0)return;
  SG.sw=0;SG.swTo=to;SG.swd=false;W.trig=false;W.aim=false;SG.rl=false;sfx('rel')}
function sgApply(on){
  const hs=sgHide();
  if(on){SG.store={mag:W.mag,res:W.res,auto:W.auto};W.mag=SG.mag;W.res=Math.min(SGRESMAX,SG.res);W.auto=false;SG.fl0=fl.position.clone();SG.vis=hs.map(o=>o.visible);hs.forEach(o=>o.visible=false)}
  else{SG.mag=W.mag;SG.res=W.res;W.mag=SG.store.mag;W.res=SG.store.res;W.auto=SG.store.auto;if(SG.fl0)fl.position.copy(SG.fl0);fl.scale.setScalar(1);
    hs.forEach((o,i)=>{o.visible=SG.vis[i]===undefined?true:SG.vis[i]});launcher.visible=launcherEquipped;shells.forEach(q=>q.m.scale.setScalar(1));sgShell.visible=false}
  SG.on=on;SG.rl=false;SG.pumpT=-1;SG.pw=-1;W.rl=false;sgPivot.visible=on;
  updAmmo();feed(on?'WINCHESTER MODEL 12 EQUIPADA':'MK4 EQUIPADA')}
addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='Digit4'||e.code==='Numpad4')sgSwitch(!SG.on)});
document.querySelectorAll('.btn[data-a="wswap"]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();sgSwitch(!SG.on)}));
// ---- por quadro (chamado logo depois de weaponUpdate) ----
function sgUpdate(dt){
  const k=r=>1-Math.exp(-dt*r);let dn=0;
  if(SG.sw>=0){SG.sw+=dt;if(!SG.swd&&SG.sw>=.26){SG.swd=true;sgApply(SG.swTo)}
    dn=SG.sw<.26?ss(0,.26,SG.sw):1-ss(.26,.64,SG.sw);if(SG.sw>=.64)SG.sw=-1;W.cd=Math.max(W.cd,.1)}
  if(SG.on){
    sgHide().forEach(o=>o.visible=false);
    if(W.res>SGRESMAX)W.res=SGRESMAX;
    fl.position.set(0,-.011,-.74);fl.scale.setScalar(1.7);
    // bombeada (automática após o tiro; também ao fim da recarga se a câmara estava vazia)
    if(SG.pw>=0){SG.pw-=dt;if(SG.pw<=0){SG.pw=-1;SG.pumpT=0;SG.pumped=0}}
    let slide=0;
    if(SG.pumpT>=0){SG.pumpT+=dt;const t=SG.pumpT;
      slide=ss(0,.2,t)*(1-ss(.3,.52,t));
      if(t>=.1&&SG.pumped<1){SG.pumped=1;sfx('bolt');if(!SG.rl)eject()}
      if(t>=.46&&SG.pumped<2){SG.pumped=2;sfx('bolt2')}
      if(t>=.6){SG.pumpT=-1;if(SG.needPump)SG.needPump=false}}
    // recarga cartucho por cartucho
    let hand=null,shellVis=false;
    if(SG.rl&&!W.rl){
      SG.ct+=dt;const u=SG.ct/SGC;
      const to1=ss(0,.28,u),to2=ss(.28,.62,u),back=ss(.8,1,u);
      hand=SG_FORE.clone().lerp(SG_POUCH,to1).lerp(SG_PORT,to2).lerp(SG_FORE,back);
      shellVis=u>.2&&u<.78;
      if(u>=.74&&!SG.lastIns){SG.lastIns=true;if(W.mag<SGMAX&&W.res>0){W.mag++;W.res--;sfx('ins');updAmmo()}}
      if(SG.ct>=SGC){SG.ct=0;SG.lastIns=false;
        if(W.mag>=SGMAX||W.res<=0){SG.rl=false;if(SG.needPump||W.mag>0&&SG.needPump){SG.pw=.05}}}
      sgShell.visible=shellVis;
      if(shellVis){const up=ss(.62,.76,u)*.028;sgShell.position.set(hand.x+.002,hand.y+.02+up,hand.z-.03);sgShell.rotation.set(-.2*(1-to2)+.9*to2,.1,.0)}}
    else sgShell.visible=false;
    SG.rp+=((SG.rl?1:0)-SG.rp)*k(9);
    // mão esquerda: no guarda-mão (acompanha a bombeada) ou levando o cartucho
    if(hand)sgLH(hand,-.2*SG.rp,-.28*SG.rp);
    else{const v=SG_FORE.clone();v.z+=.115*slide;sgLH(v,0,0)}
    sgSlide.position.set(0,-.035,-.36+.115*slide);
    // arma inclina na recarga para mostrar a janela de carga
    gun.rotation.z+=-.32*SG.rp;gun.rotation.x+=.22*SG.rp;gun.position.x+=.025*SG.rp;gun.position.y+=.045*SG.rp;
    // mira: a massa de mira da Winchester fica mais baixa que o ponto de mira da MK4
    gun.position.y+=.03*W.ads;
  }
  if(dn>0){gun.position.y-=.30*dn;gun.rotation.x-=.55*dn}}
