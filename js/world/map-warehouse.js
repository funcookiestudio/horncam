// [HORNCAM] js/world/map-warehouse.js
// ===== MAPA: ARMAZÉM LOGÍSTICO 40x50 m (estrutura voxel destrutível + decoração instanciada) =====
const decorHit=[],DECK={},DGRID=new Map();
const LAMPDEF=[],BRK=[];
// sorteio estável por lâmpada (igual para todos os jogadores): ~97% boas, 2% queimadas, 1% piscando/faiscando
function lampRoll(w,x,z,y){let h=(Math.imul(w+1,73856093)^Math.imul(Math.round(x*10)+1000,19349663)^Math.imul(Math.round(z*10)+1000,83492791)^Math.imul(Math.round(y*10)+7,2654435761))>>>0;
  h=Math.imul(h^h>>>15,2246822507)>>>0;h=Math.imul(h^h>>>13,3266489909)>>>0;return((h^h>>>16)>>>0)/4294967296}
const WH=[];[-104,-52,0,52,104].forEach((x,k)=>WH.push({x,z:66,s:1,i:k}));[-104,-52,0,52,104].forEach((x,k)=>WH.push({x,z:-66,s:-1,i:5+k}));
const SPAWN_LIST=[];[[0,21],[0,-21],[-19,5],[15,5],[-6,20],[5,-19.5]].forEach(p=>[2,7,0,9,4,5,1,8,3,6].forEach(i=>{const w=WH[i];SPAWN_LIST.push([w.x+w.s*p[0],w.z+w.s*p[1]])}));
(function buildMap(){
  let WX=0,WZ=0,WS=1,SQ=11,SLAB_SM=null;
  const LMODE={1:'dead',3:'dead',8:'dead',4:'bad'}; // estados permitidos: acesa, apagada ou a única lâmpada defeituosa
  let activeWarehouse=0;
  const LD=(x,y,z,sx,sy,sz,mode,real,range)=>{
    // Um único reator defeituoso em todo o complexo: corredor do Galpão 01.
    // As duas luminárias vizinhas desse corredor ficam apagadas.
    // 1% pisca e solta faísca, 2% queimadas, 97% boas (sorteio fixo por lâmpada)
    const rr=lampRoll(activeWarehouse,x,z,y);
    mode=rr<.01?'bad':rr<.03?'dead':'on';
    // corredor = linha de luminárias em x (0..6); 7 = escritório (luminárias baixas)
    const cor=y<4?7:Math.max(0,Math.min(6,Math.round((x+15)/5)));
    LAMPDEF.push({x:TX(x),y,z:TZ(z),sx,sy,sz,mode,real,range,wi:activeWarehouse,cor})
  };
  const TX=x=>WX+WS*x,TZ=z=>WZ+WS*z,TR=r=>r+(WS<0?Math.PI:0);
  const sr=()=>(SQ=(SQ*16807)%2147483647)/2147483647;
  const DEC={};
  function D(k,x,y,z,sx,sy,sz,col,ry){x=TX(x);z=TZ(z);ry=TR(ry||0);const bb=y-sy/2;if(bb<.095&&bb>-.02)y+=.1;(DEC[k]=DEC[k]||[]).push([x,y,z,sx,sy,sz,col,ry])}
  function flushDec(){
    const BXG=new THREE.BoxGeometry(1,1,1),WHG=new THREE.CylinderGeometry(.5,.5,1,12).rotateZ(Math.PI/2),CYG=new THREE.CylinderGeometry(.5,.5,1,12),
      metal=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.45,metalness:.25}),
      T={m:[BXG,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85})],s:[BXG,metal],t:[WHG,metal],c:[CYG,metal],
        f:[BXG,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92})],w:[BXG,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95})],
        g:[BXG,new THREE.MeshStandardMaterial({color:0xaad0e0,roughness:.05,transparent:true,opacity:.3,depthWrite:false})],l:[BXG,new THREE.MeshBasicMaterial({color:0xfff2d6})]},
      o=new THREE.Object3D(),c=new THREE.Color();
    for(const k in DEC){const L=DEC[k];
      // lotes por célula espacial com frustum culling próprio (antes: 1 lote global com frustumCulled=false = ~480 mil triângulos/quadro)
      const parts=batchInstanced(T[k][0],T[k][1],L,b=>[b[0],b[1],b[2],Math.hypot(b[3],b[4],b[5])/2],
        (im,j,b)=>{o.position.set(b[0],b[1],b[2]);o.rotation.set(0,b[7],0);o.scale.set(b[3],b[4],b[5]);o.updateMatrix();im.setMatrixAt(j,o.matrix);im.setColorAt(j,c.setHex(b[6]))});
      for(const im of parts.ims){im.castShadow=k!='g'&&k!='l'&&k!='f'&&k!='w';im.receiveShadow=true;scene.add(im);
        if(k!='l'&&k!='f'&&k!='w')decorHit.push(im);
        if(k==='m'||k==='s'||k==='g')im.userData.decK=k}
      if(k==='m'||k==='s'||k==='g'){DECK[k]={part:parts.part,L};L.forEach((b,i)=>{const key=Math.floor(b[0]/4)+','+Math.floor(b[2]/4);let a=DGRID.get(key);if(!a)DGRID.set(key,a=[]);a.push([k,i]);
        // faixa de tinta no piso (comprida e fina): registra em TODAS as células que ela cobre, senão a explosão só a acharia pelo centro
        if(k==='s'&&b[4]<=.03&&b[1]<.2){const q=Math.round(b[7]/(Math.PI/2)),od=Math.abs(q)%2===1,ex=(od?b[5]:b[3])/2,ez=(od?b[3]:b[5])/2,
          cx0=Math.floor((b[0]-ex)/4),cx1=Math.floor((b[0]+ex)/4),cz0=Math.floor((b[2]-ez)/4),cz1=Math.floor((b[2]+ez)/4);
          if((cx1-cx0+1)*(cz1-cz0+1)<=400)for(let X=cx0;X<=cx1;X++)for(let Z=cz0;Z<=cz1;Z++){const kk=X+','+Z;if(kk===key)continue;let a2=DGRID.get(kk);if(!a2)DGRID.set(kk,a2=[]);a2.push([k,i])}}})}}}
  function sign(t,x,y,z,ry,w,h,bg,fg){const c=document.createElement('canvas');c.width=256;c.height=Math.round(256*h/w);const g=c.getContext('2d'),ls=t.split('\n');
    g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.strokeStyle=fg;g.lineWidth=5;g.strokeRect(5,5,c.width-10,c.height-10);g.fillStyle=fg;
    g.font='bold '+Math.floor(c.height/(ls.length+.9))+'px sans-serif';g.textAlign='center';g.textBaseline='middle';
    ls.forEach((s,i)=>g.fillText(s,c.width/2,c.height*(i+1)/(ls.length+1),c.width-14));
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texQ(new THREE.CanvasTexture(c)),roughness:.96,metalness:0,emissive:0x000000,emissiveIntensity:0,toneMapped:true}));m.position.set(TX(x),y,TZ(z));m.rotation.y=TR(ry);scene.add(m);return m}
  const TB=(x0,y0,z0,x1,y1,z1,...r)=>{const a=TX(x0),b=TX(x1),c=TZ(z0),d=TZ(z1);block(Math.min(a,b),y0,Math.min(c,d),Math.max(a,b),y1,Math.max(c,d),...r)};
  function buildOne(w){activeWarehouse=w.i;WX=w.x;WZ=w.z;WS=w.s;
  const G=[-20,-15,-10,-5,0,5,10,15,20],GZ=[-25,-20,-15,-10,-5,0,5,10,15,20,25],TW=.94,SL=.25,BT=.14,by=H-SL-.225;
  const sol=(x0,x1,z0,z1)=>{const a=TX(x0),b=TX(x1),c=TZ(z0),d=TZ(z1);solids.push({minX:Math.min(a,b),maxX:Math.max(a,b),minZ:Math.min(c,d),maxZ:Math.max(c,d)})};
  const cols=[];G.forEach(x=>GZ.forEach(z=>cols.push([x,z])));
  // piso industrial (laje de fundação, não destrutível)
  if(!SLAB_SM){const rc_=document.createElement('canvas');rc_.width=1024;rc_.height=1280;const rg=rc_.getContext('2d');
    rg.fillStyle='rgb(62,62,62)';rg.fillRect(0,0,1024,1280);
    for(let i=0;i<260;i++){const x=Math.random()*1024,y=Math.random()*1280,r=30+Math.random()*110,g=rg.createRadialGradient(x,y,0,x,y,r),v=45+Math.random()*60|0;
      g.addColorStop(0,'rgba('+v+','+v+','+v+',.35)');g.addColorStop(1,'rgba('+v+','+v+','+v+',0)');rg.fillStyle=g;rg.fillRect(x-r,y-r,r*2,r*2)}
    rg.fillStyle='rgb(190,190,190)';for(let k=0;k<=8;k++)rg.fillRect(k*1024/8-1.5,0,3,1280);for(let k=0;k<=10;k++)rg.fillRect(0,k*1280/10-1.5,1024,3);
    const rt_=texQ(new THREE.CanvasTexture(rc_));
    SLAB_SM=new THREE.MeshStandardMaterial({color:0x8e9092,roughness:1,roughnessMap:rt_,metalness:.12});}
  CUR_EL='floor';block(WX-20.5,0,WZ-25.5,WX+20.5,.1,WZ+25.5,'conc','floor',8,1,8);CUR_EL=null; // piso destrutível, 2,5x mais duro
  // laje de cobertura, vigas e pilares (concreto armado voxelizado)
  CUR_EL='slab';TB(-20.15,H-SL,-25.15,20.15,H,25.15,'conc','conc',8,1,8);
  CUR_EL='bx';GZ.forEach(z=>TB(-20,by-.225,z-.125,20,by+.225,z+.125,'conc','conc',10,1,1));
  CUR_EL='bz';G.forEach(x=>TB(x-.125,by-.225,-25,x+.125,by+.225,25,'conc','conc',1,1,10));
  CUR_EL='col';cols.forEach(q=>TB(q[0]-.15,0,q[1]-.15,q[0]+.15,H-SL,q[1]+.15,'conc','conc',.6,8,.6));CUR_EL=null;
  // paredes de tijolo entre pilares; ops = [a,b,yBaixo,yCima] (podem se sobrepor em a..b)
  const mop=(arr,j,k0,k1,lo,hi)=>[arr[j]+.15+k0*TW,arr[j]+.15+k1*TW,lo,hi];
  function bw(xd,c,u0,u1,ops,yb,yt){
    const pts=[...new Set([u0,u1,...ops.flatMap(o=>[o[0],o[1]])])].filter(v=>v>=u0-1e-6&&v<=u1+1e-6).sort((a,b)=>a-b);
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1];if(b-a<.01)continue;
      const m=(a+b)/2,cut=ops.filter(o=>m>o[0]&&m<o[1]).map(o=>[o[2],o[3]]).sort((p,q)=>p[0]-q[0]),segs=[];let y=yb;
      for(const [lo,hi] of cut){if(lo>y)segs.push([y,lo]);y=Math.max(y,hi);}
      if(y<yt-1e-6)segs.push([y,yt]);
      segs.forEach(([y0,y1])=>{
        if(xd)TB(a,y0,c-BT/2,b,y1,c+BT/2,'brick','bx',4,8,9);
        else TB(c-BT/2,y0,a,c+BT/2,y1,b,'brick','bz',9,8,4)})}}
  // perímetro: janelas na faixa superior, docas ao sul (3 módulos de abertura) e portas laterais
  const dockOpen=j=>(j+w.i)%2===0; // só define em quais docas há caminhão estacionado; TODOS os portões ficam fechados
  const EMD=[[-20,-7.5],[-20,12.5],[20,-22.5],[20,-7.5],[20,-2.5]]; // portas de emergência laterais [x,z] (vão de 1,20 x 2,10 m, no meio dos vãos entre pilares)
  [-25,25].forEach(z=>{const ops=[];
    for(let j=0;j<8;j++){ops.push(mop(G,j,1,4,5.8,6.8));if(z<0&&j>=1&&j<=6)ops.push(mop(G,j,1,4,.1,3.9));}
    bw(true,z,-20,20,ops,.1,7.3)});
  [-20,20].forEach(x=>{const ops=[];
    for(let j=0;j<10;j++){ops.push(mop(GZ,j,1,4,5.8,6.8));}
    EMD.filter(e=>e[0]===x).forEach(e=>ops.push([e[1]-.6,e[1]+.6,.1,2.2]));
    bw(false,x,-25,25,ops,.1,7.3)});
  // escritório administrativo (canto noroeste)
  bw(true,15,-20,-10,[mop(G,0,1,2,1,2),mop(G,0,3,4,1,2),mop(G,1,2,3,.1,2.2),mop(G,1,0,1,1,2),mop(G,1,4,5,1,2)],.1,2.5);
  bw(false,-10,15,25,[mop(GZ,8,2,3,.1,2.2),mop(GZ,8,0,1,1,2),mop(GZ,8,4,5,1,2),mop(GZ,9,1,4,1,2)],.1,2.5);

  // ---------- decoração instanciada (fora do sistema de voxels, mas atingível por tiros) ----------
  SQ=11;const sp=a=>a[Math.floor(sr()*a.length)];
  const bx=(x,y,z,w,h,d,col,ry)=>D('m',x,y,z,w,h,d,col,ry);
  const glass=(xd,g,arr,j,ks,y0)=>{const a0=arr[j]+.15;ks.forEach(k=>{const u=a0+k*TW+TW/2;xd?D('g',u,y0+1.4,g,TW,1,.03,0xcfe8f2):D('g',g,y0+1.4,u,.03,1,TW,0xcfe8f2)})};
  for(let j=0;j<8;j++){glass(true,-25,G,j,[1,2,3],4.9);glass(true,25,G,j,[1,2,3],4.9)}
  for(let j=0;j<10;j++){glass(false,-20,GZ,j,[1,2,3],4.9);glass(false,20,GZ,j,[1,2,3],4.9)}
  glass(true,15,G,0,[1,3],.1);glass(true,15,G,1,[0,4],.1);glass(false,-10,GZ,8,[0,4],.1);glass(false,-10,GZ,9,[1,2,3],.1);

  const CT=[0xb48a55,0xc19a62,0xa87c48,0xcba56f,0xb89060,0x2e6fb0,0xe6ecef];
  function cargo(x,y,z,ry,mh){let yy=y+.14;if(sr()<.12){const h=Math.min(mh,.8+sr()*.4);D('m',x,yy+h/2,z,.95,h,1.15,sp([0xe6ecef,0x8fb0d0]),ry);return}
    const n=sr()<.45?2:1;for(let i=0;i<n;i++){const h=Math.min(mh/n,.3+sr()*.4),w=.55+sr()*.4,d=.6+sr()*.55;bx(x+(sr()-.5)*.06,yy+h/2,z+(sr()-.5)*.06,w,h,d,sp(CT),ry+(sr()-.5)*.08);yy+=h}}
  function pallet(x,y,z,ry,load){D('m',x,y+.07,z,1,.14,1.2,0xc2a06a,ry);if(load)cargo(x,y,z,ry,load)}
  // Setor B: porta-paletes 6 m, 4 níveis
  const RK=[-17.5,-12.5,-7.5,-2.5,2.5],RZ0=-16,RU=2.7,NU=9,BL=[1.4,2.85,4.3];
  RK.forEach(x=>{const zf=RZ0+NU*RU;sol(x-.6,x+.6,RZ0-.1,zf+.1);
    for(let i=0;i<=NU;i++){const z=RZ0+i*RU;[-.5,.5].forEach(a=>{D('s',x+a,3,z,.1,6,.1,0x1f5fae);D('s',x+a,.2,z,.2,.4,.2,0xf2c200)});D('s',x,3.2,z,1,.05,.05,0x1f5fae);D('s',x,1.1,z,1,.05,.05,0x1f5fae)}
    for(let i=0;i<NU;i++){const z0=RZ0+i*RU;BL.forEach(y=>[-.5,.5].forEach(a=>D('s',x+a,y,z0+RU/2,.07,.12,RU,0xe8781a)));
      [.1,...BL.map(y=>y+.06)].forEach(y=>{if(sr()<.88)[.7,2.0].forEach(o=>{if(sr()<.9)pallet(x,y,z0+o,0,y<1?1.05:1.15)})})}});
  // Setor A: docas
  for(let j=1;j<=6;j++){const cx=G[j]+.15+2.35;
    D('s',cx,3.68,-24.84,2.8,.44,.12,0x9aa3ab);for(let q=0;q<3;q++)D('s',cx,3.5+q*.14,-24.77,2.8,.03,.02,0x6f7881);[-1.38,1.38].forEach(a=>D('s',cx+a,2.2,-24.84,.05,3.4,.1,0x555b61));
    D('s',cx,.115,-23.9,2.4,.03,2.0,0x7d8790);D('s',cx-1.3,.5,-24.7,.2,.8,.3,0x1b1b1b);D('s',cx+1.3,.5,-24.7,.2,.8,.3,0x1b1b1b);D('s',cx,.108,-22.7,2.8,.01,.12,0xf2c200);
    sign('DOCA '+j,cx,4.45,-24.9,0,1.0,.5,'#1f5fae','#ffffff');
    PORTALS.push({k:'g',cx:TX(cx),cz:TZ(-25)});
    if(j%2)for(let q=0;q<3;q++)pallet(cx-1.15+q*1.15,.1,-21.2,0,1.0)}
  for(let i=0;i<4;i++)for(let j=0;j<3;j++){bx(-19.2+i*.95,.3,-23.6+j*.8,.75,.4,.6,sp(CT),0);if((i+j)%2==0)bx(-19.2+i*.95,.69,-23.6+j*.8,.7,.38,.55,sp(CT),0)}
  D('s',17,.9,-22,2.4,.06,1,0x8a8f96);[[-1.1,-.4],[1.1,-.4],[-1.1,.4],[1.1,.4]].forEach(a=>D('s',17+a[0],.4,-22+a[1],.06,.8,.06,0x555b61));D('m',17,1.0,-22,.4,.05,.3,0xeeeeee);
  for(let i=0;i<4;i++){const x=-19+i*1.1;D('s',x,.35,-19.6,.7,.05,1.0,0x3a6ea5);D('s',x,.7,-20.1,.7,.7,.04,0x3a6ea5);[[-.3,-.4],[.3,-.4],[-.3,.4],[.3,.4]].forEach(a=>D('t',x+a[0],.1,-19.6+a[1],.06,.2,.2,0x1b1b1b))}
  // Setor C: separação e embalagem
  sol(12.0,13.0,-14,-1.5);
  D('s',12.5,.8,-7.75,.9,.12,12.5,0x555b61);for(let z=-13.5;z<-1;z+=2)[-.4,.4].forEach(a=>D('s',12.5+a,.37,z,.06,.74,.06,0x6a727a));for(let z=-13.8;z<-1.6;z+=.28)D('t',12.5,.88,z,.82,.06,.06,0xaab2ba);
  for(let i=0;i<7;i++)bx(12.5,1.06,-13+i*1.7,.5,.3,.45,sp(CT),0);
  for(let i=0;i<4;i++){const z=-14+i*3.6,X=17.3;sol(X-1.1,X+1.1,z-.55,z+.55);D('s',X,.9,z,2.2,.08,1,0x9aa3ab);[[-1,-.4],[1,-.4],[-1,.4],[1,.4]].forEach(a=>D('s',X+a[0],.4,z+a[1],.06,.8,.06,0x555b61));
    D('m',X-.6,.99,z,.5,.1,.4,0xd9d9d9);D('m',X+.6,.98,z,.35,.08,.25,0x2b2b2b);D('m',X+.6,1.06,z+.3,.2,.04,.2,0xffffff);D('s',X+1.45,.12,z,.7,.2,.7,0x444a50);D('s',X+1.45,.3,z,.5,.04,.5,0x9aa3ab);
    bx(X,1.1,z+.2,.45,.25,.4,sp(CT),.2)}
  for(let i=0;i<3;i++){D('s',8.4,.35,-12+i*3,.6,.05,.9,0xe8781a);D('s',8.4,.7,-12.4+i*3,.6,.7,.04,0xe8781a);[[-.25,-.35],[.25,-.35],[-.25,.35],[.25,.35]].forEach(q=>D('t',8.4+q[0],.1,-12+i*3+q[1],.05,.2,.2,0x1b1b1b));bx(8.4,.6,-11.9+i*3,.45,.4,.5,sp(CT),0)}
  for(let i=0;i<3;i++)pallet(12+i*1.6,.1,-1.5,0,.9);
  // Setor D: estoque secundário
  sol(18.5,19.7,2.4,22.9);
  for(let i=0;i<10;i++){const z=3.4+i*2.05;[0,1,2].forEach(l=>{D('s',19.1,.3+l*.75,z,1,.04,1.9,0x1f5fae);[0,1,2].forEach(q=>{if(sr()<.85)bx(19.1,.3+l*.75+.2,z-.65+q*.65,.55,.34,.5,sp([0x2e6fb0,0x9aa3ab,0xc0392b,0xb48a55]),0)})});
    [-.95,.95].forEach(a=>D('s',19.1,1.15,z+a,1,2.3,.06,0xe8781a))}
  for(let i=0;i<5;i++){D('s',12+i*1.1,1.0,23.6,.9,2.0,.5,0x7d8790);D('s',12+i*1.1,1.0,23.34,.8,.04,.02,0x555b61)}sol(11.4,17.2,23.2,24);
  for(let i=0;i<6;i++){D('m',8.5+(i%3)*.7,i>2?.7:.2,16,.6,.38,.4,sp([0x2e6fb0,0x2e7d32,0xc0392b]),0)}
  for(let i=0;i<3;i++){D('s',9+i*1.2,.3,19,.7,.5,.35,0xc0392b);D('s',9+i*1.2,.58,19,.7,.04,.35,0x8e2a20)}
  // Setor E: mobiliário do escritório + forro
  D('s',-15,2.55,20,9.6,.1,9.6,0xd8d6d0);LD(-15,2.48,17,2,.05,.4,null,false);LD(-15,2.48,23,2,.05,.4,null,false);LD(-15,2.44,20,1.6,.1,.4,'dim',true,12);
  [[-17.5,17.5],[-14,17.5],[-17.5,21],[-14,21],[-12,23.5]].forEach(([x,z])=>{sol(x-.8,x+.8,z-.4,z+.4);D('s',x,.75,z,1.6,.06,.8,0xb88a52);[-.7,.7].forEach(a=>D('s',x+a,.32,z,.06,.64,.7,0x555b61));
    D('m',x,.98,z-.1,.5,.32,.04,0x15181b);D('m',x,.78,z+.1,.4,.02,.14,0x2b2b2b);D('s',x,.46,z+.75,.5,.06,.5,0x2b2b2b);D('s',x,.77,z+.98,.5,.5,.06,0x2b2b2b);D('s',x,.22,z+.75,.06,.44,.06,0x555b61)});
  for(let i=0;i<4;i++)D('s',-19.6,.95,16+i*.9,.5,1.9,.8,0x8f98a0);sol(-19.9,-19.3,15.5,19.7);
  // empilhadeiras e paleteiras
  function fk(x,z,ry,col,ld,diesel){const cs=Math.cos(ry),sn=Math.sin(ry),W2=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs];
    const P2=(k,lx,y,lz,sx,sy,sz,c)=>{const w=W2(lx,lz);D(k,w[0],y,w[1],sx,sy,sz,c,ry)};
    P2('s',0,.6,0,1.0,.55,1.7,col);P2('s',0,.75,-1.0,1.0,.8,.5,diesel?0x555b61:0x2b2b2b);P2('s',0,.93,-.3,.55,.1,.55,0x1b1b1b);P2('s',0,1.2,-.55,.5,.5,.1,0x1b1b1b);
    P2('s',0,1.15,.5,.45,.08,.45,0x1b1b1b);P2('s',0,.95,.62,.08,.4,.08,0x444a50);
    [-.38,.38].forEach(a=>{P2('s',a,1.25,1.1,.09,2.3,.09,0x8a8f96);P2('s',a,.14,1.7,.14,.05,1.2,0x8a8f96)});P2('s',0,2.35,1.1,.8,.08,.08,0x8a8f96);P2('s',0,.55,1.12,.9,.6,.06,0x8a8f96);
    [-.45,.45].forEach(a=>{P2('s',a,1.45,.45,.05,1.15,.05,0x2b2b2b);P2('s',a,1.45,-.35,.05,1.15,.05,0x2b2b2b)});P2('s',0,2.05,.05,1.05,.05,1.0,0x2b2b2b);
    if(diesel)P2('c',0,1.4,-1.15,.12,.5,.12,0x777777);else P2('s',0,.4,-.7,.7,.25,.5,0x0f3d78);
    [[-.5,.7],[.5,.7],[-.5,-.7],[.5,-.7]].forEach(q=>P2('t',q[0],.3,q[1],.22,.6,.6,0x151515));
    if(ld){const w=W2(0,1.75);pallet(w[0],.17,w[1],ry,.9)}}
  [[-14.6,-12.9,0,0x1f5fae,1,0],[-9.6,-1.6,Math.PI,0xe8781a,0,1],[-4.6,2.7,.3,0x1f5fae,1,0],[12,7,1.0,0xe8781a,1,1],[-3,12,-.6,0x1f5fae,0,0],[3,-19.2,.4,0xe8781a,0,1],[.3,-8.2,0,0x1f5fae,1,0],[13.2,12.3,.8,0x1f5fae,0,0]].forEach(a=>fk(a[0],a[1],a[2],a[3],a[4],a[5]));
  [[-5.2,-21],[5.2,-21.5],[10.6,-20.5],[-13.7,3.3],[8.5,2]].forEach(([x,z],i)=>{const r=i*.7;[-.25,.25].forEach(a=>D('s',x+a*Math.cos(r),.08,z-a*Math.sin(r),.15,.08,1.1,0xd9362b,r));D('s',x-.7*Math.sin(r),.55,z-.7*Math.cos(r),.06,.9,.06,0x333333,r);D('s',x-.7*Math.sin(r),1.0,z-.7*Math.cos(r),.4,.05,.05,0x333333,r)});
  // sinalização do piso
  RK.forEach(x=>[-.85,.85].forEach(a=>D('s',x+a,.106,-3.8,.1,.012,25.5,0xf2c200)));
  D('s',0,.106,-18.4,39.5,.012,.15,0xf2c200);D('s',0,.106,9.6,39.5,.012,.15,0xf2c200);[-12.5,12.5].forEach(x=>D('s',x,.106,-21.6,.15,.012,6.6,0xf2c200));
  // luminárias (as 12 que emitem luz real são criadas em mkLamp), tubulações, eletrocalhas, ventiladores, câmeras, extintores
  // quadro de disjuntores (parede oeste, entre os pilares z=-5 e z=0): dados para o InstancedMesh criado depois
  BRK.push({wi:w.i,x:TX(-19.88),z:TZ(-2.5),nx:WS,zs:WS});
  sign('QUADRO DE LUZ\nGALPÃO '+String(w.i+1).padStart(2,'0'),-19.8,1.93,-2.5,Math.PI/2,.5,.17,'#2b2f33','#e8c200');
  const LX=[-15,-5,5,15],LZ=[-17.5,-2.5,12.5];
  LX.forEach((x,i)=>LZ.forEach((z,j)=>LD(x,6.62,z,1.6,.1,.4,LMODE[i*3+j],true,24)));
  for(let i=0;i<7;i++)for(let j=0;j<10;j++){const x=-15+5*i,z=-22.5+5*j;if(x<=-10&&z>15)continue;D('s',x,7.0,z,.04,.7,.04,0x333333);
    if(!(LX.includes(x)&&LZ.includes(z)))LD(x,6.62,z,1.3,.07,.28,null,false);D('s',x,6.7,z,1.4,.05,.4,0x666b70)}
  for(let i=0;i<3;i++)D('t',0,6.95,-4.7+i*.28,39,.14,.14,[0x2a6fb8,0xc0392b,0x8a8f96][i]);
  D('s',0,6.9,10.4,39,.07,.4,0x9aa3ab);D('s',-2.5,6.9,0,.4,.07,49,0x9aa3ab);
  [[-7.5,5],[2.5,2.5],[12.5,0],[12.5,-10],[-12.5,12]].forEach(([x,z])=>{D('s',x,6.75,z,2.4,.06,.18,0xc9cdd1,0);D('s',x,6.82,z,2.4,.06,.18,0xc9cdd1,Math.PI/2);D('s',x,6.9,z,.3,.25,.3,0x444a50)});
  [[19.6,-24.6],[-19.6,-24.6],[19.6,24.6],[-19.6,24.6]].forEach(([x,z])=>D('s',x,6.9,z,.2,.18,.38,0x1b1b1b,Math.atan2(x,z)));
  cols.forEach((q,i)=>{if(Math.abs(q[0])==20&&Math.abs(q[1])==25)return;const px=Math.abs(q[0])==20,pz=Math.abs(q[1])==25,nx=px?-Math.sign(q[0]):0,nz=px?0:(pz?-Math.sign(q[1]):1);
    if(i%7==0){D('c',q[0]+nx*.24,1.2,q[1]+nz*.24,.17,.5,.17,0xd32f2f);nz?D('s',q[0],1.85,q[1]+nz*.16,.3,.25,.02,0xd32f2f):D('s',q[0]+nx*.16,1.85,q[1],.02,.25,.3,0xd32f2f)}
    if(i%9==2&&i%7!=0){nz?D('s',q[0],1.6,q[1]+nz*.2,.5,.8,.1,0x7d8790):D('s',q[0]+nx*.2,1.6,q[1],.1,.8,.5,0x7d8790)}});
  [-7.5,2.5,7.5].forEach(x=>D('s',x,1.2,24.86,.6,.8,.12,0xd32f2f));
  D('s',19.86,1.6,-6.5,.12,.9,.6,0x7d8790);D('s',19.86,1.6,-5.6,.12,.9,.6,0x7d8790);
  D('t',-19.89,4.2,-6.1,.06,.9,.9,0xf4f4f0,0);
  for(let i=0;i<4;i++)D('c',19.1,.4,-18+i*.7,.5,.8,.5,0x2e7d32);
  for(let i=0;i<3;i++){D('c',-19.3,.15,-1+i*.4,.3,.3,.3,0x2e6fb0);D('s',-19.3,.9,-1+i*.4,.03,1.5,.03,0xb48a55)}
  // placas dos setores
  sign('SETOR A\nRECEBIMENTO / EXPEDIÇÃO',0,6.1,-18.2,Math.PI,5,1.4,'#f2c200','#1b1b1b');sign('SETOR B\nARMAZENAGEM PRINCIPAL',-7.5,6.4,-16.6,Math.PI,5,1.4,'#1f5fae','#ffffff');
  sign('SETOR C\nSEPARAÇÃO E EMBALAGEM',14,6.1,-17,Math.PI,5,1.4,'#e8781a','#ffffff');sign('SETOR D\nESTOQUE SECUNDÁRIO',14,6.1,2.2,Math.PI,5,1.4,'#2e7d32','#ffffff');
  sign('SETOR E · ADMINISTRATIVO',-15,2.25,14.86,Math.PI,3.2,.4,'#555b61','#ffffff');
  RK.forEach((x,i)=>{sign('R'+(i+1),x,5.2,RZ0-.1,Math.PI,.9,.5,'#ffffff','#1f5fae');sign('R'+(i+1),x,5.2,RZ0+NU*RU+.1,0,.9,.5,'#ffffff','#1f5fae')});
  [[0,6.1,-18.2,5],[-7.5,6.4,-16.6,5],[14,6.1,-17,5],[14,6.1,2.2,5]].forEach(([x,y,z,w])=>{[-1,1].forEach(a=>D('s',x+a*w*.4,(y+.7+7.3)/2,z,.04,7.3-y-.7,.04,0x333333))});
  sign('SAÍDA',-19.9,3.2,-9,Math.PI/2,.9,.4,'#2e7d32','#ffffff');sign('EPI OBRIGATÓRIO',19.9,2.6,6,-Math.PI/2,1.0,.5,'#1f5fae','#ffffff');
  {const cg=new THREE.CylinderGeometry(.4,.4,.06,28);cg.rotateX(Math.PI/2);const m=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:0xf4f4f0}));m.position.set(TX(2.5),4.2,TZ(24.89));scene.add(m)}

  EMD.forEach(([ex,ez])=>{const n=(ex<0?1:-1)*WS,hz=TZ(ez-.6);
    [-.64,.64].forEach(a=>D('s',ex,1.15,ez+a,.24,2.1,.08,0x555b61));D('s',ex,2.24,ez,.24,.08,1.36,0x555b61);
    PORTALS.push({k:'d',x:TX(ex),hz:hz,s:WS,n:n,cz:TZ(ez),z0:Math.min(TZ(ez-.6),TZ(ez+.6)),z1:Math.max(TZ(ez-.6),TZ(ez+.6))})});
  // ---- vagas de caminhões (6 baias por galpão), caminhões estacionados e identificação do galpão
  [-15,-10,-5,0,5,10,15].forEach(x=>D('s',x,.1035,-35,.14,.008,18.6,0xf4f4f0));
  D('s',0,.1035,-44.3,30.14,.008,.14,0xf4f4f0);D('s',0,.1035,-26.2,30.14,.008,.14,0xf2c200);
  sign('GALPÃO '+String(w.i+1).padStart(2,'0'),0,5.15,-25.78,Math.PI,3.4,.9,'#1f5fae','#ffffff');
  function truck(cx,cab,tr){const z0=-25.35,zf=z0-13.6;
    D('s',cx,2.5,z0-6.8,2.55,2.8,13.6,tr);D('s',cx,1.0,z0-6.6,.95,.22,13.2,0x222629);D('s',cx,1.75,z0+.02,2.2,2.2,.04,0x6f7881);
    [-1,1].forEach(a=>[1.8,3.0,4.2].forEach(d=>D('t',cx+a,.52,z0-d,.5,1.04,1.04,0x151515)));
    [-.9,.9].forEach(a=>D('s',cx+a,.55,z0-8.8,.12,1.1,.12,0x555b61));
    D('s',cx,.95,zf-1.2,.95,.25,6.4,0x222629);D('s',cx,2.05,zf-3.0,2.5,2.5,2.2,cab);D('g',cx,2.55,zf-4.12,2.1,1.0,.04,0xcfe8f2);
    D('s',cx,.62,zf-4.25,2.5,.35,.3,0x333333);[-.85,.85].forEach(a=>D('l',cx+a,1.2,zf-4.12,.4,.22,.04,0xfff2d6));
    [-1,1].forEach(a=>[-3.8,-1.0,-2.3].forEach(d=>D('t',cx+a*1.05,.55,zf+d,.45,1.1,1.1,0x151515)));
    sol(cx-1.35,cx+1.35,zf-4.4,z0)}
  {const ab=[1,2,3,4,5,6].filter(dockOpen),nT=[2,1,0][w.i%3],pick=nT===2?[ab[0],ab[2]]:nT===1?[ab[1]]:[];
   pick.forEach(j=>truck(G[j]+2.5,[0xc0392b,0x1f5fae,0x2e7d32,0xe8781a,0xc0392b,0x1f5fae][j-1],j%2?0xe9edf0:0xd2d8dd));}
  }
  WH.forEach(buildOne);
  WX=0;WZ=0;WS=1;
  buildSite();
  flushDec();

  // ================= CENTRO LOGÍSTICO: pátio, estrada, cerca de tela, portarias =================
  function buildSite(){
    const mkT=(b,m,rx,rz)=>{const t=noiseTex(b,m,1);t.repeat.set(rx,rz);return t};
    const pave=(x0,x1,z0,z1,h,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,h,z1-z0),mat);m.position.set((x0+x1)/2,h/2,(z0+z1)/2);m.receiveShadow=true;scene.add(m);hitMeshes.push(m)};
    {const mT=mkT(140,40,1,1),pm=(w,d)=>{const t=mT.clone();t.needsUpdate=true;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(w*.5,d*.5);return new THREE.MeshStandardMaterial({map:t,color:0xa3a6a8,roughness:.95})},
      pv=(x0,x1,z0,z1)=>pave(x0,x1,z0,z1,.09,pm(x1-x0,z1-z0));
      pv(-135,135,-103,-91.5);pv(-135,135,-40.5,40.5);pv(-135,135,91.5,103);
      for(const zz of [[-91.5,-40.5],[40.5,91.5]]){let xx=-135;for(const cc of [-104,-52,0,52,104]){pv(xx,cc-20.5,zz[0],zz[1]);xx=cc+20.5}pv(xx,135,zz[0],zz[1])}
      // subleito sob o piso dos galpões: o que aparece quando o concreto some (e a malha de aço fica à mostra)
      const sbT=noiseTex(120,45,1);sbT.repeat.set(20,25);const sbM=new THREE.MeshStandardMaterial({map:sbT,color:0x8f8373,emissive:0x2e2822,roughness:1});
      for(const w of WH){const m=new THREE.Mesh(new THREE.PlaneGeometry(41,51),sbM);m.rotation.x=-Math.PI/2;m.position.set(w.x,.02,w.z);m.receiveShadow=true;scene.add(m);hitMeshes.push(m)}}
    pave(-130,500,-7.5,7.5,.095,new THREE.MeshStandardMaterial({map:mkT(80,30,315,8),color:0x4a4e52,roughness:.9}));
    for(let x=-126;x<=494;x+=6)D('s',x,.1035,0,3,.008,.18,0xf2c200);
    [-7.1,7.1].forEach(z=>D('s',185,.1035,z,630,.008,.15,0xf4f4f0));
    // cerca de tela
    const FX=135,FZ=103,GT=8.5,FH=2.4,CS=.45;
    const base=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.strokeStyle='#c5cacd';g.lineWidth=4;g.beginPath();g.moveTo(0,0);g.lineTo(64,64);g.moveTo(64,0);g.lineTo(0,64);g.stroke();const t=texQ(new THREE.CanvasTexture(c));t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
    const seg=(x0,z0,x1,z1)=>{const L=Math.hypot(x1-x0,z1-z0),cx=(x0+x1)/2,cz=(z0+z1)/2,alongX=Math.abs(x1-x0)>Math.abs(z1-z0);
      const t=base.clone();t.needsUpdate=true;t.repeat.set(L/CS,FH/CS);
      const m=new THREE.Mesh(new THREE.PlaneGeometry(L,FH),new THREE.MeshStandardMaterial({map:t,alphaTest:.4,side:THREE.DoubleSide,metalness:.5,roughness:.6,color:0xb9c0c4}));
      m.position.set(cx,.1+FH/2,cz);if(!alongX)m.rotation.y=Math.PI/2;scene.add(m);
      const n=Math.max(1,Math.round(L/3));for(let i=0;i<=n;i++){const k=i/n,px=x0+(x1-x0)*k,pz=z0+(z1-z0)*k;D('s',px,1.35,pz,.09,2.5,.09,0x6a7075)}
      D('s',cx,2.52,cz,alongX?L:.06,.06,alongX?.06:L,0x6a7075);D('s',cx,.2,cz,alongX?L:.05,.05,alongX?.05:L,0x6a7075);
      [2.64,2.76].forEach(y=>D('s',cx,y,cz,alongX?L:.015,.015,alongX?.015:L,0x2a2a2a));
      solids.push(alongX?{minX:cx-L/2,maxX:cx+L/2,minZ:cz-.15,maxZ:cz+.15}:{minX:cx-.15,maxX:cx+.15,minZ:cz-L/2,maxZ:cz+L/2})};
    seg(-FX,FZ,FX,FZ);seg(-FX,-FZ,FX,-FZ);seg(-FX,-FZ,-FX,FZ);seg(FX,-FZ,FX,-GT);seg(FX,GT,FX,FZ); // uma única entrada: portão leste
    // pórticos de acesso, portarias e cancelas
    [1].forEach(sx=>{
      [-1,1].forEach(sz=>{const z=sz*(GT+.4);D('s',sx*FX,3.2,z,.3,6.4,.3,0x555b61);solids.push({minX:sx*FX-.2,maxX:sx*FX+.2,minZ:z-.2,maxZ:z+.2})});
      D('s',sx*FX,6.25,0,.3,.4,2*GT+1,0x555b61);
      sign('CENTRO LOGÍSTICO\nACESSO CONTROLADO',sx*(FX+.25),5.4,0,sx*Math.PI/2,7,1.4,'#1f5fae','#ffffff');
      sign('CENTRO LOGÍSTICO\nACESSO CONTROLADO',sx*(FX-.25),5.4,0,-sx*Math.PI/2,7,1.4,'#1f5fae','#ffffff');
      const gx=sx*118;D('m',gx,1.6,11,4,3,3,0xc9c5b8);D('s',gx,3.2,11,4.4,.2,3.4,0x555b61);D('g',gx,1.9,9.46,3,1,.04,0xcfe8f2);D('m',gx,.95,9.47,.9,1.9,.04,0x3a3f44);
      sign('PORTARIA',gx,3.75,9.4,Math.PI,2.4,.5,'#f2c200','#1b1b1b');solids.push({minX:gx-2,maxX:gx+2,minZ:9.5,maxZ:12.5});
      [-1,1].forEach(sz=>{const pz=sz*8;D('s',gx+sx*3.5,.6,pz,.4,1.2,.4,0xe8b800);for(let k=0;k<7;k++)D('s',gx+sx*3.5,1.1,pz-sz*(k+.5),.1,.12,1,k%2?0xf4f4f0:0xd32f2f)})});
    // estrada externa: postes de luz e balizadores até longe
    for(let x=165;x<=485;x+=40)[-1,1].forEach(sz=>{D('s',x,4.5,sz*9.2,.14,9,.14,0x4a4f54);D('s',x,8.9,sz*8.3,.1,.1,1.8,0x4a4f54);D('l',x,8.85,sz*7.5,.5,.12,.3,0xfff2d6)});
    for(let x=145;x<=495;x+=15)[-1,1].forEach(sz=>{D('s',x,.55,sz*8.4,.1,1.1,.1,0xf4f4f0);D('s',x,1.05,sz*8.4,.11,.14,.11,0xd32f2f)});
    // floresta ao redor do CD e ao longo da estrada (mesmo sistema instanciado/materiais da decoração dos interiores)
    {const LEAF=[0x2d5a2b,0x34662f,0x264d27,0x3a6b30,0x1f4426,0x426f33],WOOD=[0x4b3626,0x5a4331,0x3f2e21],pk=a=>a[Math.floor(sr()*a.length)];
     const tree=(x,z)=>{const sc=.85+sr()*.7,ry=sr()*Math.PI,lc=pk(LEAF),wc=pk(WOOD),pine=sr()<.6;
       if(pine){const th=2.4*sc;D('w',x,th/2,z,.4*sc,th,.4*sc,wc,ry);
         [[2.3,3.2,1.5],[3.5,2.4,1.4],[4.6,1.6,1.3],[5.5,.8,1.0]].forEach((q,i)=>D('f',x,q[0]*sc,z,q[1]*sc,q[2]*sc,q[1]*sc,lc,ry+i*.45));}
       else{const th=2.2*sc;D('w',x,th/2,z,.45*sc,th,.45*sc,wc,ry);
         D('f',x,3.3*sc,z,3.2*sc,2.6*sc,3.2*sc,lc,ry);D('f',x+.3*sc,4.9*sc,z-.2*sc,2.2*sc,1.8*sc,2.2*sc,pk(LEAF),ry+.6);D('f',x-.9*sc,3.8*sc,z+.7*sc,1.6*sc,1.5*sc,1.6*sc,pk(LEAF),ry+1.1);}
       solids.push({minX:x-.3,maxX:x+.3,minZ:z-.3,maxZ:z+.3})};
     const C=7.5;
     for(let gx=-290;gx<=505;gx+=C)for(let gz=-262;gz<=262;gz+=C){
       const x=gx+(sr()-.5)*C*.8,z=gz+(sr()-.5)*C*.8,r=sr();
       if(Math.abs(x)<=145&&Math.abs(z)<=111)continue;        // pátio + folga junto à cerca
       if(x>120&&Math.abs(z)<17)continue;                      // faixa da estrada
       const d=Math.hypot(Math.max(Math.abs(x)-135,0),Math.max(Math.abs(z)-103,0));
       let pr=d<70?.8:d<130?.4:.1;if(x>135&&Math.abs(z)<60)pr=Math.max(pr,.85);
       if(r<pr)tree(x,z);}}
    // postes de iluminação do pátio
    for(let x=-120;x<=120;x+=30)[-1,1].forEach(sz=>{D('s',x,4.5,sz*9.2,.14,9,.14,0x4a4f54);D('s',x,8.9,sz*8.3,.1,.1,1.8,0x4a4f54);D('l',x,8.85,sz*7.5,.5,.12,.3,0xfff2d6)});
  }
})();
