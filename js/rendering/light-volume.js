// [HORNCAM] js/rendering/light-volume.js
// ===== VOLUME DE LUZ DO GALPÃO ATIVO (fases 3-5 do plano) =====
// Grade 3D com a luz das 69 luminárias do galpão onde o jogador está (ver LREG em lamp-registry.js).
// Oclusão: raio de visada de cada luminária até o centro de cada célula, contra uma grade fina (25 cm) montada
// a partir dos chunks voxel (paredes, laje, pilares, caixas). Queda igual à PointLight do Three: (1 - d/alcance)^1.6.
// Os materiais leem a grade em rendering/lv-shader.js. Cálculo sempre em fatias (orçamento por quadro).
//
// Canais (textura RGBA16F), somados no shader com multiplicadores animados (LVU.mul):
//   R = luz estável (todas as luminárias acesas normais)
//   G, B = até 2 luminárias com defeito (piscam: multiplicador = L.f * L.su, sem recalcular nada)
//   A = trecho que acabou de ser ligado (partida escalonada: multiplicador = média de L.su das luminárias)
// Ligar/desligar disjuntor, queimar lâmpada: só se calcula a contribuição das luminárias afetadas (delta).
// Destruição de parede/caixa: recálculo completo, com debounce, depois que os chunks param de mudar.
const LV={
  cs:1,gain:1,fs:.25,margin:6,budget:5,
  wi:-1,ready:false,
  nx:0,ny:0,nz:0,x0:0,y0:0,z0:0,
  base:null,ch:[null,null],tr:null,blocked:null,occ:null,fx:0,fy:0,fz:0,
  badSlots:[-1,-1],trLamps:null,
  job:null,queue:[],snap:null,pollT:0,dirtyT:0,
  pend:null,fade:1,fadeDir:0,PRE:16,NEAR:10,
  v2:{wi:-1,badSlots:[-1,-1]},   // volume secundário (só a textura na GPU): o galpão de onde o jogador saiu
  stats:{ms:0,ticks:0,lamps:0,lit:0,buildMs:0,deltas:0,fulls:0}
};
const LV_HALF_X=20,LV_HALF_Z=25;
// ---- grade fina de oclusão (1 = sólido) ----
function lvRasterChunks(job,tEnd){
  const o=job.occ,fs=LV.fs,fx=job.fx,fy=job.fy,fz=job.fz,fx0=job.x0,fy0=job.y0,fz0=job.z0;
  while(job.ci<job.chunks.length){
    const c=job.chunks[job.ci++];
    const i0=Math.max(0,Math.floor((c.min.x-fx0)/fs)),i1=Math.min(fx-1,Math.floor((c.max.x-fx0)/fs-1e-6)),
          j0=Math.max(0,Math.floor((c.min.y-fy0)/fs)),j1=Math.min(fy-1,Math.floor((c.max.y-fy0)/fs-1e-6)),
          k0=Math.max(0,Math.floor((c.min.z-fz0)/fs)),k1=Math.min(fz-1,Math.floor((c.max.z-fz0)/fs-1e-6));
    for(let j=j0;j<=j1;j++)for(let k=k0;k<=k1;k++)for(let i=i0;i<=i1;i++){
      if(c.a){ // chunk já danificado: consulta o voxel no centro da célula fina
        const wx=fx0+(i+.5)*fs,wy=fy0+(j+.5)*fs,wz=fz0+(k+.5)*fs;
        const vx=Math.floor((wx-c.min.x)/c.vs),vy=Math.floor((wy-c.min.y)/c.vs),vz=Math.floor((wz-c.min.z)/c.vs);
        if(vx<0||vy<0||vz<0||vx>=c.n[0]||vy>=c.n[1]||vz>=c.n[2])continue;
        if(!c.a[vx+vz*c.n[0]+vy*c.n[0]*c.n[2]])continue}
      o[i+k*fx+j*fx*fz]=1}
    if((job.ci&31)===0&&performance.now()>tEnd)return false}
  return true}
