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
  cs:.5,gain:1,fs:.25,margin:6,budget:5,errT:0,pfT:0,bScale:1,sum0:1,lm:null,lmInfo:null,ao:null,ind:null,
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
// completo: reconstrói oclusão e todos os canais. A oclusão é rasterizada aqui (em fatias); o cálculo de luz roda em workers (lv-bake.js)
function lvLampRows(ids,pick){return ids.map(id=>lamps[id]).filter(pick).map(L=>LVB.lampRow(L))}
function lvStartFull(wi){
  const w=WH[wi],m=LV.margin,x0=w.x-LV_HALF_X-m,z0=w.z-LV_HALF_Z-m,nx=Math.ceil((2*LV_HALF_X+2*m)/LV.cs),nz=Math.ceil((2*LV_HALF_Z+2*m)/LV.cs),ny=Math.ceil((H+.5)/LV.cs),
    r=LV.cs/LV.fs,fx=nx*r,fy=ny*r,fz=nz*r,N=nx*ny*nz;
  const chunks=[];for(const c of vchunks){if(c.max.x<x0||c.min.x>x0+nx*LV.cs||c.max.z<z0||c.min.z>z0+nz*LV.cs)continue;chunks.push(c)}
  const slots=[-1,-1],groups={base:[],g0:[],g1:[]};
  LREG.BADG[wi].forEach((g,si)=>{if(!g.length)return;slots[si]=Math.min(...g);for(const id of g)groups[si?'g1':'g0'].push(LVB.lampRow(lamps[id]))}); // grupo de defeituosas: um canal, piscam juntas
  for(const id of LREG.byWh[wi]){const L=lamps[id];if((L.bad&&!L.dead)||L.off||!(L.lvI>0))continue;groups.base.push(LVB.lampRow(L))}
  LV.job={kind:'full',stage:0,wi,N,chunks,ci:0,decor:lvCollectDecor(x0,z0,nx*LV.cs,nz*LV.cs),di:0,groups,nLamps:groups.base.length+groups.g0.length+groups.g1.length,t0:performance.now(),slots,
    floorOrg:{x:w.x-LV_HALF_X,z:w.z-LV_HALF_Z},occ:new Uint8Array(fx*fy*fz),x0,y0:0,z0,nx,ny,nz,fx,fy,fz}}
// delta: contribuição de um conjunto de luminárias (volume + lightmap do piso), aplicada em cima do volume atual
function lvStartDelta(lampsArr,mode){
  const w=WH[LV.wi];
  LV.job={kind:'delta',stage:1,mode,lampsArr,lamps:lampsArr,t0:performance.now(),floorOrg:{x:w.x-LV_HALF_X,z:w.z-LV_HALF_Z},
    occ:LV.occ,x0:LV.x0,y0:LV.y0,z0:LV.z0,nx:LV.nx,ny:LV.ny,nz:LV.nz,fx:LV.fx,fy:LV.fy,fz:LV.fz}}
function lvFinishFull(job){
  // prepara tudo (oclusão nova, canais dilatados, rebote/AO, lightmap) sem mexer no volume em uso; troca de galpão espera o jogador chegar perto (ver lvTick)
  const nx=job.nx,ny=job.ny,nz=job.nz,cs=LV.cs,bl=new Uint8Array(job.N),fs=LV.fs,fxz=job.fx*job.fz,occ=job.occ,r=job.res;
  for(let j=0;j<ny;j++)for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){
    const ii=Math.floor(((i+.5)*cs)/fs),jj=Math.floor(((j+.5)*cs)/fs),kk=Math.floor(((k+.5)*cs)/fs);
    if(occ[ii+kk*job.fx+jj*fxz])bl[i+k*nx+j*nx*nz]=1}
  const res={job,bl,base:r.base,ch:[r.g0,r.g1],ao:r.ao,ind:r.ind,lm:r.lm,lmInfo:r.lmInfo};
  job.res=null;LV.job=null;
  if(job.wi===LV.wi&&LV.ready){lvApply(res)}      // mesmo galpão (dano na estrutura): troca direta, sem fade
  else{LV.pend=res;if(!LV.ready)lvApply(res)}}   // outro galpão: espera o jogador chegar perto
