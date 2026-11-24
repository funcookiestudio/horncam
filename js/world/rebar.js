// [HORNCAM] js/world/rebar.js
// ===== ARMADURA DE AÇO (da Prévia): barras e estribos embutidos no concreto; aparecem quando o concreto é arrancado =====
// Gerada sob demanda, no primeiro dano ao chunk. Barras são cortadas por explosões e por tiros repetidos.
const RBM=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x202020,roughness:.5,metalness:.3,vertexColors:true,side:THREE.DoubleSide}),RB_ST=[.55,.57,.6],RB_RU=[.62,.33,.2];
function genRebar(c){
  if(c.rb||c.type!=='conc'||!c.el)return;
  const L=[],mn=c.min,mx=c.max,cx=(mn.x+mx.x)/2,cy=(mn.y+mx.y)/2,cz=(mn.z+mx.z)/2,
    bar=(x,y,z,ax,len,r,k)=>L.push({c:[x,y,z],ax,len,r,k,h:0});
  if(c.el==='col'){
    const ext=mn.y<.2&&mn.y>.012?mn.y-.006:0; // pilar apoiado no piso: as barras descem através da laje (arranque)
    for(const a of [-1,0,1])for(const b of [-1,0,1]){if(!a&&!b)continue;bar(cx+a*.1,cy-ext/2,cz+b*.1,1,mx.y-mn.y+ext,.009,0)}
    for(let y=mn.y+.1;y<mx.y-.05;y+=.15){bar(cx,y,cz+.115,0,.23,.008,1);bar(cx,y,cz-.115,0,.23,.008,1);bar(cx+.115,y,cz,2,.23,.008,1);bar(cx-.115,y,cz,2,.23,.008,1)}
  }else if(c.el==='bx'||c.el==='bz'){
    const X=c.el==='bx',len=X?mx.x-mn.x:mx.z-mn.z,a0=X?mn.x:mn.z,ax=X?0:2,tx=X?2:0,cw=X?cz:cx;
    for(const d0 of [-1,1])for(const d1 of [-1,1]){const p=[cx,cy+d1*.185,cz];p[tx]=cw+d0*.085;bar(p[0],p[1],p[2],ax,len,.008,0)}
    for(let t=a0+.1;t<a0+len-.05;t+=.2){
      for(const d1 of [-1,1]){const p=[0,cy+d1*.185,0];p[ax]=t;p[tx]=cw;bar(p[0],p[1],p[2],tx,.186,.006,1)}
      for(const d0 of [-1,1]){const p=[0,cy,0];p[ax]=t;p[tx]=cw+d0*.085;bar(p[0],p[1],p[2],1,.386,.006,1)}}
  }else if(c.el==='slab'||c.el==='floor'){const fl_=c.el==='floor';
    for(let z=mn.z+.1;z<mx.z;z+=.2)bar(cx,mx.y-(fl_?.035:.07),z,0,mx.x-mn.x,fl_?.011:.006,0);
    for(let x=mn.x+.1;x<mx.x;x+=.2)bar(x,mx.y-(fl_?.07:.13),cz,2,mx.z-mn.z,fl_?.011:.006,0);
  }
  c.rb=L;rbBuild(c)}
function rbPrune(c){
  if(c.el!=='col'||!c.rb)return;
  const V=c.rb.filter(q=>!q.k),pos=q=>q.pl?[q.pl[(q.pl.length/6|0)*3],q.pl[(q.pl.length/6|0)*3+1],q.pl[(q.pl.length/6|0)*3+2]]:q.c,
    sup=(x,y,z)=>{let n=0;for(const v of V){if(v.pl){if(plDist(v.pl,[x,y,z])<.14)n++}else if(Math.abs(y-v.c[1])<=v.len/2+.02&&Math.hypot(x-v.c[0],z-v.c[2])<.14)n++;if(n>=2)return true}return false};
  const keep=c.rb.filter(q=>{if(!q.k)return true;const p=pos(q);if(sup(p[0],p[1],p[2]))return true;
    if(!q.pl&&c.vs&&Math.random()<.5)deb1(new V3(p[0],p[1],p[2]),new V3(0,1,0),'spark',.006,2,.6);return false});
  if(keep.length!==c.rb.length)c.rb=keep}