function lvOcc(x,y,z){const fs=LV.fs,i=Math.floor((x-LV.x0)/fs),j=Math.floor((y-LV.y0)/fs),k=Math.floor((z-LV.z0)/fs);
  if(i<0||j<0||k<0||i>=LV.fx||j>=LV.fy||k>=LV.fz)return 0;return LV.occ[i+k*LV.fx+j*LV.fx*LV.fz]}
// decoração instanciada (prateleiras, empilhadeiras, mesas...) também bloqueia luz: usa as caixas orientadas do registro de colisão da arma (WCB).
// Só objetos de chão (topo abaixo de 5,8 m e mais altos que 45 cm): estruturas do teto e faixas de tinta não entram.
function lvCollectDecor(x0,z0,w,d){
  const set=new Set(),out=[],C=WC_CELL;
  for(let X=Math.floor(x0/C);X<=Math.floor((x0+w)/C);X++)for(let Z=Math.floor(z0/C);Z<=Math.floor((z0+d)/C);Z++){const a=WCB.get(X+','+Z);if(a)for(const e of a)set.add(e)}
  for(const e of set){const bb=e.bb,h=(bb.max.y-bb.min.y)/e.iy,th=Math.min((bb.max.x-bb.min.x)/e.ix,(bb.max.z-bb.min.z)/e.iz),
      pane=th<.06&&h>=.8&&h<=1.3;   // vidraça de janela (fina): bloqueia a luz, mesmo no alto da parede
    if(!pane&&(h<.45||e.y+bb.max.y/e.iy>5.8))continue;
    const rx=Math.max(Math.abs(bb.min.x),Math.abs(bb.max.x))/e.ix,rz=Math.max(Math.abs(bb.min.z),Math.abs(bb.max.z))/e.iz;
    out.push({e,pane,r:Math.hypot(rx,rz)+.05,y0:e.y+bb.min.y/e.iy,y1:e.y+bb.max.y/e.iy})}
  return out}
function lvRasterDecor(job,tEnd){
  const o=job.occ,fs=LV.fs,fx=job.fx,fy=job.fy,fz=job.fz;
  while(job.di<job.decor.length){
    const d=job.decor[job.di++],e=d.e;if(e.p&&e.p.hid)continue;const bb=e.bb,px=d.pane?fs*.55*e.ix:0,pz=d.pane?fs*.55*e.iz:0; // vidraça de 3 cm engrossada até a célula fina, senão o raio atravessa
    const i0=Math.max(0,Math.floor((e.x-d.r-job.x0)/fs)),i1=Math.min(fx-1,Math.floor((e.x+d.r-job.x0)/fs)),
          k0=Math.max(0,Math.floor((e.z-d.r-job.z0)/fs)),k1=Math.min(fz-1,Math.floor((e.z+d.r-job.z0)/fs)),
          j0=Math.max(0,Math.floor((d.y0-job.y0)/fs)),j1=Math.min(fy-1,Math.floor((d.y1-job.y0)/fs));
    for(let j=j0;j<=j1;j++){const oy=(job.y0+(j+.5)*fs-e.y)*e.iy;if(oy<bb.min.y||oy>bb.max.y)continue;
      for(let k=k0;k<=k1;k++)for(let i=i0;i<=i1;i++){
        const rx=job.x0+(i+.5)*fs-e.x,rz=job.z0+(k+.5)*fs-e.z,ox=(e.c*rx-e.s*rz)*e.ix,oz=(e.s*rx+e.c*rz)*e.iz;
        if(ox>=bb.min.x-px&&ox<=bb.max.x+px&&oz>=bb.min.z-pz&&oz<=bb.max.z+pz)o[i+k*fx+j*fx*fz]=1}}
    if((job.di&31)===0&&performance.now()>tEnd)return false}
  return true}
