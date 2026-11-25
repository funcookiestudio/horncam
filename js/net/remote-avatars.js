// [HORNCAM] js/net/remote-avatars.js
// ---------- avatar dos outros jogadores ----------
const SKIN=MT(0x7a5c46,.9,0),HELM=MT(0x2a3128,.7,.1),LAMPM=new THREE.MeshBasicMaterial({color:0xfff2d0});
function mkTag(name){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');
  g.font='bold 34px Courier New,monospace';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='rgba(0,0,0,.85)';
  g.strokeText(name,128,32);g.fillStyle='#e8e8e8';g.fillText(name,128,32);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
  s.scale.set(1.1,.275,1);s.position.y=2.1;return s;}
// tarja de censura (mosaico de pixels, como nas imagens de body cam): cobre o rosto dos outros jogadores
const CENSOR=(()=>{const c=document.createElement('canvas');c.width=8;c.height=6;const g=c.getContext('2d');
  for(let y=0;y<6;y++)for(let x=0;x<8;x++){const v=70+Math.random()*95|0,w=(y===2||y===3)?.75:1;g.fillStyle='rgb('+(v*w*1.04|0)+','+(v*w|0)+','+(v*w*1.08|0)+')';g.fillRect(x,y,1,1)}
  const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;
  return new THREE.MeshStandardMaterial({map:t,roughness:1,metalness:0})})();
