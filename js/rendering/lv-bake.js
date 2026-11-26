// [HORNCAM] js/rendering/lv-bake.js
// ===== CÁLCULO DA LUZ EM WORKERS (iluminação híbrida) =====
// O volume de luz do galpão (rendering/light-volume.js) passou a ser 0,5 m, com lâmpada tubular (6 raios de sombra), queda física
// com lóbulo de refletor, rebote difuso + oclusão ambiente e um lightmap fino do piso (8 texels/m). Isso é pesado demais para a
// thread principal, então roda num conjunto de Web Workers (código embutido abaixo, sem arquivo extra e sem build).
// Cada worker recebe a grade fina de oclusão (25 cm) do galpão; a main thread só rasteriza a oclusão e sobe as texturas.
// Layout dos volumes que voltam para a main: i + k*nx + j*nx*nz (igual ao da textura 3D). Lightmap: c + r*tw (c = x, r = z).
function lvWorkerMain(){
  let G=null,V=null,BL=null;
  const CR=4,SX=[-.5,.5,-.3,.3,-.1,.1],SZ=[-.09,.09,.09,-.09,0,0];
  function solidAt(x,y,z){const i=Math.floor((x-G.X0)/G.FS),j=Math.floor(y/G.FS),k=Math.floor((z-G.Z0)/G.FS);if(i<0||j<0||k<0||i>=G.fx||j>=G.fy||k>=G.fz)return 0;return G.occ[i+k*G.fx+j*G.fx*G.fz]}
  // raio com pulo de espaço vazio pela grade grossa (1 m). true = livre
  function clear(ax,ay,az,bx,by,bz){
    const dx=bx-ax,dy=by-ay,dz=bz-az,L=Math.hypot(dx,dy,dz);if(L<.3)return true;const ux=dx/L,uy=dy/L,uz=dz/L,CS=G.CS;let t=.15;
    while(t<L-.15){const x=ax+ux*t,y=ay+uy*t,z=az+uz*t,ci=Math.floor((x-G.X0)/CS),cj=Math.floor(y/CS),ck=Math.floor((z-G.Z0)/CS);
      if(ci<0||cj<0||ck<0||ci>=G.cx||cj>=G.cy||ck>=G.cz){t+=.25;continue}
      if(!G.coarse[ci+ck*G.cx+cj*G.cx*G.cz]){
        const tx=ux>1e-6?(G.X0+(ci+1)*CS-x)/ux:ux<-1e-6?(G.X0+ci*CS-x)/ux:1e9,ty=uy>1e-6?((cj+1)*CS-y)/uy:uy<-1e-6?(cj*CS-y)/uy:1e9,tz=uz>1e-6?(G.Z0+(ck+1)*CS-z)/uz:uz<-1e-6?(G.Z0+ck*CS-z)/uz:1e9;
        t+=Math.min(tx,ty,tz)+.01;continue}
      if(solidAt(x,y,z))return false;t+=.125}
    return true}
  function visTube(l,px,py,pz,ns){let v=0;for(let s=0;s<ns;s++)if(clear(l[0]+SX[s]*l[3],l[1],l[2]+SZ[s],px,py,pz))v++;return v/ns}
  // lâmpada = [x,y,z,comprimento,intensidade]. Queda física (1/d²) com janela suave e lóbulo de refletor voltado para baixo
  function shade(lamps,px,py,pz,ns){let acc=0;
    for(const l of lamps){const dx=px-l[0],dy=py-l[1],dz=pz-l[2],d=Math.hypot(dx,dy,dz);
      if(d>=16)continue;const q=d/16,win=Math.max(0,1-q*q),att=win*win/(1+(d/2.5)*(d/2.5)),c=-dy/d,lobe=.1+.9*(c>0?Math.pow(c,6):0),f=l[4]*att*lobe;if(f<.004)continue;
      acc+=f*visTube(l,px,py,pz,ns)}
    return acc}
  function vol(j){const out=new Float32Array((j.k1-j.k0)*j.nx*j.ny);let o=0;
    for(let k=j.k0;k<j.k1;k++)for(let jj=0;jj<j.ny;jj++)for(let i=0;i<j.nx;i++,o++){
      const px=j.x0+(i+.5)*j.cs,py=(jj+.5)*j.cs,pz=j.z0+(k+.5)*j.cs;
      if(solidAt(px,py,pz))continue;out[o]=shade(j.lamps,px,py,pz,j.ns)}
    return out}
  function floorJob(j){const out=new Float32Array((j.r1-j.r0)*j.tw);
    for(let r=j.r0;r<j.r1;r++){let o=(r-j.r0)*j.tw+j.c0;for(let c=j.c0;c<j.c1;c++,o++){const px=j.x0+(c+.5)/j.tpm,pz=j.z0+(r+.5)/j.tpm;
      if(solidAt(px,.135,pz))continue;out[o]=shade(j.lamps,px,.135,pz,j.ns)}}
    return out}
  const idx=(i,j,k)=>i+k*V.nx+j*V.nx*V.nz;
  // células com centro dentro de sólido herdam a média das vizinhas livres (x.85): a superfície da parede não escurece
  function dilate(out){const {nx,ny,nz}=V,res=new Float32Array(out);
    for(let j=0;j<ny;j++)for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){const c=idx(i,j,k);if(!BL[c])continue;let s=0,n=0;
      for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let e=-1;e<=1;e++){const ii=i+a,jj=j+b,kk=k+e;if(ii<0||jj<0||kk<0||ii>=nx||jj>=ny||kk>=nz)continue;const q=idx(ii,jj,kk);if(!BL[q]){s+=out[q];n++}}
      res[c]=n?s/n*.85:0}
    return res}
  // rebote difuso (difusão a partir das superfícies iluminadas) e oclusão ambiente
  function bounceAO(dil){const {nx,ny,nz}=V,N=dil.length,N6=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    let cur=new Float32Array(N);const ind=new Float32Array(N);
    for(let j=0;j<ny;j++)for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){const c=idx(i,j,k);if(BL[c])continue;let near=j===0;
      if(!near)for(const[a,b,e] of N6){const ii=i+a,jj=j+b,kk=k+e;if(ii<0||jj<0||kk<0||ii>=nx||jj>=ny||kk>=nz||BL[idx(ii,jj,kk)]){near=true;break}}
      cur[c]=near?dil[c]*.3:dil[c]*.03}
    for(let it=0;it<10;it++){const nxt=new Float32Array(N);
      for(let j=0;j<ny;j++)for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){const c=idx(i,j,k);if(BL[c])continue;let sum=cur[c]*2,n=2;
        for(const[a,b,e] of N6){const ii=i+a,jj=j+b,kk=k+e;if(ii<0||jj<0||kk<0||ii>=nx||jj>=ny||kk>=nz)continue;const q=idx(ii,jj,kk);if(!BL[q]){sum+=cur[q];n++}}nxt[c]=sum/n}
      cur=nxt;for(let c=0;c<N;c++)ind[c]+=cur[c]*(it<4?.7:.35)*.8}
    const ao=new Float32Array(N);
    for(let j=0;j<ny;j++)for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){let f=0,n=0;
      for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(let e=-2;e<=2;e++){const ii=i+a,jj=j+b,kk=k+e;if(ii<0||jj<0||kk<0||ii>=nx||jj>=ny||kk>=nz)continue;n++;if(!BL[idx(ii,jj,kk)])f++}
      ao[idx(i,j,k)]=n?Math.pow(f/n,1.6):1}
    return {ao,ind}}
  function init(m){G=m;G.cx=Math.ceil(G.fx/CR);G.cy=Math.ceil(G.fy/CR);G.cz=Math.ceil(G.fz/CR);G.CS=G.FS*CR;
    G.coarse=new Uint8Array(G.cx*G.cy*G.cz);
    for(let j=0;j<G.fy;j++)for(let k=0;k<G.fz;k++)for(let i=0;i<G.fx;i++)if(G.occ[i+k*G.fx+j*G.fx*G.fz])G.coarse[((i/CR)|0)+((k/CR)|0)*G.cx+((j/CR)|0)*G.cx*G.cz]=1;
    V={nx:m.nx,ny:m.ny,nz:m.nz,cs:m.cs,x0:m.X0};BL=new Uint8Array(V.nx*V.ny*V.nz);
    for(let j=0;j<V.ny;j++)for(let k=0;k<V.nz;k++)for(let i=0;i<V.nx;i++)if(solidAt(G.X0+(i+.5)*V.cs,(j+.5)*V.cs,G.Z0+(k+.5)*V.cs))BL[idx(i,j,k)]=1}
  onmessage=e=>{const m=e.data;
    if(m.init){init(m.init);postMessage({ready:1});return}
    const j=m.job,t0=Date.now();let out,tr=[];
    if(j.type==='vol'){out=vol(j);tr=[out.buffer]}
    else if(j.type==='floor'){out=floorJob(j);tr=[out.buffer]}
    else if(j.type==='dil'){out=dilate(j.arr);tr=[out.buffer]}
    else if(j.type==='post'){const base=dilate(j.base),ba=bounceAO(base);out={base,g0:j.g0?dilate(j.g0):null,g1:j.g1?dilate(j.g1):null,ao:ba.ao,ind:ba.ind};
      tr=[out.base.buffer,out.ao.buffer,out.ind.buffer];if(out.g0)tr.push(out.g0.buffer);if(out.g1)tr.push(out.g1.buffer)}
    postMessage({id:m.id,out,ms:Date.now()-t0},tr)};
}
const LVB=(function(){
  const TPM=8,K=14,SRC='('+lvWorkerMain.toString()+')()';
  let url=null,pool=[],curOcc=null;
  function ensure(){if(pool.length)return;url=URL.createObjectURL(new Blob([SRC],{type:'text/javascript'}));
    const n=Math.max(2,Math.min(6,(navigator.hardwareConcurrency||4)-2));for(let i=0;i<n;i++)pool.push(new Worker(url))}
  // entrega a oclusão do galpão para todos os workers (só se mudou desde o último trabalho)
  function setup(job){ensure();if(curOcc===job.occ)return Promise.resolve();curOcc=job.occ;
    return Promise.all(pool.map(w=>new Promise(res=>{w.onmessage=()=>res();const occ=job.occ.slice();
      w.postMessage({init:{occ,X0:job.x0,Z0:job.z0,FS:LV.fs,fx:job.fx,fy:job.fy,fz:job.fz,nx:job.nx,ny:job.ny,nz:job.nz,cs:LV.cs}},[occ.buffer])})))}
  function run(jobs,abort){return new Promise(res=>{if(!jobs.length){res([]);return}
    let next=0,done=0,stop=false;const results=new Array(jobs.length);
    const pump=w=>{if(stop||next>=jobs.length)return;if(abort&&abort()){stop=true;res(null);return}const id=next++;w.onmessage=e=>{results[e.data.id]=e.data.out;done++;if(done===jobs.length)res(results);else pump(w)};w.postMessage({id,job:jobs[id]})};
    pool.forEach(pump)})}
  const lampRow=L=>[L.pos.x,L.pos.y-.12,L.pos.z,LAMPDEF[L.id].sx,K];
  // fatias do volume (por z) e do lightmap (por linha) de um conjunto de luminárias
  function jobsFor(tag,rows,job,ns,fl){const out=[],parts=pool.length*2,nz=job.nz,tw=fl.tw;
    const st=Math.ceil(nz/parts);for(let a=0;a<nz;a+=st)out.push({tag,type:'vol',lamps:rows,ns,cs:LV.cs,nx:job.nx,ny:job.ny,nz,x0:job.x0,z0:job.z0,k0:a,k1:Math.min(nz,a+st)});
    const r0=fl.r0,r1=fl.r1,sr=Math.ceil((r1-r0)/parts);for(let a=r0;a<r1;a+=sr)out.push({tag,type:'floor',lamps:rows,ns,tw,tpm:TPM,x0:fl.x0,z0:fl.z0,c0:fl.c0,c1:fl.c1,r0:a,r1:Math.min(r1,a+sr)});
    return out}
  // monta (por canal) o volume em layout de textura e o lightmap a partir dos pedaços devolvidos
  function gather(jobs,res,tags,job,fl){const nx=job.nx,ny=job.ny,nz=job.nz,vols={},fls={};
    for(const t of tags){vols[t]=new Float32Array(nx*ny*nz);fls[t]=new Float32Array(fl.tw*fl.th)}
    jobs.forEach((j,i)=>{const o=res[i];
      if(j.type==='vol'){const W=vols[j.tag];let p=0;for(let k=j.k0;k<j.k1;k++)for(let jj=0;jj<ny;jj++){const b=k*nx+jj*nx*nz;for(let ii=0;ii<nx;ii++,p++)W[b+ii]=o[p]}}
      else fls[j.tag].set(o,j.r0*fl.tw)});
    return {vols,fls}}
  function floorInfo(job,full,rows){const w=job.floorOrg,tw=40*TPM,th=50*TPM;let c0=0,c1=tw,r0=0,r1=th;
    if(!full){let ax=1e9,bx=-1e9,az=1e9,bz=-1e9;for(const l of rows){ax=Math.min(ax,l[0]);bx=Math.max(bx,l[0]);az=Math.min(az,l[2]);bz=Math.max(bz,l[2])}
      c0=Math.max(0,Math.floor((ax-16-w.x)*TPM));c1=Math.min(tw,Math.ceil((bx+16-w.x)*TPM));r0=Math.max(0,Math.floor((az-16-w.z)*TPM));r1=Math.min(th,Math.ceil((bz+16-w.z)*TPM))}
    return {x0:w.x,z0:w.z,tw,th,c0,c1,r0,r1}}
  // todo acesso ao conjunto de workers é serial (a oclusão de cada worker troca a cada galpão); trabalhos urgentes (luz que mudou) passam na frente do pré-cálculo
  let chain=Promise.resolve(),urgent=0;
  const lock=fn=>{const p=chain.then(fn,fn);chain=p.catch(()=>{});return p};
  const urgentRun=fn=>{urgent++;return lock(fn).finally(()=>{urgent--})};
  // completo: estável + 2 grupos de defeito, cada um com volume e lightmap; depois dilatação, rebote e AO
  function bakeFull(job){return urgentRun(()=>bakeFull0(job))}
  async function bakeFull0(job){
    await setup(job);const G=job.groups,fl=floorInfo(job,true),tags=[],jobs=[];
    for(const t of ['base','g0','g1'])if(G[t].length){tags.push(t);jobs.push(...jobsFor(t,G[t],job,t==='base'?6:3,fl))}
    const res=await run(jobs),g=gather(jobs,res,['base','g0','g1'],job,fl);
    const pj=[{type:'post',base:g.vols.base,g0:G.g0.length?g.vols.g0:null,g1:G.g1.length?g.vols.g1:null}],pr=(await run(pj))[0];
    const zero=new Float32Array(fl.tw*fl.th);
    return {base:pr.base,g0:pr.g0||new Float32Array(pr.base.length),g1:pr.g1||new Float32Array(pr.base.length),ao:pr.ao,ind:pr.ind,lm:[g.fls.base,g.fls.g0,g.fls.g1,zero],lmInfo:{x0:fl.x0,z0:fl.z0,tw:fl.tw,th:fl.th}}}
  // contribuição de UMA luminária, já dilatada, recortada na caixa que ela alcança (16 m); guardada na própria luminária enquanto a oclusão for a mesma
  async function calcEntry(job,L,abort){
    const rows=[lampRow(L)],fl=floorInfo(job,false,rows);if(fl.c1<=fl.c0||fl.r1<=fl.r0){fl.c0=0;fl.c1=1;fl.r0=0;fl.r1=1}
    const jobs=jobsFor('d',rows,job,6,fl),res=await run(jobs,abort);if(!res)return null;
    const g=gather(jobs,res,['d'],job,fl),dr=await run([{type:'dil',arr:g.vols.d}],abort);if(!dr)return null;const dd=dr[0];
    const nx=job.nx,ny=job.ny,nz=job.nz,cs=LV.cs,x=rows[0][0],z=rows[0][2];
    const i0=Math.max(0,Math.floor((x-16-job.x0)/cs)-1),i1=Math.min(nx,Math.ceil((x+16-job.x0)/cs)+1),k0=Math.max(0,Math.floor((z-16-job.z0)/cs)-1),k1=Math.min(nz,Math.ceil((z+16-job.z0)/cs)+1),ci=i1-i0,ck=k1-k0;
    const v=new Float32Array(ci*ck*ny);for(let j=0;j<ny;j++)for(let k=0;k<ck;k++){const a=i0+(k0+k)*nx+j*nx*nz,o=k*ci+j*ci*ck;for(let i=0;i<ci;i++)v[o+i]=dd[a+i]}
    const pw=fl.c1-fl.c0,ph=fl.r1-fl.r0,p=new Float32Array(pw*ph);for(let r=0;r<ph;r++){const a=(fl.r0+r)*fl.tw+fl.c0;for(let c=0;c<pw;c++)p[r*pw+c]=g.fls.d[a+c]}
    return {occ:job.occ,i0,k0,ci,ck,v,c0:fl.c0,r0:fl.r0,pw,ph,p}}
  const valid=(L,job)=>L._lvc&&L._lvc.occ===job.occ;
  // delta: luminárias com contribuição guardada entram na hora; as que faltam são calculadas (em lote) e guardadas
  function bakeDelta(job){return urgentRun(async()=>{
    const es=[],miss=[];for(const L of job.lampsArr){if(valid(L,job))es.push(L._lvc);else miss.push(L)}
    if(!miss.length)return {es};
    await setup(job);
    if(miss.length===1){const e=await calcEntry(job,miss[0]);miss[0]._lvc=e;es.push(e);return {es}}
    const rows=miss.map(lampRow),fl=floorInfo(job,false,rows);if(fl.c1<=fl.c0||fl.r1<=fl.r0){fl.c0=0;fl.c1=1;fl.r0=0;fl.r1=1}
    const jobs=jobsFor('d',rows,job,6,fl),res=await run(jobs),g=gather(jobs,res,['d'],job,fl),dd=(await run([{type:'dil',arr:g.vols.d}]))[0];
    return {es,dd,patch:g.fls.d}})}
  // pré-cálculo em segundo plano (só roda se nada mais estiver pedindo os workers)
  let pfBusy=false;
  function prefetch(job,L){if(pfBusy||urgent||valid(L,job))return;pfBusy=true;
    lock(async()=>{if(urgent)return;await setup(job);const e=await calcEntry(job,L,()=>urgent>0);if(e)L._lvc=e}).catch(()=>{}).finally(()=>{pfBusy=false})}
  const busy=()=>pfBusy||urgent>0;
  return {bakeFull,bakeDelta,prefetch,busy,lampRow,TPM}
})();