// ---- trabalhos ----
// completo: reconstrói oclusão e todos os canais. Itens: luminária + vetor de destino (canal)
function lvStartFull(wi){
  const w=WH[wi],m=LV.margin,x0=w.x-LV_HALF_X-m,z0=w.z-LV_HALF_Z-m,nx=Math.ceil((2*LV_HALF_X+2*m)/LV.cs),nz=Math.ceil((2*LV_HALF_Z+2*m)/LV.cs),ny=Math.ceil((H+.5)/LV.cs),
    r=LV.cs/LV.fs,fx=nx*r,fy=ny*r,fz=nz*r,N=nx*ny*nz;
  const chunks=[];for(const c of vchunks){if(c.max.x<x0||c.min.x>x0+nx*LV.cs||c.max.z<z0||c.min.z>z0+nz*LV.cs)continue;chunks.push(c)}
  const base=new Float32Array(N),g0=new Float32Array(N),g1=new Float32Array(N),slots=[-1,-1],items=[];
  let si=0;for(const id of LREG.byWh[wi]){const L=lamps[id];if(L.bad&&!L.dead&&si<2){slots[si]=id;items.push({L,t:si?g1:g0});si++}}
  for(const id of LREG.byWh[wi]){const L=lamps[id];if(slots.indexOf(id)>=0||L.off||!(L.lvI>0))continue;items.push({L,t:base})}
  LV.job={kind:'full',stage:0,wi,N,chunks,ci:0,decor:lvCollectDecor(x0,z0,nx*LV.cs,nz*LV.cs),di:0,items,ii:0,cell:0,t0:performance.now(),base,g0,g1,slots,
    occ:new Uint8Array(fx*fy*fz),x0,y0:0,z0,nx,ny,nz,fx,fy,fz}}
// delta: contribuição de um conjunto de luminárias, aplicada em cima do volume atual
function lvStartDelta(lampsArr,mode){
  const N=LV.nx*LV.ny*LV.nz,dl=new Float32Array(N);
  LV.job={kind:'delta',stage:1,mode,N,items:lampsArr.map(L=>({L,t:dl})),ii:0,cell:0,t0:performance.now(),dl,lamps:lampsArr,
    occ:LV.occ,x0:LV.x0,y0:LV.y0,z0:LV.z0,nx:LV.nx,ny:LV.ny,nz:LV.nz,fx:LV.fx,fy:LV.fy,fz:LV.fz}}
function lvLampSlice(job,tEnd){
  const nx=job.nx,ny=job.ny,nz=job.nz,x0=job.x0,y0=job.y0,z0=job.z0,cs=LV.cs,N=job.N,occ=job.occ,fx=job.fx,fy=job.fy,fz=job.fz,fs=LV.fs,fxz=fx*fz;
  const solid=(x,y,z)=>{const i=Math.floor((x-x0)/fs),j=Math.floor((y-y0)/fs),k=Math.floor((z-z0)/fs);if(i<0||j<0||k<0||i>=fx||j>=fy||k>=fz)return 0;return occ[i+k*fx+j*fxz]};
  while(job.ii<job.items.length){
    const it=job.items[job.ii],L=it.L,ex=L.pos.x,ey=L.pos.y-L.ly,ez=L.pos.z,R=L.lvRange,I=L.lvI,out=it.t;
    for(;job.cell<N;job.cell++){
      const c=job.cell,i=c%nx,k=((c/nx)|0)%nz,j=(c/(nx*nz))|0;
      const px=x0+(i+.5)*cs,py=y0+(j+.5)*cs,pz=z0+(k+.5)*cs,dx=px-ex,dy=py-ey,dz=pz-ez,d2=dx*dx+dy*dy+dz*dz;
      if(d2>=R*R)continue;
      const d=Math.sqrt(d2),f=Math.pow(1-d/R,1.6)*I;if(f<.004)continue;
      let vis=1;const steps=Math.floor((d-.2)/.2);
      if(steps>2){const sx=dx/d*.2,sy=dy/d*.2,sz=dz/d*.2;let qx=ex+sx*2,qy=ey+sy*2,qz=ez+sz*2;
        for(let s=2;s<steps;s++,qx+=sx,qy+=sy,qz+=sz){if(solid(qx,qy,qz)){vis=0;break}}}
      if(vis)out[c]+=f;
      if((c&255)===0&&performance.now()>tEnd){job.cell=c+1;return false}}
    job.cell=0;job.ii++}
  return true}