function rbBuild(c){
  rbPrune(c);
  if(c.rbm){const i=hitMeshes.indexOf(c.rbm);if(i>=0)hitMeshes.splice(i,1);scene.remove(c.rbm);c.rbm.geometry.dispose();c.rbm=null}
  const P=[],N=[],C=[],I=[];
  for(const s of c.rb){
    if(s.pl){const pl=s.pl,np=pl.length/3;if(np<2)continue;
      const K=s.k?4:6,R_=K==4?s.r*1.4142:s.r,col=s.col||(s.k?RB_RU:RB_ST),off=K==4?.5:0,b0=P.length/3;
      let tx=pl[pl.length-3]-pl[0],ty=pl[pl.length-2]-pl[1],tz=pl[pl.length-1]-pl[2];const tl0=Math.hypot(tx,ty,tz)||1;tx/=tl0;ty/=tl0;tz/=tl0;
      let ux=Math.abs(ty)>.9?1:0,uy=Math.abs(ty)>.9?0:1,uz=0;
      for(let i=0;i<np;i++){
        const a_=Math.max(0,i-1)*3,b_=Math.min(np-1,i+1)*3;tx=pl[b_]-pl[a_];ty=pl[b_+1]-pl[a_+1];tz=pl[b_+2]-pl[a_+2];const tl=Math.hypot(tx,ty,tz)||1;tx/=tl;ty/=tl;tz/=tl;
        const dp=ux*tx+uy*ty+uz*tz;ux-=tx*dp;uy-=ty*dp;uz-=tz*dp;const ul=Math.hypot(ux,uy,uz)||1;ux/=ul;uy/=ul;uz/=ul; // transporte paralelo: sem torção falsa no tubo
        const vx=ty*uz-tz*uy,vy=tz*ux-tx*uz,vz=tx*uy-ty*ux;
        for(let k=0;k<K;k++){const an=(k+off)*6.2832/K,cs=Math.cos(an),sn=Math.sin(an),nx_=ux*cs+vx*sn,ny_=uy*cs+vy*sn,nz_=uz*cs+vz*sn;
          P.push(pl[i*3]+nx_*R_,pl[i*3+1]+ny_*R_,pl[i*3+2]+nz_*R_);N.push(nx_,ny_,nz_);C.push(col[0],col[1],col[2])}}
      for(let i=0;i<np-1;i++)for(let k=0;k<K;k++){const a=b0+i*K+k,b=b0+i*K+(k+1)%K,c2=b0+(i+1)*K+k,d=b0+(i+1)*K+(k+1)%K;I.push(a,b,d,a,d,c2)}
      continue}
    if(s.len<.004)continue;
    const ax=s.ax,u=(ax+1)%3,v=(ax+2)%3,K=s.k?4:6,off=K==4?.5:0,R_=K==4?s.r*1.4142:s.r,col=s.k?RB_RU:RB_ST;
    for(let k=0;k<K;k++){
      const a0=(k+off)*6.2832/K,a1=(k+1+off)*6.2832/K,am=(a0+a1)/2;
      for(const [aa,t] of [[a0,-1],[a1,-1],[a1,1],[a0,1]]){
        const p=[s.c[0],s.c[1],s.c[2]];p[ax]+=t*s.len/2;p[u]+=Math.cos(aa)*R_;p[v]+=Math.sin(aa)*R_;P.push(p[0],p[1],p[2]);
        const nn=[0,0,0];nn[u]=Math.cos(am);nn[v]=Math.sin(am);N.push(nn[0],nn[1],nn[2]);C.push(col[0],col[1],col[2])}
      const b=P.length/3-4;I.push(b,b+1,b+2,b,b+2,b+3)}}
  if(!P.length)return;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  g.setIndex(I);g.computeBoundingSphere();
  const m=new THREE.Mesh(g,RBM);m.userData.steel=c;freezeObj(m);scene.add(m);hitMeshes.push(m);c.rbm=m}