function mkAvatar(id,name,slot){
  const g=new THREE.Group(),bodyG=new THREE.Group();g.add(bodyG);
  const vest=MT(SLOTCOL[slot%4],.85,.05),pants=MT(0x2b2f27,.9,0);
  const legs=[-1,1].map(s=>{const lg=new THREE.Group();lg.position.set(s*.11,.85,0);bodyG.add(lg);bx(.16,.85,.18,0,-.425,0,pants,lg);return lg;});
  const up=new THREE.Group();bodyG.add(up);
  bx(.46,.58,.27,0,1.13,0,vest,up);bx(.4,.1,.25,0,.83,0,blk,up);bx(.3,.34,.06,0,1.18,.15,gry,up);
  const hd=new THREE.Group();hd.position.set(0,1.46,0);up.add(hd);
  bx(.2,.22,.22,0,.11,0,SKIN,hd);
  {const cs=new THREE.Mesh(new THREE.BoxGeometry(.235,.2,.05),CENSOR);cs.position.set(0,.105,-.118);hd.add(cs)}   // mosaico sobre o rosto
  const hl=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),HELM);hl.scale.set(.15,.13,.17);hl.position.set(0,.2,0);hd.add(hl);
  bx(.2,.05,.06,0,.14,-.12,blk,hd);bx(.04,.05,.07,.12,.2,-.04,gry,hd);
  const ar=new THREE.Group();ar.position.set(0,1.36,0);up.add(ar);
  bx(.1,.1,.4,.2,-.1,-.1,vest,ar);bx(.1,.1,.55,-.02,-.12,-.42,vest,ar);
  bx(.06,.1,.5,.06,-.1,-.4,blk,ar);cy(.018,.45,.06,-.08,-.88,gry,ar);bx(.04,.15,.07,.06,-.2,-.3,gry,ar);
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  const mz=new THREE.Group();mz.position.set(.06,-.08,-1.15);mz.visible=false;ar.add(mz);
  for(let i=0;i<2;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(.3,.3),fm);p.rotation.z=i*Math.PI/4;mz.add(p);}
  const bm=new THREE.Mesh(bmg,beam.material);bm.position.set(0,.14,-.15);bm.scale.setScalar(.8);bm.frustumCulled=false;bm.visible=false;hd.add(bm);
  const lamp=bx(.05,.05,.05,0,.14,-.13,LAMPM,hd);lamp.visible=false;
  const tag=mkTag(name);g.add(tag);
  // caixas invisíveis para acertar tiros (corpo e cabeça)
  const bp=new THREE.Mesh(new THREE.BoxGeometry(.6,1.45,.5),blk),hp=new THREE.Mesh(new THREE.BoxGeometry(.32,.32,.32),blk);
  bp.visible=hp.visible=false;bp.userData.rp={id,head:false};hp.userData.rp={id,head:true};g.add(bp,hp);
  g.visible=false;scene.add(g);
  return {id,name,slot,g,bodyG,legs,up,hd,ar,mz,bm,lamp,tag,bp,hp,px:false,cur:new V3(),tgt:new V3(),
    cy:0,yaw:0,pit:0,crouch:false,fl:false,dead:false,has:false,spd:0,ph:0,st:0,mzT:0,t:0,cz:0,dz:0};
}
function setProxy(r,on){
  if(on&&!r.px){hitMeshes.push(r.bp,r.hp);r.px=true;}
  else if(!on&&r.px){for(const m of [r.bp,r.hp]){const i=hitMeshes.indexOf(m);if(i>=0)hitMeshes.splice(i,1);}r.px=false;}
}
function addRemote(p){if(p.id===NET.id||NET.rem[p.id])return;NET.players[p.id]=p;NET.rem[p.id]=mkAvatar(p.id,p.n,p.s);}
function removeRemote(id){
  const r=NET.rem[id];if(r){setProxy(r,false);scene.remove(r.g);delete NET.rem[id];}
  const p=NET.players[id];if(p)feed(p.n+' saiu');delete NET.players[id];refreshUI();
}
function applyState(r,m){
  const now=performance.now();
  if(!r.has){r.has=true;r.cur.set(m.x,m.y,m.z);r.tgt.copy(r.cur);r.cy=m.yw;r.t=now;}
  if(Math.hypot(m.x-r.tgt.x,m.z-r.tgt.z)>4){r.cur.set(m.x,m.y,m.z);r.tgt.copy(r.cur);r.spd=0;}
  const dtm=Math.max(.02,(now-r.t)/1000);
  r.spd+=(Math.hypot(m.x-r.tgt.x,m.z-r.tgt.z)/dtm-r.spd)*.5;r.t=now;
  r.tgt.set(m.x,m.y,m.z);r.yaw=m.yw;r.pit=m.pt;r.crouch=!!m.c;r.fl=!!m.fl;
  r.dead=!!m.dd;setProxy(r,!r.dead);
}
function animRemote(r,dt){
  r.g.visible=r.has;if(!r.has)return;
  const k=1-Math.exp(-dt*14);
  r.cur.lerp(r.tgt,k);r.g.position.copy(r.cur);
  r.cy+=angDiff(r.yaw-r.cy)*k;r.g.rotation.y=r.cy;
  r.cz+=((r.crouch?1:0)-r.cz)*(1-Math.exp(-dt*8));
  r.dz+=((r.dead?1:0)-r.dz)*(1-Math.exp(-dt*6));
  if(performance.now()-r.t>400)r.spd*=Math.exp(-dt*6);
  const pit=Math.max(-1.2,Math.min(1.2,r.pit));
  r.hd.rotation.x=pit;r.ar.rotation.x=pit*.9;
  r.up.position.y=-.45*r.cz;
  for(const l of r.legs){l.position.y=.85-.45*r.cz;l.scale.y=1-.53*r.cz;}
  const alive=r.dead?0:1,mv=Math.min(1,r.spd/3.4)*alive;
  r.ph+=r.spd*dt*2.2*alive;
  r.legs[0].rotation.x=Math.sin(r.ph)*.8*mv;r.legs[1].rotation.x=-Math.sin(r.ph)*.8*mv;
  const st=Math.floor(r.ph/Math.PI);
  if(st!==r.st){r.st=st;if(r.spd>.8&&!r.crouch&&!r.dead&&!r.ghost&&r.cur.y<.05){SV=attn(r.cur.x,r.cur.z)*.7;sfx('step',.7);SV=1;}}
  r.bodyG.rotation.x=1.5*r.dz;r.bodyG.position.y=.15*r.dz;
  r.mzT-=dt;r.mz.visible=r.mzT>0&&!r.dead;r.mz.rotation.z=Math.random()*3;
  r.bm.visible=r.lamp.visible=r.fl&&!r.dead&&!r.ghost;
  r.tag.visible=!r.dead&&!r.ghost;
  r.bp.scale.y=1-.31*r.cz;r.bp.position.y=.725*r.bp.scale.y;r.hp.position.y=1.6-.45*r.cz;
}