// células com centro dentro de sólido ficam sem luz; copia a média das vizinhas livres (×.85) para a superfície da parede não escurecer
function lvDilate(out,blocked){
  const nx=LV.nx,ny=LV.ny,nz=LV.nz,res=new Float32Array(out);
  for(let j=0;j<ny;j++)for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){const c=i+k*nx+j*nx*nz;
    if(!blocked[c])continue;let s=0,n=0;
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let e=-1;e<=1;e++){const ii=i+a,jj=j+b,kk=k+e;if(ii<0||jj<0||kk<0||ii>=nx||jj>=ny||kk>=nz)continue;
      const q=ii+kk*nx+jj*nx*nz;if(!blocked[q]){s+=out[q];n++}}
    res[c]=n?s/n*.85:0}
  return res}
function lvFinishFull(job){
  // prepara tudo (oclusão nova, canais dilatados) sem mexer no volume em uso; troca de galpão espera o jogador chegar perto (ver lvTick)
  const nx=job.nx,ny=job.ny,nz=job.nz,cs=LV.cs,bl=new Uint8Array(job.N),fs=LV.fs,fxz=job.fx*job.fz,occ=job.occ;
  for(let j=0;j<ny;j++)for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){
    const ii=Math.floor((job.x0+(i+.5)*cs-job.x0)/fs),jj=Math.floor(((j+.5)*cs)/fs),kk=Math.floor(((k+.5)*cs)/fs);
    if(occ[ii+kk*job.fx+jj*fxz])bl[i+k*nx+j*nx*nz]=1}
  const bak={nx:LV.nx,ny:LV.ny,nz:LV.nz};LV.nx=nx;LV.ny=ny;LV.nz=nz; // lvDilate usa as dimensões de LV
  const res={job,bl,base:lvDilate(job.base,bl),ch:[lvDilate(job.g0,bl),lvDilate(job.g1,bl)]};
  LV.nx=bak.nx;LV.ny=bak.ny;LV.nz=bak.nz;
  LV.job=null;
  if(job.wi===LV.wi&&LV.ready){lvApply(res)}      // mesmo galpão (dano na estrutura): troca direta, sem fade
  else{LV.pend=res;if(!LV.ready)lvApply(res)}}   // outro galpão: espera o jogador chegar perto
// o volume que está saindo de uso vira o secundário (continua piscando; disjuntores ficam congelados): é o que se vê por um buraco na parede ou janela
function lvSnapshot(){
  const prev2=LVU.tex2.value,cur=LVU.tex.value;
  LVU.tex2.value=cur;LVU.org2.value.copy(LVU.org.value);LVU.size2.value.copy(LVU.size.value);LVU.on2.value=1;
  LV.v2={wi:LV.wi,badSlots:LV.badSlots};
  if(prev2&&prev2!==LVU.dummy&&prev2!==cur)prev2.dispose()}
function lvApply(res){
  const job=res.job;LV.pend=null;
  if(LV.ready&&LV.wi!==job.wi)lvSnapshot();
  LV.x0=job.x0;LV.y0=job.y0;LV.z0=job.z0;LV.nx=job.nx;LV.ny=job.ny;LV.nz=job.nz;LV.fx=job.fx;LV.fy=job.fy;LV.fz=job.fz;LV.occ=job.occ;LV.wi=job.wi;
  LV.blocked=res.bl;LV.base=res.base;LV.ch=res.ch;LV.tr=new Float32Array(job.N);LV.trLamps=null;LV.badSlots=job.slots;
  LV.snap=new Uint8Array(lamps.length);for(const id of LREG.byWh[job.wi])LV.snap[id]=lamps[id].off?0:1;
  let lit=0;for(let i=0;i<LV.base.length;i++)if(LV.base[i]>.01)lit++;
  LV.ready=true;LV.stats.lamps=job.items.length;LV.stats.lit=lit;LV.stats.buildMs=performance.now()-job.t0;LV.stats.fulls++;
  lvUpload()}