// o volume que está saindo de uso vira o secundário (continua piscando; disjuntores ficam congelados): é o que se vê por um buraco na parede ou janela
function lvSnapshot(){
  const prev2=LVU.tex2.value,cur=LVU.tex.value,prevB2=LVU.texB2.value,curB=LVU.texB.value;
  LVU.tex2.value=cur;LVU.texB2.value=curB;LVU.org2.value.copy(LVU.org.value);LVU.size2.value.copy(LVU.size.value);LVU.on2.value=1;
  LV.v2={wi:LV.wi,badSlots:LV.badSlots};
  if(prev2&&prev2!==LVU.dummy&&prev2!==cur)prev2.dispose();
  if(prevB2&&prevB2!==LVU.dummy&&prevB2!==curB)prevB2.dispose()}
function lvApply(res){
  const job=res.job;LV.pend=null;
  if(LV.ready&&LV.wi!==job.wi){lvSnapshot();for(const id of LREG.byWh[LV.wi])lamps[id]._lvc=null}
  LV.x0=job.x0;LV.y0=job.y0;LV.z0=job.z0;LV.nx=job.nx;LV.ny=job.ny;LV.nz=job.nz;LV.fx=job.fx;LV.fy=job.fy;LV.fz=job.fz;LV.occ=job.occ;LV.wi=job.wi;
  LV.blocked=res.bl;LV.base=res.base;LV.ch=res.ch;LV.tr=new Float32Array(job.N);LV.trLamps=null;LV.badSlots=job.slots;
  LV.ao=res.ao;LV.ind=res.ind;LV.lm=res.lm;LV.lmInfo=res.lmInfo;
  LV.snap=new Uint8Array(lamps.length);for(const id of LREG.byWh[job.wi])LV.snap[id]=lamps[id].off?0:1;
  let lit=0,sum=0;for(let i=0;i<LV.base.length;i++){const v=LV.base[i];sum+=v;if(v>.01)lit++}
  LV.sum0=sum>0?sum:1;LV.bScale=1;
  LV.ready=true;LV.stats.lamps=job.nLamps;LV.stats.lit=lit;LV.stats.buildMs=performance.now()-job.t0;LV.stats.fulls++;
  lvUploadB();lvUpload()}
function lvBounce(){let s=0;const b=LV.base;for(let i=0;i<b.length;i++)s+=b[i];LV.bScale=Math.min(1,s/LV.sum0)}   // o rebote acompanha a fração de luz estável que ainda existe
// soma as contribuições guardadas (recortes) e o lote calculado na hora num volume e num lightmap inteiros
function lvComposeDelta(res){
  const nx=LV.nx,ny=LV.ny,nz=LV.nz,li=LV.lmInfo,dd=res.dd?res.dd:new Float32Array(nx*ny*nz),p=res.patch?res.patch:new Float32Array(li.tw*li.th);
  for(const e of res.es){
    for(let j=0;j<ny;j++)for(let k=0;k<e.ck;k++){const a=e.i0+(e.k0+k)*nx+j*nx*nz,o=k*e.ci+j*e.ci*e.ck;for(let i=0;i<e.ci;i++)dd[a+i]+=e.v[o+i]}
    for(let r=0;r<e.ph;r++){const a=(e.r0+r)*li.tw+e.c0,o=r*e.pw;for(let c=0;c<e.pw;c++)p[a+c]+=e.p[o+c]}}
  return {dd,patch:p}}
function lvFinishDelta(job){
  const r=lvComposeDelta(job.res),dd=r.dd,p=r.patch,b=LV.base,L0=LV.lm[0];
  if(job.mode==='off'){
    for(let i=0;i<b.length;i++){const v=b[i]-dd[i];b[i]=v>0?v:0}
    for(let i=0;i<L0.length;i++){const v=L0[i]-p[i];L0[i]=v>0?v:0}
    LV.stats.deltas++;lvBounce();lvUpload()}
  else{ // 'on': entra no canal A, com multiplicador animado; ao fim da partida é incorporado ao canal estável
    lvFoldTr();LV.tr=dd;LV.lm[3]=p;LV.trLamps=job.lamps;LV.stats.deltas++;lvUpload()}
  job.res=null;LV.job=null}
