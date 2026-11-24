// [HORNCAM] js/world/twisted-metal.js
// ===== FERRO TORCIDO: vergalhões expostos entortam/torcem (hélice) com a explosão; metal de objetos é deformado =====
const BENT_ST=[.3,.29,.28],BENT_RU=[.34,.2,.14];
function plDist(pl,pa){let best=1e9;
  for(let i=0;i<pl.length-3;i+=3){const ax=pl[i],ay=pl[i+1],az=pl[i+2],dx=pl[i+3]-ax,dy=pl[i+4]-ay,dz=pl[i+5]-az,L=dx*dx+dy*dy+dz*dz,
    t=L>1e-12?Math.max(0,Math.min(1,((pa[0]-ax)*dx+(pa[1]-ay)*dy+(pa[2]-az)*dz)/L)):0,
    d=Math.hypot(pa[0]-ax-dx*t,pa[1]-ay-dy*t,pa[2]-az-dz*t);if(d<best)best=d}
  return best}
// recorta uma polilinha pela esfera (P,R): devolve os trechos de fora, ou null se nada foi cortado
function clipPL(pl,P,R){
  const np=pl.length/3,runs=[],R2_=R*R;let cur=[],hit=false;
  for(let i=0;i<np-1;i++){
    const ax=pl[i*3],ay=pl[i*3+1],az=pl[i*3+2],bx=pl[i*3+3],by=pl[i*3+4],bz=pl[i*3+5],dx=bx-ax,dy=by-ay,dz=bz-az,
      fx=ax-P.x,fy=ay-P.y,fz=az-P.z,A=dx*dx+dy*dy+dz*dz,B=2*(fx*dx+fy*dy+fz*dz),Cc=fx*fx+fy*fy+fz*fz-R2_;
    let t0=0,t1=0,inter=false;
    if(A>1e-12){const disc=B*B-4*A*Cc;if(disc>0){const sq=Math.sqrt(disc);t0=(-B-sq)/(2*A);t1=(-B+sq)/(2*A);if(t1>0&&t0<1)inter=true}}
    else inter=Cc<0;
    if(!inter){if(!cur.length)cur.push(ax,ay,az);cur.push(bx,by,bz);continue}
    hit=true;
    if(t0>0){if(!cur.length)cur.push(ax,ay,az);cur.push(ax+dx*t0,ay+dy*t0,az+dz*t0)}
    if(cur.length>=6)runs.push(cur);cur=[];
    if(t1<1)cur.push(ax+dx*t1,ay+dy*t1,az+dz*t1,bx,by,bz)}
  if(cur.length>=6)runs.push(cur);
  return hit?runs:null}
