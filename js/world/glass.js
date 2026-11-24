// [HORNCAM] js/world/glass.js
// ===== VIDRO EM VOXELS: trincas radiais + anéis, cacos triangulares que caem (leve: 1 pool instanciado, malhas só sob demanda) =====
const GLP=new Map();
const GMAT=new THREE.MeshStandardMaterial({color:0xb6dcea,roughness:.05,transparent:true,opacity:.3,depthWrite:false}),
  GCRK=new THREE.MeshStandardMaterial({color:0xf4fbff,roughness:.35,emissive:0x1c262c,transparent:true,opacity:.8,depthWrite:false});
// tilintar de vidro: ruído curtíssimo (sem tom, para não lembrar pio de pássaro)
function gTink(g){nz(.03,g,2800+Math.random()*2600,1.2,5,.05,'bandpass')}
const GP_N=240,gp=[],_gm=new THREE.Matrix4(),_gz=new THREE.Matrix4().makeScale(0,0,0),_gq=new THREE.Quaternion(),_gZ=new V3(0,0,1),_gA=new V3(),_ge=new THREE.Euler();
const gpIM=(()=>{const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-.333,-.333,-.5,.667,-.333,-.5,-.333,.667,-.5,-.333,-.333,.5,.667,-.333,.5,-.333,.667,.5],3));
  g.setIndex([0,2,1,3,4,5,0,1,4,0,4,3,1,2,5,1,5,4,2,0,3,2,3,5]);g.computeVertexNormals();
  const m=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:0xd6ecf5,roughness:.06,metalness:.15,transparent:true,opacity:.6,flatShading:true,depthWrite:false,side:THREE.DoubleSide}),GP_N);
  m.frustumCulled=false;return m})();
let gpi=0,gpAct=0;
for(let i=0;i<GP_N;i++){gp.push({on:0,rest:0,done:0,t:0,p:new V3(),v:new V3(),q:new THREE.Quaternion(),w:new V3(),s:new V3(),yaw:0});gpIM.setMatrixAt(i,_gz)}
scene.add(gpIM);
function gShard(pos,vel,sx,sy,th,q0){
  const d=gp[gpi];gpi=(gpi+1)%GP_N;if(!d.on)gpAct++;
  d.on=1;d.rest=0;d.done=0;d.t=0;d.p.copy(pos);d.v.copy(vel);d.s.set(sx,sy,th);
  d.q.copy(q0).multiply(_gq.setFromAxisAngle(_gZ,Math.random()*6.283));
  d.w.set(R2(-7,7),R2(-7,7),R2(-7,7));d.yaw=Math.random()*6.283}
function glassTick(dt){
  gshTick(dt);
  if(!gpAct)return;let chg=false;
  for(let i=0;i<GP_N;i++){const d=gp[i];if(!d.on)continue;
    d.t+=dt;
    if(d.t>30){d.on=0;gpAct--;gpIM.setMatrixAt(i,_gz);chg=true;continue}
    if(d.rest&&d.done)continue;
    if(!d.rest){
      d.v.y-=9.8*dt;d.p.addScaledVector(d.v,dt);
      const wl=d.w.length();if(wl>1e-4){_gq.setFromAxisAngle(_gA.copy(d.w).divideScalar(wl),wl*dt);d.q.premultiply(_gq)}
      if(d.p.y<.1){d.p.y=.1;
        if(d.v.y<-1.2){d.v.y*=-.3;d.v.x*=.55;d.v.z*=.55;d.w.multiplyScalar(.5);if(Math.random()<.5)sndAt(d.p,()=>gTink(.16))}
        else{d.rest=1;d.q.setFromEuler(_ge.set(-Math.PI/2,d.yaw,0,'YXZ'));d.p.y=.102}}}
    else d.done=1;
    _gm.compose(d.p,d.q,d.s);gpIM.setMatrixAt(i,_gm);chg=true}
  if(chg)gpIM.instanceMatrix.needsUpdate=true}