// pré-calcula, em segundo plano, a contribuição de cada luminária do galpão ativo (as mais perto do jogador primeiro): apagar/quebrar vira só uma subtração
function lvPrefetch(){
  const cx=camera.position.x,cz=camera.position.z;let best=null,bd=40;
  for(const id of LREG.byWh[LV.wi]){const L=lamps[id];if((L.bad&&!L.dead)||L.off||!(L.lvI>0)||(L._lvc&&L._lvc.occ===LV.occ))continue;
    const d=Math.hypot(L.pos.x-cx,L.pos.z-cz);if(d<bd){bd=d;best=L}}
  if(best)LVB.prefetch({occ:LV.occ,x0:LV.x0,y0:LV.y0,z0:LV.z0,nx:LV.nx,ny:LV.ny,nz:LV.nz,fx:LV.fx,fy:LV.fy,fz:LV.fz,floorOrg:{x:WH[LV.wi].x-LV_HALF_X,z:WH[LV.wi].z-LV_HALF_Z}},best)}
function lvFoldTr(){if(!LV.trLamps)return;const b=LV.base,t=LV.tr,L0=LV.lm[0],L3=LV.lm[3];
  for(let i=0;i<b.length;i++)b[i]+=t[i];for(let i=0;i<L0.length;i++)L0[i]+=L3[i];
  LV.tr=new Float32Array(b.length);LV.lm[3]=new Float32Array(L0.length);LV.trLamps=null;lvBounce()}
// ---- GPU ----
function lvTex3(h){const tex=new THREE.DataTexture3D(h,LV.nx,LV.nz,LV.ny);tex.format=THREE.RGBAFormat;tex.type=THREE.HalfFloatType;tex.internalFormat='RGBA16F';
  tex.minFilter=tex.magFilter=THREE.LinearFilter;tex.wrapS=tex.wrapT=tex.wrapR=THREE.ClampToEdgeWrapping;tex.unpackAlignment=1;tex.generateMipmaps=false;tex.needsUpdate=true;return tex}
// AO + rebote (textura própria): só muda quando o galpão é recalculado por inteiro
function lvUploadB(){
  const N=LV.ao.length,h=new Uint16Array(N*4),f=THREE.DataUtils.toHalfFloat,a=LV.ao,d=LV.ind;
  for(let i=0,o=0;i<N;i++,o+=4){h[o]=f(a[i]);h[o+1]=f(d[i])}
  const old=LVU.texB.value;LVU.texB.value=lvTex3(h);if(old&&old!==LVU.dummy&&old!==LVU.texB2.value)old.dispose()}
function lvUpload(){
  const N=LV.base.length,h=new Uint16Array(N*4),f=THREE.DataUtils.toHalfFloat,b=LV.base,g0=LV.ch[0],g1=LV.ch[1],t=LV.tr;
  for(let i=0,o=0;i<N;i++,o+=4){h[o]=f(b[i]);h[o+1]=f(g0[i]);h[o+2]=f(g1[i]);h[o+3]=f(t[i])}
  const tex=lvTex3(h);
  const old=LVU.tex.value;LVU.tex.value=tex;if(old&&old!==LVU.dummy&&old!==LVU.tex2.value)old.dispose();
  const li=LV.lmInfo,M=li.tw*li.th,lh=new Uint16Array(M*4),L=LV.lm;
  for(let i=0,o=0;i<M;i++,o+=4){lh[o]=f(L[0][i]);lh[o+1]=f(L[1][i]);lh[o+2]=f(L[2][i]);lh[o+3]=f(L[3][i])}
  const lt=new THREE.DataTexture(lh,li.tw,li.th,THREE.RGBAFormat,THREE.HalfFloatType);lt.internalFormat='RGBA16F';lt.minFilter=lt.magFilter=THREE.LinearFilter;
  lt.wrapS=lt.wrapT=THREE.ClampToEdgeWrapping;lt.generateMipmaps=false;lt.needsUpdate=true;
  const ol=LVU.lm.value;LVU.lm.value=lt;if(ol&&ol!==LVU.dummy2)ol.dispose();
  LVU.lmOrg.value.set(li.x0,li.z0);LVU.lmSize.value.set(li.tw/LVB.TPM,li.th/LVB.TPM);LVU.lmOn.value=1;LVU.bounce.value=LV.bScale;
  LVU.org.value.set(LV.x0,LV.y0,LV.z0);LVU.size.value.set(LV.nx*LV.cs,LV.ny*LV.cs,LV.nz*LV.cs);LVU.cs.value=LV.cs;LVU.gain.value=LV.gain;LVU.on.value=1}