function lvFinishDelta(job){
  const dd=lvDilate(job.dl,LV.blocked),b=LV.base;
  if(job.mode==='off'){for(let i=0;i<b.length;i++){const v=b[i]-dd[i];b[i]=v>0?v:0}LV.stats.deltas++;lvUpload()}
  else{ // 'on': entra no canal A, com multiplicador animado; ao fim da partida é incorporado ao canal estável
    lvFoldTr();LV.tr=dd;LV.trLamps=job.lamps;LV.stats.deltas++;lvUpload()}
  LV.job=null}
function lvFoldTr(){if(!LV.trLamps)return;const b=LV.base,t=LV.tr;for(let i=0;i<b.length;i++)b[i]+=t[i];LV.tr=new Float32Array(b.length);LV.trLamps=null}
// ---- GPU ----
function lvUpload(){
  const N=LV.base.length,h=new Uint16Array(N*4),f=THREE.DataUtils.toHalfFloat,b=LV.base,g0=LV.ch[0],g1=LV.ch[1],t=LV.tr;
  for(let i=0,o=0;i<N;i++,o+=4){h[o]=f(b[i]);h[o+1]=f(g0[i]);h[o+2]=f(g1[i]);h[o+3]=f(t[i])}
  const tex=new THREE.DataTexture3D(h,LV.nx,LV.nz,LV.ny);tex.format=THREE.RGBAFormat;tex.type=THREE.HalfFloatType;tex.internalFormat='RGBA16F';
  tex.minFilter=tex.magFilter=THREE.LinearFilter;tex.wrapS=tex.wrapT=tex.wrapR=THREE.ClampToEdgeWrapping;tex.unpackAlignment=1;tex.generateMipmaps=false;tex.needsUpdate=true;
  const old=LVU.tex.value;LVU.tex.value=tex;if(old&&old!==LVU.dummy&&old!==LVU.tex2.value)old.dispose();
  LVU.org.value.set(LV.x0,LV.y0,LV.z0);LVU.size.value.set(LV.nx*LV.cs,LV.ny*LV.cs,LV.nz*LV.cs);LVU.cs.value=LV.cs;LVU.gain.value=LV.gain;LVU.on.value=1}
// ---- animação dos multiplicadores (todo quadro, custo desprezível) ----
function lvDyn(){
  const m=LVU.mul.value;m.x=1;m.y=0;m.z=0;
  for(let s=0;s<2;s++){const id=LV.badSlots[s];if(id<0)continue;const L=lamps[id],v=L.off?0:L.f*(L.su===undefined?1:L.su);if(s)m.z=v;else m.y=v}
  const m2=LVU.mul2.value;m2.set(1,0,0,0);for(let s=0;s<2;s++){const id=LV.v2.badSlots[s];if(id<0)continue;const L=lamps[id],v=L.off?0:L.f*(L.su===undefined?1:L.su);if(s)m2.z=v;else m2.y=v}
  if(LV.trLamps){let s=0,n=0,done=true;for(const L of LV.trLamps){if(L.off)continue;n++;s+=(L.su===undefined?1:L.su);if(L.ont!==undefined&&L.ont<.4)done=false}
    m.w=n?s/n:0;if(done){lvFoldTr();lvUpload();m.w=0}}else m.w=0}
// ---- detecção do que mudou ----
function lvPoll(){
  const on=[],off=[],wi=LV.wi;
  for(const id of LREG.byWh[wi]){if(LV.badSlots.indexOf(id)>=0)continue;const L=lamps[id],now=L.off?0:1;
    if(now!==LV.snap[id]){LV.snap[id]=now;(now?on:off).push(L)}}
  if(off.length)LV.queue.push(['off',off]);
  if(on.length)LV.queue.push(['on',on])}
// dano em chunk: marca o volume para recálculo completo depois que as mudanças pararem
function lvDirty(c){
  if(!LV.ready)return;
  if(c.max.x<LV.x0||c.min.x>LV.x0+LV.nx*LV.cs||c.max.z<LV.z0||c.min.z>LV.z0+LV.nz*LV.cs)return;
  LV.dirtyT=performance.now()+700}