function glassMake(b,hx,hy,hz){
  const thinZ=hz<=hx,W=2*(thinZ?hx:hz),Hh=2*hy,T=Math.max(.02,2*(thinZ?hz:hx)),gv=.02,
    nu=Math.max(3,Math.round(W/gv)),nv=Math.max(3,Math.round(Hh/gv)),
    tU=thinZ?new V3(1,0,0):new V3(0,0,1),up=new V3(0,1,0),N=tU.clone().cross(up),
    G={b,C:new V3(b[0],b[1],b[2]),tU,N,W,Hh,T,nu,nv,su:W/nu,sv:Hh/nv,a:new Uint8Array(nu*nv),hits:0,hl:[],m1:null,m2:null,dead:false,qc:[+b[0].toFixed(3),+b[1].toFixed(3),+b[2].toFixed(3)]};
  G.q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tU,up,N));
  GLP.set(b,G);return G}
// a[]: 0 = vidro inteiro, 2 = removido (buraco). Malha por greedy meshing: só as faces expostas, fundidas em retângulos; bordas de quebra mais claras
const GMV=new THREE.MeshStandardMaterial({color:0xa4dbe6,transparent:true,opacity:.34,roughness:.05,metalness:.1,vertexColors:true,depthWrite:false});
function gmesh(c){
  const nx=c.n[0],ny=c.n[1],nz=c.n[2],a=c.a,fr=c.fr,vs=c.vs,dims=[nx,ny,nz],st=[1,nz*nx,nx],P=[],NM=[],CO=[],IX=[];
  for(let d=0;d<3;d++){
    const u=(d+1)%3,v=(d+2)%3,dd=dims[d],du=dims[u],dv=dims[v],mask=new Int32Array(du*dv);
    for(let sg=-1;sg<=1;sg+=2)for(let k=0;k<dd;k++){
      const kn=k+sg,edge=kn<0||kn>=dd;let any=0;
      for(let j=0;j<dv;j++)for(let i=0;i<du;i++){const bi=k*st[d]+i*st[u]+j*st[v];
        if(a[bi]===0&&(edge||a[bi+sg*st[d]]!==0)){mask[j*du+i]=fr[bi]?2:1;any=1}else mask[j*du+i]=0}
      if(!any)continue;
      for(let j=0;j<dv;j++)for(let i=0;i<du;){
        const m=mask[j*du+i];if(!m){i++;continue}
        let w=1;while(i+w<du&&mask[j*du+i+w]===m)w++;
        let h=1;out:while(j+h<dv){for(let t=0;t<w;t++)if(mask[(j+h)*du+i+t]!==m)break out;h++}
        for(let y=0;y<h;y++)for(let t=0;t<w;t++)mask[(j+y)*du+i+t]=0;
        const b=P.length/3,sh=m===2?1.9:1,kp=k+(sg>0?1:0);
        [[i,j],[i+w,j],[i+w,j+h],[i,j+h]].forEach(([s1,s2])=>{const q=[0,0,0];q[d]=kp;q[u]=s1;q[v]=s2;P.push(c.min.x+q[0]*vs[0],c.min.y+q[1]*vs[1],c.min.z+q[2]*vs[2]);const n=[0,0,0];n[d]=sg;NM.push(n[0],n[1],n[2]);CO.push(sh,sh,sh)});
        if(sg>0)IX.push(b,b+1,b+2,b,b+2,b+3);else IX.push(b,b+2,b+1,b,b+3,b+2);i+=w}}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(NM,3));g.setAttribute('color',new THREE.Float32BufferAttribute(CO,3));g.setIndex(IX);g.computeBoundingSphere();return g}
