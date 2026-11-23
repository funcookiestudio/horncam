// [HORNCAM] js/net/spawn-death.js
// ---------- spawn / morte ----------
function spawnAt(s){P.pos.set(s[0],0,s[1]);P.vel.set(0,0,0);P.y=0;P.vy=0;P.onGround=true;P.crouch=false;
  P.yaw=Math.atan2(s[0],s[1]);P.pitch=0;P.camYaw=P.yaw;P.camPitch=0;}
function pickSpawn(){
  const others=[];for(const id in NET.rem){const r=NET.rem[id];if(r.has&&!r.dead)others.push(r.cur);}
  const far=[];let best=null,bd=-1;
  for(const s of SPAWNS){let md=1e9;for(const o of others)md=Math.min(md,Math.hypot(o.x-s[0],o.z-s[1]));
    if(md>bd){bd=md;best=s;}if(md>=45)far.push(s);}
  return far.length?far[(Math.random()*far.length)|0]:(best||SPAWNS[(Math.random()*SPAWNS.length)|0]);}
function respawn(){
  const best=pickSpawn();
  spawnAt(best);
  aliveT=0;PH.hp=100;PH.dead=false;W.mag=30;W.res=120;W.rl=false;W.lock=false;W.bs=0;W.trig=false;blastAmmo=3;updAmmo();
  NET.inv=time+2.5;sendState();
}
NET.died=function(){
  if(!NET.on)return;
  NET.deadBy=NET.lastBy;NET.resp=5;
  const m={t:'kill',k:NET.lastBy,v:NET.id};NET.send(m);handle(m);NET.lastBy=null;
};
NET.hitPlayer=function(rp,pt,n){
  const r=NET.rem[rp.id];if(!r||r.dead)return;
  for(let i=0;i<5;i++)deb1(pt,n,'blood',R2(.004,.009),3,.5);
  tn(1500,900,.05,.12,'square');
  NET.send({t:'dm',to:rp.id,n:rp.head?30:14,h:rp.head?1:0});
};
NET.push=function(){
  if(!NET.on||PH.dead)return;
  for(const id in NET.rem){const r=NET.rem[id];if(!r.has||r.dead)continue;
    const dx=P.pos.x-r.cur.x,dz=P.pos.z-r.cur.z,d=Math.hypot(dx,dz);
    if(d<.75){if(d>1e-4){P.pos.x+=dx/d*(.75-d);P.pos.z+=dz/d*(.75-d);}else P.pos.x+=.75;}}
};
function netTick(dt){
  lightTick(dt);deathTick(dt);
  hurtV=Math.max(0,hurtV-dt*1.6);hurtEl.style.opacity=hurtV;
  if(!NET.on){if(!PH.dead)msgEl.style.display='none';return;}
  NET.acc+=dt;if(NET.acc>=SEND_DT){NET.acc=0;sendState();}
  if(PH.dead){
    const by=NET.deadBy&&NET.players[NET.deadBy];
    msgEl.textContent='ELIMINADO'+(by?' POR '+by.n:'');
    msgEl.style.display='block';
  }else msgEl.style.display='none';
  for(const id in NET.rem)animRemote(NET.rem[id],dt);
}