function bendSteel(P,R){
  const RI=R*1.45,RI2=RI*RI,pa=[P.x,P.y,P.z],sd=vh(P.x,P.y,P.z)*50;let budget=3200;
  for(const c of spatialQuery(spatialVoxels,P.x-RI,P.x+RI,P.z-RI,P.z+RI)){
    if(!c.rb||!c.a||budget<=0||c.max.y<P.y-RI||c.min.y>P.y+RI)continue;
    const vs=c.vs,nx=c.n[0],ny=c.n[1],nz_=c.n[2],mn=c.min,mxv=c.max,a=c.a,
      ex=(x,y,z)=>{
        if(Math.abs(x-mn.x)<.012||Math.abs(x-mxv.x)<.012||y<mn.y+.012||Math.abs(y-mxv.y)<.012||Math.abs(z-mn.z)<.012||Math.abs(z-mxv.z)<.012)return false; // ponta presa na borda do elemento
        const ix=Math.floor((x-mn.x)/vs),iy=Math.floor((y-mn.y)/vs),iz=Math.floor((z-mn.z)/vs);
        return ix<0||iy<0||iz<0||ix>=nx||iy>=ny||iz>=nz_||!a[(iy*nz_+iz)*nx+ix]};
    let ch=false;
    for(let n=0;n<c.rb.length&&budget>0;n++){
      const s=c.rb[n];let pl;
      if(!s.pl){const q0=s.c,hh=vh(q0[0]*13.7+s.ax,q0[1]*13.7,q0[2]*13.7),pr=s.k?.35:(c.el==='floor'||c.el==='slab'?.4:.7);if(hh>pr)continue}
      if(s.pl){
        let near=false;for(let i=0;i<s.pl.length;i+=3){const dx=s.pl[i]-P.x,dy=s.pl[i+1]-P.y,dz=s.pl[i+2]-P.z;if(dx*dx+dy*dy+dz*dz<RI2){near=true;break}}
        if(!near)continue;pl=s.pl.slice()}
      else{
        const ax=s.ax,u=(ax+1)%3,v=(ax+2)%3,du=pa[u]-s.c[u],dv=pa[v]-s.c[v],d2=du*du+dv*dv;if(d2>=RI2)continue;
        const w=Math.sqrt(RI2-d2),h=s.len/2,lo=Math.max(-h,pa[ax]-w-s.c[ax]),hi=Math.min(h,pa[ax]+w-s.c[ax]);if(hi-lo<.05)continue;
        const ns=Math.min(40,Math.max(2,Math.ceil((hi-lo)/(s.k?.06:.07))));
        pl=[];const pt=t=>{const q=s.c.slice();q[ax]+=t;pl.push(q[0],q[1],q[2])};
        if(lo>-h+.01)pt(-h);for(let i=0;i<=ns;i++)pt(lo+(hi-lo)*i/ns);if(hi<h-.01)pt(h)}
      const np=pl.length/3,ext=new Uint8Array(np),dA=new Float32Array(np).fill(99);let any=false;
      for(let i=0;i<np;i++){if(ex(pl[i*3],pl[i*3+1],pl[i*3+2])){ext[i]=1;any=true}else dA[i]=0}
      if(!any)continue; // totalmente embutida no concreto: não entorta
      for(let i=1;i<np;i++)dA[i]=Math.min(dA[i],dA[i-1]+1);
      for(let i=np-2;i>=0;i--)dA[i]=Math.min(dA[i],dA[i+1]+1);
      const mv=new Float32Array(np*3);let moved=false;
      for(let i=0;i<np;i++){
        if(!ext[i])continue;
        const x=pl[i*3],y=pl[i*3+1],z=pl[i*3+2],dx=x-P.x,dy=y-P.y,dz=z-P.z,r=Math.hypot(dx,dy,dz);if(r>=RI)continue;
        const t=1-r/RI,w=t*(.6+.4*t)*Math.min(1,dA[i]/2.5),A=R*.6*w*(c.el==='floor'||c.el==='slab'?.22:1);if(A<.004)continue;
        // direção SEMPRE para fora do centro da explosão (no piso, o "para baixo" é espelhado para cima)
        let ox=dx/(r||1),oy=dy/(r||1),oz=dz/(r||1);if(c.el==='floor')oy=Math.abs(oy);
        // o ruído só varia a INTENSIDADE do empurrão ao longo da barra: ondulação larga + dobras bruscas
        const b0=vnz(x*2.2+sd,y*2.2,z*2.2),k0=vnz(x*7+sd,y*7+3,z*7),
          mag=Math.min(c.el==='floor'||c.el==='slab'?.22:R*.5,A*(.45+1.1*b0+.6*Math.min(1,Math.abs(k0-.5)*2.4)));
        mv[i*3]=ox*mag;mv[i*3+1]=oy*mag;mv[i*3+2]=oz*mag;moved=true}
      if(!moved)continue;
      for(let i=0;i<pl.length;i++)pl[i]+=mv[i];if(c.el==='floor')for(let i=1;i<pl.length;i+=3)if(pl[i]<.03)pl[i]=.03;
      c.rb[n]={pl,r:s.r,k:s.k,h:0,col:s.k?BENT_RU:BENT_ST};ch=true;budget-=np}
    if(ch)rbBuild(c)}}
// metal de objetos (prateleiras, empilhadeiras): a malha é torcida/amassada em volta da explosão
function warpMetal(P,R){
  const RI=R*1.9,list=[];
  for(const c of spatialQuery(spatialVoxels,P.x-RI,P.x+RI,P.z-RI,P.z+RI)){
    if(!c.free||!c.mk||c.mk.charAt(0)!=='d'||c.mk.charAt(1)!=='s')continue;
    const d=Math.hypot(Math.max(c.min.x-P.x,0,P.x-c.max.x),Math.max(c.min.y-P.y,0,P.y-c.max.y),Math.max(c.min.z-P.z,0,P.z-c.max.z));
    if(d<RI)list.push([d,c])}
  list.sort((p,q)=>p[0]-q[0]);
  const sd=vh(P.x,P.y,P.z);
  for(const e of list.slice(0,10)){const c=e[1];
    if(!c.a)voxAlloc(c);
    (c.warps=c.warps||[]).push({x:P.x,y:P.y,z:P.z,R:RI,ang:(sd<.5?-1:1)*(1.3+sd*1.6),amp:R*(c.door?.4:.3),cap:c.door?.5:.4,sd:sd*40});if(c.warps.length>4)c.warps.shift();
    if(DEFER)DIRTY.add(c);else RBQ.add(c)}}