function glassBuild(G){
  const m0=G.m1;if(m0){const x=hitMeshes.indexOf(m0);if(x>=0)hitMeshes.splice(x,1);scene.remove(m0);m0.geometry.dispose();G.m1=null}
  if(G.dead)return;
  const nu=G.nu,nv=G.nv,a=G.a,fr=new Uint8Array(a.length);let any=0;
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const k=j*nu+i;if(a[k]!==0)continue;any=1;
    if(i>0&&a[k-1]===2||i<nu-1&&a[k+1]===2||j>0&&a[k-nu]===2||j<nv-1&&a[k+nu]===2)fr[k]=1}
  if(!any)return;
  const g=gmesh({n:[nu,nv,1],a,fr,vs:[G.su,G.sv,G.T],min:{x:-G.W/2,y:-G.Hh/2,z:-G.T/2}});
  const m=new THREE.Mesh(g,GMV);m.position.copy(G.C);m.quaternion.copy(G.q);m.userData.glassG=G;m.renderOrder=1;scene.add(m);hitMeshes.push(m);G.m1=m}
function gCell(G,pt){
  const d=pt.clone().sub(G.C),i=Math.floor((d.dot(G.tU)+G.W/2)/G.su),j=Math.floor((d.y+G.Hh/2)/G.sv);
  return [Math.max(0,Math.min(G.nu-1,i)),Math.max(0,Math.min(G.nv-1,j))]}