// remove, de cada barra, o trecho que cai dentro da esfera (Pt,R); devolve true se algo foi cortado
function rbCut(c,Pt,R){
  if(!c.rb)return false;
  const out=[],pa=[Pt.x,Pt.y,Pt.z];let ch=false;
  for(const s of c.rb){
    if(s.pl){const runs=clipPL(s.pl,Pt,R);if(!runs){out.push(s);continue}ch=true;for(const r_ of runs)out.push({pl:r_,r:s.r,k:s.k,h:s.h,col:s.col});continue}
    const ax=s.ax,u=(ax+1)%3,v=(ax+2)%3,du=pa[u]-s.c[u],dv=pa[v]-s.c[v],d2=du*du+dv*dv;
    if(d2>=R*R){out.push(s);continue}
    const w=Math.sqrt(R*R-d2),h=s.len/2,lo=pa[ax]-w-s.c[ax],hi=pa[ax]+w-s.c[ax];
    if(hi<-h||lo>h){out.push(s);continue}
    ch=true;const la=lo+h,lb=h-hi;
    if(la>.01){const q=Object.assign({},s,{c:s.c.slice()});q.len=la;q.c[ax]=s.c[ax]-h+la/2;out.push(q)}
    if(lb>.01){const q=Object.assign({},s,{c:s.c.slice()});q.len=lb;q.c[ax]=s.c[ax]+h-lb/2;out.push(q)}}
  if(ch)c.rb=out;return ch}
function cutSteel(P,R){
  for(const c of spatialQuery(spatialVoxels,P.x-R-.1,P.x+R+.1,P.z-R-.1,P.z+R+.1)){
    if(!c.rb||c.max.y<P.y-R-.1||c.min.y>P.y+R+.1)continue;
    if(rbCut(c,P,R))rbBuild(c)}}
// tiro no aço: faíscas; depois de vários acertos a barra se parte (estribos cedem antes)
function steelFx(pt,n,dir,quiet){
  const cosA=Math.max(0,-dir.dot(n)),rf=dir.clone().addScaledVector(n,2*cosA),pa=[pt.x,pt.y,pt.z];
  let bc=null,bs=null,bd=.025;
  for(const c of spatialQuery(spatialVoxels,pt.x-.1,pt.x+.1,pt.z-.1,pt.z+.1)){
    if(!c.rb)continue;
    for(const s of c.rb){if(s.pl){const dd_=plDist(s.pl,pa)-s.r;if(dd_<bd){bd=dd_;bc=c;bs=s}continue}const ax=s.ax,u=(ax+1)%3,v=(ax+2)%3,du=pa[u]-s.c[u],dv=pa[v]-s.c[v],t=Math.max(-s.len/2,Math.min(s.len/2,pa[ax]-s.c[ax])),
        d=Math.hypot(du,dv,pa[ax]-s.c[ax]-t)-s.r;if(d<bd){bd=d;bc=c;bs=s}}}
  if(!quiet){for(let i=0;i<9;i++)deb1(pt,rf,'spark',.007,6,.5);tn(1800+Math.random()*1200,1100,.12,.07,'triangle')}
  if(!bs)return;
  if(++bs.h<(bs.k?6:10))return;
  bs.h=0;
  if(bs.k)bc.rb=bc.rb.filter(q=>q!==bs);else rbCut(bc,pt,.035);
  rbBuild(bc);
  if(!quiet){for(let i=0;i<14;i++)deb1(pt,n,'spark',.009,8,.6);puff(pt,n,.3,0xdcdcd8,1,.4)}}
function steelImpact(h,n,dir){
  const r3=v=>[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)],r4=v=>[+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4)],p=r3(h.point),nn=r4(n),dd=r4(dir);
  steelFx(new V3(...p),new V3(...nn),new V3(...dd),false);
  NET.send({t:'sr',p,n:nn,d:dd})}
