// [HORNCAM] js/net/network.js
// ---------- rede ----------
NET.send=function(m){
  if(!NET.on)return;m.f=NET.id;
  if(NET.host){
    if(m.t==='vi'||m.t==='bl'||m.t==='sr'||m.t==='di')NET.log.push(m);
    for(const id in NET.conns){const c=NET.conns[id];if(c.open)try{c.send(m);}catch(e){}}
  }else if(NET.hc&&NET.hc.open){try{NET.hc.send(m);}catch(e){}}
};
function sendState(){
  NET.send({t:'st',x:+P.pos.x.toFixed(2),y:+P.y.toFixed(2),z:+P.pos.z.toFixed(2),yw:+P.yaw.toFixed(3),pt:+P.pitch.toFixed(3),
    c:P.crouch?1:0,fl:flashOn?1:0,dd:PH.dead?1:0});
}
// mensagens vindas de qualquer jogador (já com m.f = id de quem enviou)
function handle(m){
  const f=m.f;
  switch(m.t){
    case 'st':{const r=NET.rem[f];if(r)applyState(r,m);break;}
    case 'sh':{const r=NET.rem[f];if(!r)break;r.mzT=.06;SV=attn(r.cur.x,r.cur.z);sfx('shot');SV=1;break;}
    case 'vi':{SV=attn(m.p[0],m.p[2]);voxFx(new V3(...m.p),new V3(...m.n),new V3(...m.d),m.c,m.b|0,m.s,false);SV=1;break;}
    case 'di':{SV=attn(m.p[0],m.p[2]);decFx(m.k,m.q,m.p,m.n,m.d,m.c,m.s,false);SV=1;break;}
    case 'sr':{SV=attn(m.p[0],m.p[2]);steelFx(new V3(...m.p),new V3(...m.n),new V3(...m.d),false);SV=1;break;}
    case 'pi':{SV=attn(m.p[0],m.p[2]);propFx(new V3(...m.p),new V3(...m.n));SV=1;break;}
    case 'bl':{NET.lastBy=f;SV=Math.min(1,attn(m.p[0],m.p[2])*3);blast(new V3(...m.p),m.r,new V3(...m.n),m.s,false);SV=1;break;}
    case 'lp':{const L=lamps[m.i];if(L){SV=attn(L.p.position.x,L.p.position.z);breakLamp(m.i,false);SV=1;}break;}
    case 'sw':{const b=BRKW[m.w];if(b){SV=attn(b.x,b.z);setBreaker(m.w,m.c,!!m.v,false);SV=1}break;}
    case 'dr':{const d=doors[m.i];if(d){SV=attn(d.hx,d.hz);setDoor(d,!!m.o);SV=1;}break;}
    case 'abq':{if(NET.host){const b=ABX[m.i];if(b&&abLeft(b)<=0){abOpen(m.i,false,AB_CD);NET.send({t:'ab',i:m.i,w:f,c:AB_CD});}}break;}
    case 'ab':{abOpen(m.i,m.w===NET.id,m.c);break;}
    case 'dm':{if(m.to===NET.id){NET.lastBy=f;hurt(m.n);}break;}
    case 'kill':{
      const v=NET.players[m.v],k=(m.k&&m.k!==m.v)?NET.players[m.k]:null;
      if(v)v.d++;if(k)k.k++;
      feed(k?k.n+' ▸ '+(v?v.n:'?'):(v?v.n+' morreu':''));refreshUI();break;}
    case 'join':{if(m.p&&m.p.id!==NET.id){addRemote(m.p);feed(m.p.n+' entrou');refreshUI();}break;}
    case 'leave':{removeRemote(m.id);break;}
  }
}
// ---- anfitrião: recebe dados de um cliente, processa e retransmite ----
function onConnData(conn,m){
  if(!m||typeof m!=='object')return;
  if(m.t==='hi'){
    if(NET.players[conn.peer])return;
    const used=new Set(Object.values(NET.players).map(p=>p.s));let s=0;while(used.has(s))s++;
    if(s>=MAXP){try{conn.send({t:'full'});}catch(e){}setTimeout(()=>{try{conn.close();}catch(e){}},400);return;}
    const p={id:conn.peer,n:sanitize(m.n),s,k:0,d:0};
    NET.players[p.id]=p;NET.conns[p.id]=conn;
    try{conn.send({t:'init',you:s,pl:Object.values(NET.players),log:NET.log,dr:doors.map(d=>d.open?1:0),lm:lamps.map(L=>L.dead?1:0),sw:SW.map(a=>a.map(v=>v?1:0)),ab:ABX.map(b=>Math.ceil(abLeft(b)))});}catch(e){}
    for(const id in NET.conns)if(id!==p.id)try{NET.conns[id].send({t:'join',p});}catch(e){}
    addRemote(p);feed(p.n+' entrou');refreshUI();return;
  }
  if(!NET.players[conn.peer])return;
  m.f=conn.peer;handle(m);
  if(m.t==='vi'||m.t==='bl'||m.t==='sr'||m.t==='di')NET.log.push(m);
  for(const id in NET.conns)if(id!==conn.peer&&NET.conns[id].open)try{NET.conns[id].send(m);}catch(e){}
}
function dropConn(conn){
  const id=conn.peer;if(!NET.conns[id]&&!NET.players[id])return;
  delete NET.conns[id];
  if(NET.players[id]){for(const o in NET.conns)try{NET.conns[o].send({t:'leave',id});}catch(e){}removeRemote(id);}
}
// ---- cliente: estado inicial enviado pelo anfitrião ----
function onInit(m,code){
  NET.host=false;NET.on=true;NET.code=code;NET.slot=m.you;NET.players={};
  m.pl.forEach(p=>{NET.players[p.id]=p;});
  DEFER=true;
  for(const e of m.log){
    if(e.t==='vi')voxFx(new V3(...e.p),new V3(...e.n),new V3(...e.d),e.c,e.b|0,e.s,true);
    else if(e.t==='bl')blast(new V3(...e.p),e.r,new V3(...e.n),e.s,true);
    else if(e.t==='di')decFx(e.k,e.q,e.p,e.n,e.d,e.c,e.s,true);
    else if(e.t==='sr')steelFx(new V3(...e.p),new V3(...e.n),new V3(...e.d),true);
  }
  DEFER=false;DIRTY.forEach(rebuild);DIRTY.clear();
  m.dr.forEach((o,i)=>{if(doors[i])setDoor(doors[i],!!o,true);});
  (m.sw||[]).forEach((a,wi)=>a.forEach((v,ci)=>setBreaker(wi,ci,!!v,true)));
  (m.lm||[]).forEach((o,i)=>{if(o)breakLamp(i,true);});
  (m.ab||[]).forEach((c,i)=>{if(c>0)abOpen(i,false,c,true);});
  m.pl.forEach(p=>addRemote(p));
  spawnAt(SPAWNS[NET.slot%SPAWNS.length]);
  lobbyConnected();
}