// galpão que deve ter o volume: o que contém a câmera; fora de todos, o mais próximo a menos de PRE metros da planta (pré-cálculo na porta)
function lvTarget(){
  const cx=camera.position.x,cz=camera.position.z,wi=LREG.whAt(cx,cz);if(wi>=0)return{wi,d:0};
  let best=-1,bd=LV.PRE;for(const w of WH){const dx=Math.max(Math.abs(cx-w.x)-LV_HALF_X,0),dz=Math.max(Math.abs(cz-w.z)-LV_HALF_Z,0),d=Math.hypot(dx,dz);if(d<bd){bd=d;best=w.i}}
  return{wi:best,d:bd}}
function lvTick(dt){
  const t0=performance.now();dt=dt||.016;
  if(LV.ready)lvDyn();
  // troca de galpão: sem fade. O volume que sai vira o secundário (continua na tela, igual), então não há salto de luz nem tela piscando
  const tg=lvTarget();
  if(LV.pend){
    if(tg.wi!==LV.pend.job.wi)LV.pend=null;                      // o jogador foi para outro lugar: descarta
    else if(tg.d<=LV.NEAR)lvApply(LV.pend);                      // chegou perto da porta: troca direta
  }
  LVU.gain.value=LV.gain;
  if(!LV.job){
    const wi=tg.wi;
    if(wi>=0&&wi!==LV.wi&&!(LV.pend&&LV.pend.job.wi===wi)&&LV.fadeDir===0){LV.queue.length=0;lvStartFull(wi)}
    else if(LV.ready&&LV.dirtyT&&t0>LV.dirtyT){LV.dirtyT=0;LV.queue.length=0;lvFoldTr();lvStartFull(LV.wi)}
    else if(LV.ready){
      LV.pollT-=dt;if(LV.pollT<=0){LV.pollT=.15;lvPoll()}
      if(LV.queue.length){const q=LV.queue.shift();lvFoldTr();lvStartDelta(q[1],q[0])}}
    if(!LV.job)return}
  const job=LV.job,tEnd=t0+LV.budget;
  if(job.kind==='full'&&job.stage===0){if(!lvRasterChunks(job,tEnd)||!lvRasterDecor(job,tEnd)){LV.stats.ticks++;LV.stats.ms+=performance.now()-t0;return}job.stage=1}
  if(job.stage===1){if(!lvLampSlice(job,tEnd)){LV.stats.ticks++;LV.stats.ms+=performance.now()-t0;return}job.stage=2}
  if(job.stage===2){if(job.kind==='full')lvFinishFull(job);else lvFinishDelta(job)}
  LV.stats.ticks++;LV.stats.ms+=performance.now()-t0}
// luz (soma de intensidades) em um ponto do mundo, com os multiplicadores atuais; trilinear. 0 fora do volume ou sem volume pronto
function lvSample(x,y,z){
  if(!LV.ready)return 0;
  const gx=(x-LV.x0)/LV.cs-.5,gy=(y-LV.y0)/LV.cs-.5,gz=(z-LV.z0)/LV.cs-.5;
  if(gx<-.5||gy<-.5||gz<-.5||gx>LV.nx-.5||gy>LV.ny-.5||gz>LV.nz-.5)return 0;
  const i=Math.max(0,Math.min(LV.nx-2,Math.floor(gx))),j=Math.max(0,Math.min(LV.ny-2,Math.floor(gy))),k=Math.max(0,Math.min(LV.nz-2,Math.floor(gz))),
    fx=Math.max(0,Math.min(1,gx-i)),fy=Math.max(0,Math.min(1,gy-j)),fz=Math.max(0,Math.min(1,gz-k)),nx=LV.nx,nxz=LV.nx*LV.nz,
    tri=d=>{const g=(a,b,c)=>d[(i+a)+(k+c)*nx+(j+b)*nxz],l=(b,c)=>g(0,b,c)*(1-fx)+g(1,b,c)*fx;
      return(l(0,0)*(1-fz)+l(0,1)*fz)*(1-fy)+(l(1,0)*(1-fz)+l(1,1)*fz)*fy},m=LVU.mul.value;
  return tri(LV.base)+tri(LV.ch[0])*m.y+tri(LV.ch[1])*m.z+tri(LV.tr)*m.w}