// blocos grandes que ficam soltos depois da explosão (sem ligação com o resto do elemento) desabam como entulho
function dropIslands(c,x0,x1,y0,y1,z0,z1,P){
  const nx=c.n[0],ny=c.n[1],nz=c.n[2],a=c.a,vs=c.vs,N=a.length,LIM=c.free?60000:2500,seen=new Uint8Array(N),st=new Int32Array(N);
  x0=Math.max(0,x0-1);y0=Math.max(0,y0-1);z0=Math.max(0,z0-1);x1=Math.min(nx-1,x1+1);y1=Math.min(ny-1,y1+1);z1=Math.min(nz-1,z1+1);
  let sid=0,out=0,sp=0;
  for(let iy=y0;iy<=y1;iy++)for(let iz=z0;iz<=z1;iz++)for(let ix=x0;ix<=x1;ix++){
    const id0=(iy*nz+iz)*nx+ix;if(!a[id0]||seen[id0])continue;
    sid++;const q=[id0];st[id0]=sid;let anch=false;
    for(let h=0;h<q.length&&!anch;h++){
      const id=q[h],x=id%nx,z=((id/nx)|0)%nz,y=(id/(nx*nz))|0;
      if((c.free?y==0:(x==0||y==0||z==0||x==nx-1||y==ny-1||z==nz-1))){anch=true;break}
      for(const o of NBR){const j=((y+o[1])*nz+(z+o[2]))*nx+(x+o[0]);
        if(!a[j]||st[j]==sid)continue;
        if(seen[j]){anch=true;break}
        st[j]=sid;q.push(j);if(q.length>LIM){anch=true;break}}}
    if(anch){for(const id of q)seen[id]=1;continue}
    for(const id of q){a[id]=0;out++;
      if(sp<40&&Math.random()<.04){sp++;const x=id%nx,z=((id/nx)|0)%nz,y=(id/(nx*nz))|0,pt=new V3(c.min.x+(x+.5)*vs,c.min.y+(y+.5)*vs,c.min.z+(z+.5)*vs),dr=pt.clone().sub(P).normalize();dr.y+=.3;deb1(pt,dr.normalize(),dbk(c.dcode||(c.type==='brick'?1:0)),R2(.015,.04),R2(2,6),0)}}}
  return out}
// bola de fogo, fumaça, poeira, clarão e tremor da explosão
const bfx=[],bFl=document.createElement('div');let BSH=0;
bFl.style.cssText='position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:4';document.body.appendChild(bFl);
function bsmk(pos,vel,sz,life,col,op,add){
  if(bfx.length>170)return;
  const s=mkFxSprite(col,op,add);
  s.position.copy(pos);s.scale.setScalar(sz*.4);bfx.push({s,v:vel.clone(),sz,l:life,t:0,op,add})}