function warpP(c,P){
  if(c.lips)for(const L of c.lips){   // furo de bala em chapa: borda levantada no lado de saída (e leve afundamento na entrada)
    for(let i=0;i<P.length;i+=3){
      const rx=P[i]-L.x,ry=P[i+1]-L.y,rz=P[i+2]-L.z,al=rx*L.dx+ry*L.dy+rz*L.dz,px=rx-L.dx*al,py=ry-L.dy*al,pz=rz-L.dz*al,d=Math.hypot(px,py,pz);
      if(d>.12)continue;const t=1-d/.12,k=t*t*(3-2*t);
      if(al>L.T*.5){const h=.026*k,fl=.007*k/Math.max(d,.01);P[i]+=L.dx*h+px*fl;P[i+1]+=L.dy*h+py*fl;P[i+2]+=L.dz*h+pz*fl}
      else{const h=.008*k;P[i]+=L.dx*h;P[i+1]+=L.dy*h;P[i+2]+=L.dz*h}}}
  for(const w of c.warps){
    for(let i=0;i<P.length;i+=3){
      const x=P[i],y=P[i+1],z=P[i+2],dx=x-w.x,dy=y-w.y,dz=z-w.z,r=Math.hypot(dx,dy,dz);if(r>=w.R)continue;
      const t=1-r/w.R,k=t*t*(3-2*t),A=w.amp*k,
        // campo suave: empurrão radial (para fora do centro), intensidade varia devagar -> a peça entorta inteira, sem rasgar
        mag=Math.min(w.cap||.4,A*(.5+.9*vnz(x*1.4+w.sd,y*1.4,z*1.4)+.2*vnz(x*4+w.sd,y*4,z*4))),
        ii=mag/Math.max(r,w.R*.35); // perto do centro a direção não oscila
      P[i]=x+dx*ii;P[i+1]=Math.max(.1,y+dy*ii);P[i+2]=z+dz*ii}}}

let blastCd=0, blastAmmo=3; // reserva individual: máximo de 3 cargas explosivas
let grenadeMode=false, grenadeLoading=false, grenadeReady=false, grenadeLoadT=0;
function fxVox(dt){
  glassTick(dt);boomTick(dt);tracerTick(dt);blastCd-=dt;BSH*=Math.exp(-dt*2.4);
  for(let i=bfx.length-1;i>=0;i--){const f=bfx[i];f.t+=dt;const u=f.t/f.l;
    if(u>=1){scene.remove(f.s);f.s.material.dispose();bfx.splice(i,1);continue}
    f.s.position.addScaledVector(f.v,dt);f.v.multiplyScalar(Math.max(0,1-dt*(f.add?3:1.1)));if(!f.add)f.v.y+=dt*.5;
    f.s.scale.setScalar(f.sz*(.4+.9*Math.sqrt(u)));
    f.s.material.opacity=f.op*(f.add?Math.pow(1-u,1.6):(u<.15?u/.15:1-(u-.15)/.85))}
  for(let i=debs.length-1;i>=0;i--){const d=debs[i],m=d.m;d.t+=dt;
    if(d.life&&d.t>d.life){scene.remove(m);debs.splice(i,1);continue}
    if(!d.life&&d.t>14){m.scale.multiplyScalar(1-dt*2);if(m.scale.x<.003){scene.remove(m);debs.splice(i,1)}continue}
    if(d.rest)continue;
    d.v.y-=9.8*dt;m.position.addScaledVector(d.v,dt);m.rotation.x+=d.w.x*dt;m.rotation.y+=d.w.y*dt;
    if(m.position.y<d.sz*.6){m.position.y=d.sz*.6;if(d.v.y<-.6){d.v.y*=-.35;d.v.x*=.65;d.v.z*=.65;d.w.multiplyScalar(.6)}else{d.v.set(0,0,0);d.rest=true}}}
  for(let i=puffs.length-1;i>=0;i--){const q=puffs[i];q.t+=dt;const u=q.t/q.l;
    if(u>=1){scene.remove(q.s);q.s.material.dispose();puffs.splice(i,1);continue}
    q.s.scale.setScalar(q.sz*(.3+u*.9));q.s.material.opacity=q.op*(1-u);q.s.position.addScaledVector(q.v,dt)}}