// ---- animação dos multiplicadores (todo quadro, custo desprezível) ----
function lvDyn(){
  const bk=typeof BLK!=='undefined'&&BLK.ph?BLK:null;   // apagão: o brilho do ambiente segue as piscadas
  const m=LVU.mul.value;m.x=bk&&LV.wi===bk.wi?bk.mx:1;m.y=0;m.z=0;
  for(let s=0;s<2;s++){const id=LV.badSlots[s];if(id<0)continue;const L=lamps[id],v=L.off?0:L.f*(L.su===undefined?1:L.su);if(s)m.z=v;else m.y=v}
  const m2=LVU.mul2.value;m2.set(bk&&LV.v2.wi===bk.wi?bk.mx:1,0,0,0);for(let s=0;s<2;s++){const id=LV.v2.badSlots[s];if(id<0)continue;const L=lamps[id],v=L.off?0:L.f*(L.su===undefined?1:L.su);if(s)m2.z=v;else m2.y=v}
  if(LV.trLamps){let s=0,n=0,done=true;for(const L of LV.trLamps){if(L.off)continue;n++;s+=(L.su===undefined?1:L.su);if(L.ont!==undefined&&L.ont<.9)done=false}
    m.w=n?s/n:0;if(done){lvFoldTr();lvUpload();m.w=0}}else m.w=0}
// ---- detecção do que mudou ----
function lvPoll(){
  const on=[],off=[],wi=LV.wi;
  for(const id of LREG.byWh[wi]){if(lamps[id].bad&&!lamps[id].dead)continue;const L=lamps[id],now=L.off?0:1;
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
    if(wi>=0&&wi!==LV.wi&&!(LV.pend&&LV.pend.job.wi===wi)&&LV.fadeDir===0&&t0>LV.errT){LV.queue.length=0;lvStartFull(wi)}
    else if(LV.ready&&LV.dirtyT&&t0>LV.dirtyT&&t0>LV.errT){LV.dirtyT=0;LV.queue.length=0;lvFoldTr();lvStartFull(LV.wi)}
    else if(LV.ready){
      LV.pollT-=dt;if(LV.pollT<=0){LV.pollT=.05;lvPoll()}
      if(LV.queue.length){const q=LV.queue.shift();lvFoldTr();lvStartDelta(q[1],q[0])}
      else if(t0>LV.pfT&&!LVB.busy()){LV.pfT=t0+350;lvPrefetch()}}
    if(!LV.job)return}
  const job=LV.job,tEnd=t0+LV.budget;
  if(job.kind==='full'&&job.stage===0){if(!lvRasterChunks(job,tEnd)||!lvRasterDecor(job,tEnd)){LV.stats.ticks++;LV.stats.ms+=performance.now()-t0;return}job.stage=1}
  if(job.stage===1){
    if(!job.started){job.started=true;(job.kind==='full'?LVB.bakeFull(job):LVB.bakeDelta(job)).then(r=>{job.res=r;job.done=1},e=>{console.error('[LV] falha no cálculo da luz',e);job.done=2})}
    if(!job.done){LV.stats.ticks++;LV.stats.ms+=performance.now()-t0;return}
    if(job.done===2){LV.job=null;LV.errT=performance.now()+4000;return}   // falhou: tenta de novo daqui a pouco
    job.stage=2}
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