const BX={ring:null,sc:[],si:0,rT:9,rR:1};
function bxInit(){if(BX.ring)return;
  const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,3,32,32,32);
  g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(.5,'rgba(12,9,6,.3)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  const mt=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6}),sg=new THREE.PlaneGeometry(2,2);
  for(let i=0;i<6;i++){const m=new THREE.Mesh(sg,mt.clone());m.visible=false;scene.add(m);BX.sc.push({m,t:0})}
  const r=new THREE.Mesh(new THREE.RingGeometry(.82,1,28),new THREE.MeshBasicMaterial({color:0xffe2b0,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  r.visible=false;scene.add(r);BX.ring=r}
function boomExtra(P,R,n){bxInit();
  const nn=n.clone().normalize(),ps=P.clone().addScaledVector(nn,.03),s=BX.sc[BX.si++%BX.sc.length];
  s.m.position.copy(ps);s.m.lookAt(ps.clone().add(nn));s.m.rotateZ(Math.random()*6.28);s.m.scale.setScalar(R*R2(.8,1.1));s.m.material.opacity=.7;s.m.visible=true;s.t=0;  // chamuscado no chão
  const r=BX.ring;r.position.copy(P).addScaledVector(nn,.06);r.lookAt(r.position.clone().add(nn));r.visible=true;BX.rT=0;BX.rR=R;                 // onda de choque
  for(let i=0;i<(isTouch?14:28);i++){const sp=sparks[sk++%sparks.length];sp.m.position.copy(P);                                                      // faíscas (reaproveita o pool)
    sp.v.set(R2(-1,1),R2(.2,1.2),R2(-1,1)).normalize().multiplyScalar(R2(5,12)).addScaledVector(nn,R2(1,4));sp.life=R2(.5,1.1);sp.m.visible=true}}
function boomTick(dt){if(!BX.ring)return;const r=BX.ring;
  if(r.visible){BX.rT+=dt;const u=BX.rT/.45;if(u>=1)r.visible=false;else{r.scale.setScalar(BX.rR*(.3+3.6*Math.sqrt(u)));r.material.opacity=.7*(1-u)*(1-u)}}
  for(const s of BX.sc){if(!s.m.visible)continue;s.t+=dt;const u=s.t/22;if(u>=1){s.m.visible=false;continue}s.m.material.opacity=.7*(u<.5?1:1-(u-.5)/.5)}}
function fxBoom(P,R,n){if(n)boomExtra(P,R,n);
  const dp=P.distanceTo(camera.position),pk=a=>a[Math.random()*a.length|0];
  for(let i=0;i<7;i++){const o=new V3(R2(-1,1),R2(-.6,1),R2(-1,1)).multiplyScalar(R*.45);bsmk(P.clone().add(o),o.clone().multiplyScalar(2.2),R*R2(2.6,3.8),R2(.5,.85),i<2?0xfff0c0:pk([0xff9a30,0xff7418,0xffb860]),1,true)}
  for(let i=0;i<16;i++){const o=new V3(R2(-1,1),R2(-.4,1),R2(-1,1)).multiplyScalar(R*.6);bsmk(P.clone().add(o),o.clone().multiplyScalar(1.6).add(new V3(0,R2(.6,1.6),0)),R*R2(2,3.4),R2(2.4,4.2),pk([0x3a3836,0x4a4744,0x5a5650]),.6)}
  for(let i=0;i<12;i++){const o=new V3(R2(-1,1),R2(-.3,.5),R2(-1,1)).normalize();bsmk(P.clone().addScaledVector(o,R*.7),o.clone().multiplyScalar(R2(3,6)),R*R2(1.6,2.6),R2(1.8,3.2),0xc9c4b8,.55)}
  BSH=Math.max(BSH,Math.min(1.4,12/(dp+3)));
  if(dp<9){bFl.style.transition='none';bFl.style.opacity=String(.75*(1-dp/9));requestAnimationFrame(()=>requestAnimationFrame(()=>{bFl.style.transition='opacity .9s ease-out';bFl.style.opacity='0'}))}}
// A escavação é feita chunk a chunk (lobesChunk): lobesApply faz tudo de uma vez; lobesJob entrega os mesmos chunks, na mesma ordem e com o mesmo
// sorteio, em fatias de tempo (explosão no jogo local não trava o quadro). Resultado idêntico nos dois caminhos.
function lobesChunk(c,st){
  const {lobes,mn,mx,tun,n,kp,v,w,seed}=st;
  {
    if(!c.a){voxAlloc(c);genRebar(c)}
    const hd=c.hard||1,vs=c.vs,bb=vs*.8,nx=c.n[0],ny=c.n[1],nz=c.n[2],a=c.a,fr=c.fr,
      x0=Math.max(0,Math.floor((mn.x-c.min.x)/vs)),x1=Math.min(nx-1,Math.floor((mx.x-c.min.x)/vs)),
      y0=Math.max(0,Math.floor((mn.y-c.min.y)/vs)),y1=Math.min(ny-1,Math.floor((mx.y-c.min.y)/vs)),
      z0=Math.max(0,Math.floor((mn.z-c.min.z)/vs)),z1=Math.min(nz-1,Math.floor((mx.z-c.min.z)/vs));
    let kc=0;
    for(let iy=y0;iy<=y1;iy++)for(let iz=z0;iz<=z1;iz++)for(let ix=x0;ix<=x1;ix++){
      const id=(iy*nz+iz)*nx+ix;if(!a[id])continue;
      v.set(c.min.x+(ix+.5)*vs,c.min.y+(iy+.5)*vs,c.min.z+(iz+.5)*vs);
      let q=-1,dead=false; // q (ruído) é calculado sob demanda: a maioria dos voxels do cubo de busca está longe de qualquer lobo
      for(const lb of lobes){const dd=v.distanceTo(lb[0]);
        if(lb[2]){const R_=lb[1]/hd;if(dd<R_*.8){dead=true;break}if(dd<R_*1.2){const nq=.65*vnz(v.x*6+seed,v.y*6,v.z*6)+.35*vnz(v.x*20+seed,v.y*20,v.z*20);if(dd<R_*(.8+.4*nq)){dead=true;break}}}
        else{const R1=lb[1]/hd;if(dd<Math.max(R1*1.35,bb)){if(q<0)q=vnz(v.x*40+seed,v.y*40,v.z*40);if(dd<Math.max(R1*(.65+.7*q),bb)){dead=true;break}}}}
      if(!dead&&tun){w.copy(v).sub(tun.P0);const t=w.dot(tun.d);if(t>-.01&&t<tun.tl/hd){const d2=w.lengthSq()-t*t,lim=tun.tr/hd*1.4;if(d2<lim*lim){if(q<0)q=vnz(v.x*40+seed,v.y*40,v.z*40);const rt=tun.tr/hd*(.7+.7*q);dead=d2<rt*rt}}}
      if(dead){a[id]=0;kc++;if(kp.length<(ISL?150:40)&&VR()<(ISL?.004:.3)){const k_=v.clone();k_.br=c.dcode||(c.type==='brick'?1:0);kp.push(k_)}
        for(const o of NBR){const X=ix+o[0],Y=iy+o[1],Z=iz+o[2];if(X>=0&&Y>=0&&Z>=0&&X<nx&&Y<ny&&Z<nz)fr[(Y*nz+Z)*nx+X]=1}}}
    if(kc){if(ISL)dropIslands(c,x0,x1,y0,y1,z0,z1,lobes[0][0]);else dropOrphans(c,x0,x1,y0,y1,z0,z1,n);if(DEFER)DIRTY.add(c);else RBQ.add(c)}}}
function lobesList(mn,mx){return vchunks.filter(c=>!(PNT&&!c.paint)&&!(c.max.x<mn.x||c.min.x>mx.x||c.max.y<mn.y||c.min.y>mx.y||c.max.z<mn.z||c.min.z>mx.z))}
function lobesApply(lobes,mn,mx,tun,n){
  const st={lobes,mn,mx,tun,n,kp:[],v:new V3(),w:new V3(),seed:VR()*100};
  for(const c of lobesList(mn,mx))lobesChunk(c,st);
  return st.kp}
function lobesJob(lobes,mn,mx,tun,n,done){ // fatias: captura VR/ISL/PNT desta chamada e os reinstala a cada fatia
  const st={lobes,mn,mx,tun,n,kp:[],v:new V3(),w:new V3(),seed:VR()*100},list=lobesList(mn,mx),vr=VR,isl=ISL,pnt=PNT;let i=0;
  const step=()=>{const sv=VR,si=ISL,sp=PNT;VR=vr;ISL=isl;PNT=pnt;const t0=performance.now();
    try{while(i<list.length&&performance.now()-t0<5)lobesChunk(list[i++],st)}finally{VR=sv;ISL=si;PNT=sp}
    if(i<list.length)requestAnimationFrame(step);else done(st.kp)};
  step()}
function carve(P0,d,n,cnt,graze){
  const k=Math.min(cnt,24),rr=graze?.02:.05+k*.006,tr=graze?0:.03,tl=graze?0:.04+Math.min(cnt,30)*.02,R=rr*4.2+.02;
  const lobes=[[P0.clone().addScaledVector(n,rr*.3),rr]],tA=new V3(Math.abs(n.y)<.9?0:1,Math.abs(n.y)<.9?1:0,0).cross(n).normalize(),tB=n.clone().cross(tA),nl=graze?0:(cnt>2?(VR()*3|0):0);
  for(let i=0;i<nl;i++){const a=VR()*6.283,ds=rr*(.5+VR()*.6),r2=rr*(.3+VR()*.3);lobes.push([P0.clone().addScaledVector(tA,Math.cos(a)*ds).addScaledVector(tB,Math.sin(a)*ds).addScaledVector(n,r2*.4),r2])}
  const e2=P0.clone().addScaledVector(d,tl);
  return lobesApply(lobes,new V3(Math.min(P0.x-R,e2.x-tr),Math.min(P0.y-R,e2.y-tr),Math.min(P0.z-R,e2.z-tr)),new V3(Math.max(P0.x+R,e2.x+tr),Math.max(P0.y+R,e2.y+tr),Math.max(P0.z+R,e2.z+tr)),graze?null:{P0,d,tl,tr},n)}