// faíscas de metal: o clarão laranja do impacto (as mesmas partículas de propFx), mais densas que o pó
function metalSparks(pt,n,k){for(let i=0;i<(isTouch?Math.ceil(k*.6):k);i++){const sp=sparks[sk++%sparks.length];sp.m.position.copy(pt);sp.v.set(R2(-1,1),R2(-.2,1.2),R2(-1,1)).multiplyScalar(3).addScaledVector(n,R2(2,6));sp.life=R2(.3,.65);sp.m.visible=true}}
const SMOKE_W=0xdcdcd8; // fumaça padronizada: sempre branca/cinza-clara, qualquer que seja a cor do material atingido
function voxFx(pt,n,dir,cnt,br,seed,quiet,metal){
  const cosA=-dir.dot(n);seedV(seed);
  if(cosA<.3){carve(pt,dir,n,1,true,n);unseedV();if(quiet)return;
    const rf=dir.clone().addScaledVector(n,2*cosA);for(let i=0;i<4;i++)deb1(pt,rf,'spark',.006,6,.35);if(metal)metalSparks(pt,rf,10);puff(pt,n,.25,SMOKE_W);nz(.05,.3,2500,1,3,.2);return}
  const kp=carve(pt,dir,n,br===1?cnt*2+1:cnt,false);unseedV();
  if(quiet)return;
  kp.slice(0,Math.min(4+cnt,14)).forEach(q=>deb1(q,n,dbk(br),R2(.012,.03)*(1+Math.min(cnt,10)*.08),3,0));
  for(let i=0;i<3;i++)deb1(pt,n,'spark',.005,5,.35);
  {   for(let i=0;i<(isTouch?5:10);i++){const sp=sparks[sk++%sparks.length];sp.m.position.copy(pt);sp.v.set(R2(-1,1),R2(0,1),R2(-1,1)).multiplyScalar(2.2).addScaledVector(n,R2(2,5));sp.life=R2(.25,.5);sp.m.visible=true}}
  // poeira de concreto/tijolo: nuvem densa e demorada + fragmentos finos
  if(metal)metalSparks(pt,n,18);
  {const dc=SMOKE_W,k=1+Math.min(cnt,10)*.12;
   for(let i=0;i<5;i++)puff(pt.clone().add(new V3(R2(-.12,.12),R2(-.08,.14),R2(-.12,.12))),n,(.55+Math.min(cnt,10)*.07)*R2(.8,1.4),dc,R2(1.8,3),.6,.15);
   for(let i=0;i<Math.round(8*k);i++)deb1(pt,n,dbk(br),R2(.004,.01),R2(2,5),R2(.5,1.1));}
  nz(.09,.5,900,1,3,.3);tn(120,60,.06,.2)}
function voxImpact(h,n,dir){
  const c=hitChunk(h),cnt=dmgCount(h.point),br=c.dcode||(c.type==='brick'?1:0),seed=(Math.random()*1e9)|0,
    r3=v=>[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)],r4=v=>[+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4)],
    p=r3(h.point),nn=r4(n),dd=r4(dir);
  const mt=(c.hard>=3||c.door||c.rb)?1:0;
  voxFx(new V3(...p),new V3(...nn),new V3(...dd),cnt,br,seed,false,mt);
  NET.send({t:'vi',p,n:nn,d:dd,c:cnt,b:br,s:seed,mt})}