// cacos de vidro: pedaços sem ligação com a moldura viram malhas próprias que caem, giram e ficam no chão
const GSH=[];let gshN=0;
function gShardMesh(G,comp,dir,quiet){
  let x0=1e9,x1=-1,y0=1e9,y1=-1;const nu=G.nu;
  for(const i of comp){const x=i%nu,y=(i/nu)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(quiet||gshN>=14){for(const i of comp)G.a[i]=2;return}      // limite de cacos novos por impacto (o resto some sem malha)
  const w=x1-x0+1,h=y1-y0+1,a=new Uint8Array(w*h);
  for(const i of comp){a[((i/nu|0)-y0)*w+(i%nu-x0)]=1;G.a[i]=2}
  const lu=(x0+w/2)*G.su-G.W/2,lv=(y0+h/2)*G.sv-G.Hh/2;
  const g=gmesh({n:[w,h,1],a:a.map(v=>v?0:2),fr:new Uint8Array(w*h).fill(1),vs:[G.su,G.sv,G.T],min:{x:x0*G.su-G.W/2-lu,y:y0*G.sv-G.Hh/2-lv,z:-G.T/2}});
  if(!g.index||!g.index.count){g.dispose();return}
  const m=new THREE.Mesh(g,GMV);m.renderOrder=1;m.frustumCulled=false;m.quaternion.copy(G.q);
  m.position.copy(G.C).addScaledVector(G.tU,lu);m.position.y+=lv;scene.add(m);gshN++;
  GSH.push({m,v:dir.clone().multiplyScalar(R2(.2,1)).add(new V3(R2(-.3,.3),R2(0,.4),R2(-.3,.3))),w:new V3(R2(-3,3),R2(-2,2),R2(-3,3)),t:0,rest:false,yaw:Math.random()*6.283,hh:Math.max(w*G.su,h*G.sv)/2});
  if(GSH.length>40){const q=GSH.shift();scene.remove(q.m);q.m.geometry.dispose()}}
function gshTick(dt){
  for(let i=GSH.length-1;i>=0;i--){const q=GSH[i],m=q.m;q.t+=dt;
    if(!q.rest){q.v.y-=9.8*dt;m.position.addScaledVector(q.v,dt);
      const wl=q.w.length();if(wl>1e-4){_gq.setFromAxisAngle(_gA.copy(q.w).divideScalar(wl),wl*dt);m.quaternion.premultiply(_gq)}
      if(m.position.y<=Math.min(q.hh*.7,.25)+.02){m.position.y=.02;m.quaternion.setFromEuler(_ge.set(-Math.PI/2,q.yaw,0,'YXZ'));q.rest=true;q.t=0;
        sndAt(m.position,()=>{nz(.12,.18,4800,2,3,.2,'highpass');if(Math.random()<.6)gTink(.2)})}}
    else if(q.t>14){m.scale.multiplyScalar(1-dt*2);if(m.scale.x<.05){scene.remove(m);m.geometry.dispose();GSH.splice(i,1)}}}}
function gSettle(G,dir,quiet){
  const nu=G.nu,nv=G.nv,a=G.a,seen=new Uint8Array(a.length),stk=[];gshN=0;
  for(let s=0;s<a.length;s++){if(a[s]!==0||seen[s])continue;const comp=[];let anch=false;stk.length=0;stk.push(s);seen[s]=1;
    while(stk.length){const k=stk.pop();comp.push(k);const x=k%nu,y=(k/nu)|0;if(x===0||y===0||x===nu-1||y===nv-1)anch=true;
      if(x>0&&a[k-1]===0&&!seen[k-1]){seen[k-1]=1;stk.push(k-1)}if(x<nu-1&&a[k+1]===0&&!seen[k+1]){seen[k+1]=1;stk.push(k+1)}
      if(y>0&&a[k-nu]===0&&!seen[k-nu]){seen[k-nu]=1;stk.push(k-nu)}if(y<nv-1&&a[k+nu]===0&&!seen[k+nu]){seen[k+nu]=1;stk.push(k+nu)}}
    if(!anch)gShardMesh(G,comp,dir,quiet)}}
// regiões de vidro inteiro delimitadas por trincas (flood fill 4-vizinhos)
function gRegions(G,cx,cy){
  const nu=G.nu,nv=G.nv,a=G.a,seen=new Uint8Array(a.length),out=[],stk=[];
  for(let s=0;s<a.length;s++){
    if(a[s]!==0||seen[s])continue;
    let edge=false,n=0,x0=nu,x1=0,y0=nv,y1=0,d2=1e9;const cells=[];
    stk.length=0;stk.push(s);seen[s]=1;
    while(stk.length){const k=stk.pop(),i=k%nu,j=(k/nu)|0;cells.push(k);n++;
      if(i===0||j===0||i===nu-1||j===nv-1)edge=true;
      if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j;
      const dd=(i-cx)*(i-cx)+(j-cy)*(j-cy);if(dd<d2)d2=dd;
      if(i>0&&a[k-1]===0&&!seen[k-1]){seen[k-1]=1;stk.push(k-1)}
      if(i<nu-1&&a[k+1]===0&&!seen[k+1]){seen[k+1]=1;stk.push(k+1)}
      if(j>0&&a[k-nu]===0&&!seen[k-nu]){seen[k-nu]=1;stk.push(k-nu)}
      if(j<nv-1&&a[k+nu]===0&&!seen[k+nu]){seen[k+nu]=1;stk.push(k+nu)}}
    out.push({cells,n,edge,x0,x1,y0,y1,d2})}
  return out}
function gSpawn(G,r,vel0,spread){
  const u=(r.x0+r.x1+1)/2*G.su-G.W/2,v=(r.y0+r.y1+1)/2*G.sv-G.Hh/2,pos=G.C.clone().addScaledVector(G.tU,u);pos.y+=v;
  const sx=Math.max(.02,(r.x1-r.x0+1)*G.su*1.15),sy=Math.max(.02,(r.y1-r.y0+1)*G.sv*1.15),
    vel=vel0.clone().add(new V3(R2(-spread,spread),R2(.1,.9),R2(-spread,spread)));
  gShard(pos,vel,sx,sy,G.T,G.q)}
function glassCollapse(G,dir,quiet){
  if(!quiet){let sp=0;for(const r of gRegions(G,0,0)){if(sp++>=32)break;gSpawn(G,r,dir.clone().multiplyScalar(R2(.3,1.4)),.7)}
    nz(.35,.6,5500,2,2.2,.25,'highpass');nz(.12,.25,2600,1.5,4,.15,'bandpass')}
  G.dead=true;glassBuild(G)}
function glassHit(G,pt,dir,seed,quiet){
  if(G.dead)return;
  seedV(seed);G.hits++;
  const rr=(a,b)=>a+VR()*(b-a),nu=G.nu,nv=G.nv,a=G.a,cc=gCell(G,pt),cx=cc[0]+.5,cy=cc[1]+.5;
  let e=G.hl.find(q=>Math.hypot(q.x-cx,q.y-cy)<9);if(e)e.c++;else{e={x:cx,y:cy,c:1};G.hl.push(e)}const c=e.c;
  const kill=(x,y)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=nu||y>=nv)return;a[y*nu+x]=2};
  const disc=(x,y,r)=>{const q=Math.ceil(r);for(let j=-q;j<=q;j++)for(let i=-q;i<=q;i++)if(i*i+j*j<=r*r)kill(x+i,y+j)};
  const line=(an,L)=>{for(let t=0;t<L;t+=.5)kill(cx+Math.cos(an)*t,cy+Math.sin(an)*t)};
  disc(cx,cy,1.2+Math.min(c,8)*.5);
  const nr=5+(VR()*4|0);
  for(let k=0;k<nr;k++){const an=k/nr*6.283+rr(-.3,.3),L=rr(10,28)+c*3;line(an,L);
    if(VR()<.5){const t=rr(.3,.7)*L,bx=cx+Math.cos(an)*t,by=cy+Math.sin(an)*t,ba=an+rr(-.9,.9),bL=L*.4;
      for(let u=0;u<bL;u+=.5)kill(bx+Math.cos(ba)*u,by+Math.sin(ba)*u)}}
  if(c>=2){const Rr=rr(6,16)+c*2,s0=rr(0,6.28),len=rr(2.5,5);for(let q=0;q<len;q+=1/Rr)kill(cx+Math.cos(s0+q)*Rr,cy+Math.sin(s0+q)*Rr)}
  if(c>=3)disc(cx,cy,5+c*2.5);
  unseedV();
  gSettle(G,dir,quiet);
  if(!quiet){for(let i=0;i<8;i++){const p=pt.clone();gShard(p,dir.clone().multiplyScalar(R2(.5,2)).add(new V3(R2(-.6,.6),R2(0,1),R2(-.6,.6))),R2(.012,.03),R2(.012,.03),G.T,G.q)}
    if(G.hits===1){nz(.1,.4,4500,1,2.5,.2,'highpass');nz(.05,.3,3400,1.5,4,.1,'bandpass')}else{nz(.07,.3,5000,1,3,.15,'highpass')}}
  let alive=0;for(let k=0;k<a.length;k++)if(a[k]===0)alive++;
  if(alive<a.length*.05)glassCollapse(G,dir,quiet);else glassBuild(G)}