function blast(pt,R,n,seed,quiet){seedV(seed===undefined?(Math.random()*1e9)|0:seed);
  const RA=R*1.25,RP=R*3.7,vr=VR,bA=[new V3(pt.x-RA,pt.y-RA,pt.z-RA),new V3(pt.x+RA,pt.y+RA,pt.z+RA)],bP=[new V3(pt.x-RP,pt.y-RP,pt.z-RP),new V3(pt.x+RP,pt.y+RP,pt.z+RP)];
  const debP=kq=>kq.slice(0,40).forEach(q=>{const dr=q.clone().sub(pt);dr.divideScalar(dr.length()||1);dr.y+=.6;dr.normalize();deb1(q,dr,dbk(q.br),R2(.006,.016),R2(4,10),0)});
  const debA=kp=>kp.slice(0,110).forEach(q=>{const dr=q.clone().sub(pt);dr.divideScalar(dr.length()||1);dr.y+=.35;dr.normalize();deb1(q,dr,dbk(q.br),R2(.03,.09),R2(7,14),0)});
  decBlast(pt,R,quiet);ISL=true;
  if(quiet){ // réplica remota: tudo de uma vez
    lobesApply([[pt,R,1]],bA[0],bA[1],null,n);
    PNT=true;lobesApply([[pt,R,1]],bP[0],bP[1],null,n);PNT=false;
    ISL=false;unseedV();cutSteel(pt,R*.3);bendSteel(pt,R);warpMetal(pt,R);return}
  // jogo local: a escavação (a parte cara) é feita em fatias de ~5 ms por quadro (rebar.js: lobesJob), com a mesma ordem e o mesmo sorteio; o clarão, o som e o dano saem na hora
  lobesJob([[pt,R,1]],bA[0],bA[1],null,n,kp=>{
    {const sv=VR,si=ISL;VR=vr;ISL=true;PNT=true;lobesJob([[pt,R,1]],bP[0],bP[1],null,n,debP);PNT=false;VR=sv;ISL=si} // 2ª passada: manchas de pintura, alcance grande
    cutSteel(pt,R*.3);bendSteel(pt,R);warpMetal(pt,R);
    debA(kp)}); // estilhaços: concreto e tijolo arrancados voam para fora
  ISL=false;unseedV();
  // onda de choque empurra o entulho que já estava no chão
  {const W=R*2.4;for(const d of debs){const dv=d.m.position.clone().sub(pt),l=dv.length();if(l<W&&l>.001){dv.divideScalar(l);const k=1-l/W;d.rest=false;d.v.addScaledVector(dv,9*k).add(new V3(0,3.5*k,0))}}}
  fxBoom(pt,R,n);
  nz(.9,1,260,.8,2,.9);tn(90,28,.6,1);P.landKick=.1;W.rk+=.04;
  {const d=Math.hypot(P.pos.x-pt.x,P.pos.z-pt.z),Rr=4.2;if(d<Rr)hurt(Math.round(80*(1-d/Rr)));}}
function throwBlast(){
  if(blastCd>0||!active)return false;
  if(blastAmmo<=0){feed('SEM MUNIÇÃO EXPLOSIVA · PROCURE UMA CAIXA');return false;}
  camera.updateMatrixWorld(true);rc.setFromCamera({x:0,y:0},camera);
  const h=spatialRaycast(rc,hitMeshes.concat(decorHit),false).find(q=>q.distance<=40)||null;
  const dir=new THREE.Vector3();camera.getWorldDirection(dir);
  const n=h?h.face.normal.clone().transformDirection(h.object.matrixWorld):dir.clone().negate();
  const impact=h?h.point.clone().addScaledVector(n,.12):camera.position.clone().addScaledVector(dir,40);
  blastCd=1.2;blastAmmo=Math.max(0,blastAmmo-1);updAmmo();feed('CARGA EXPLOSIVA '+blastAmmo+'/3');
  const rr=v=>[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)],bp=rr(impact),bn=rr(n),bs=(Math.random()*1e9)|0;
  blast(new V3(...bp),1.6,new V3(...bn),bs);NET.send({t:'bl',p:bp,n:bn,r:1.6,s:bs});return true}
function beginGrenadeMode(){
  if(!active||PH.dead||grenadeMode||grenadeLoading)return;
  if(!launcherEquipped){feed('EQUIPE O LANÇADOR COM A TECLA 3');return;}
  if(blastAmmo<=0){feed('SEM MUNIÇÃO EXPLOSIVA · PROCURE UMA CAIXA');return;}
  grenadeMode=true;grenadeLoading=true;grenadeReady=false;grenadeLoadT=0;W.trig=false;W.tl=false;W.aim=false;updAmmo();
  feed('PREPARANDO MUNIÇÃO EXPLOSIVA');
}
addEventListener('keydown',e=>{if(e.code==='KeyT'&&!e.repeat)beginGrenadeMode()});
document.getElementById('btn-boom').addEventListener('pointerdown',e=>{e.preventDefault();beginGrenadeMode()});
// colisão do jogador com os voxels restantes (buracos viram passagens)
function pushOut(a,b,c0,d){const cx=Math.max(a,Math.min(P.pos.x,b)),cz=Math.max(c0,Math.min(P.pos.z,d)),dx=P.pos.x-cx,dz=P.pos.z-cz,m=Math.hypot(dx,dz);
  if(m<P.r){if(m>1e-4){P.pos.x+=dx/m*(P.r-m);P.pos.z+=dz/m*(P.r-m)}else P.pos.x+=P.r}}
function voxCollide(){
  const r=P.r,px=P.pos.x,pz=P.pos.z,y0=P.y+.2,y1=P.y+P.eye;
  const nearbyVoxels=spatialQuery(spatialVoxels,px-r,px+r,pz-r,pz+r);
  spatialStats.voxelCandidates=nearbyVoxels.size;
  for(const c of nearbyVoxels){
    if(c.min.y>y1||c.max.y<y0||c.max.x<px-r||c.min.x>px+r||c.max.z<pz-r||c.min.z>pz+r)continue;
    if(!c.a){pushOut(c.min.x,c.max.x,c.min.z,c.max.z);continue}
    const vs=c.vs,nx=c.n[0],ny=c.n[1],nz=c.n[2],a=c.a,
      ix0=Math.max(0,Math.floor((px-r-c.min.x)/vs)),ix1=Math.min(nx-1,Math.floor((px+r-c.min.x)/vs)),
      iz0=Math.max(0,Math.floor((pz-r-c.min.z)/vs)),iz1=Math.min(nz-1,Math.floor((pz+r-c.min.z)/vs)),
      iy0=Math.max(0,Math.floor((y0-c.min.y)/vs)),iy1=Math.min(ny-1,Math.floor((y1-c.min.y)/vs));
    for(let iz=iz0;iz<=iz1;iz++)for(let ix=ix0;ix<=ix1;ix++){
      let occ=false;for(let iy=iy0;iy<=iy1;iy++)if(a[(iy*nz+iz)*nx+ix]){occ=true;break}
      if(occ)pushOut(c.min.x+ix*vs,c.min.x+(ix+1)*vs,c.min.z+iz*vs,c.min.z+(iz+1)*vs)}}
  P.pos.x=Math.max(-290,Math.min(510,P.pos.x));P.pos.z=Math.max(-270,Math.min(270,P.pos.z))}
function collide(){collide0();voxCollide();NET.push()}
// Luminárias industriais: somente acesas, apagadas ou uma única lâmpada com falha orgânica no corredor do Galpão 01
const lamps=[],RL=[];
const panelMat=new THREE.MeshBasicMaterial({color:0xdfeaff});
const lampIM=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xdfeaff}),LAMPDEF.length),LAMP_TMP=new THREE.Color();
{const o=new THREE.Object3D();
  LAMPDEF.forEach((d,i)=>{o.position.set(d.x,d.y,d.z);o.scale.set(d.sx,d.sy,d.sz);o.updateMatrix();lampIM.setMatrixAt(i,o.matrix);lampIM.setColorAt(i,LAMP_TMP.setScalar(1));
    const pos=new V3(d.x,d.y,d.z),small=d.real&&d.range<24,L={id:i,pos,l:{position:pos,intensity:0},p:{position:pos,material:{color:{r:1}}},real:!!d.real,range:d.range||24,ly:small?.34:.32,bad:d.mode==='bad',base:small?.9:1.2,ph:d.x*.37+d.z*.11,off:d.mode==='dead',dead:d.mode==='dead',wi:d.wi,cor:d.cor,ont:9,su:1,fz:0,occ:1,occT:1,col:-1,f:1,glitchT:0,glitchHold:0,glitchLevel:1,glitchPhase:0};
    lamps.push(L);if(L.real)RL.push(L)});
  lampIM.frustumCulled=false;lampIM.userData.lampIM=true;lampIM.userData.lampBase=0;scene.add(lampIM);hitMeshes.push(lampIM);
  // (fase 4) sem pool de PointLights: a luz das luminárias vem do volume de luz do galpão ativo (rendering/light-volume.js)
}