function glassBlast(G,pt,R,d,quiet){
  if(G.dead)return;G.dead=true;glassBuild(G);
  if(quiet)return;
  let alive=0;for(let k=0;k<G.a.length;k++)if(G.a[k]===0)alive++;
  const f=Math.max(.15,1-d/(R*2.2)),n=Math.min(38,Math.round(G.W*G.Hh*16*alive/G.a.length)+4);
  for(let i=0;i<n;i++){
    const pos=G.C.clone().addScaledVector(G.tU,R2(-.5,.5)*G.W);pos.y+=R2(-.5,.5)*G.Hh;
    const sz=Math.sqrt(G.W*G.Hh/Math.max(8,n))*R2(.5,1.5),dv=pos.clone().sub(pt);dv.y+=.4;dv.normalize();
    gShard(pos,dv.multiplyScalar(R2(3,9)*f).add(new V3(R2(-1,1),R2(0,2),R2(-1,1))),sz,sz*R2(.6,1.3),G.T,G.q)}
  nz(.35,.6,5500,2,2.2,.25,'highpass');nz(.12,.25,2600,1.5,4,.15,'bandpass')}
function glassImpact(h,n,dir){
  const G=h.object.userData.glassG;if(!G||G.dead)return;
  const r3=v=>[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)],r4=v=>[+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4)],
    p=r3(h.point),nn=r4(n),dd=r4(dir),cnt=dmgCount(h.point),s=(Math.random()*1e9)|0;
  decFx('g',G.qc,p,nn,dd,cnt,s,false);NET.send({t:'di',k:'g',q:G.qc,p,n:nn,d:dd,c:cnt,s})}

