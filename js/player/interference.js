// [HORNCAM] js/player/interference.js
// ---------- Interferência magnética (piloto, etapa 1) ----------
// Ciclo: aviso (ECG/áudio) -> piscada (sinal cai) e a câmera volta virada -> alguns segundos "desorientado" -> piscada -> normal.
// Só visual e só no jogador afetado: durante o efeito os colegas aparecem como VULTOS (silhuetas escuras, sem passos e sem lanterna)
// e, sozinho, aparece uma cópia sua parada à distância. O dano nos colegas continua REAL (fogo amigo).
// Tecla J dispara o evento (teste). INTERF.auto liga o sorteio (desligado no piloto).
const INTERF={ph:0,t:0,turned:false,auto:true,next:0,copy:null,gm:null,v:new THREE.Vector3(),st:0,sa:0,A:1.6,B:.55,C:26,D:.55,key:'KeyJ'};
// silhueta fantasmagórica: preta, sem neblina; só dá para ver contra o que está iluminado
INTERF.gm=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.94,depthWrite:false,fog:false});
function interfGhost(r,on){ // troca os materiais do avatar por silhueta escura (e restaura)
  r.ghost=on;
  r.g.traverse(o=>{if(!o.isMesh||o===r.bp||o===r.hp||o===r.mz||o.parent===r.mz)return;
    if(on){if(!o.userData.om){o.userData.om=o.material;o.material=INTERF.gm}}
    else if(o.userData.om){o.material=o.userData.om;delete o.userData.om}});
}
function interfStart(fast,dur){ // fast: sem aviso, vai direto à piscada (ex.: explosão do quadro); dur: segundos desorientado
  if(INTERF.ph||typeof active==='undefined'||!active||PH.dead)return;
  INTERF.C=dur||26;INTERF.turned=false;INTERF.t=0;
  if(fast){INTERF.ph=2;return}
  INTERF.ph=1;
  try{nz(.9,.28,2800,1,1.5,0,'bandpass');tn(90,45,1.2,.14,'sawtooth')}catch(e){}
}
function interfSpawnCopy(){ // sem colegas: uma cópia sua, parada, à frente (já na nova direção), olhando para você
  const sx=P.pos.x,sz=P.pos.z;let best=null,fb=null;
  const bp=(typeof BLK!=='undefined'&&BLK.ph)?BRKW[BLK.wi]:null; // durante o apagão a cópia surge perto do quadro de disjuntores
  if(bp){for(let i=0;i<30&&!best;i++){const x=bp.x+bp.nx*(3+Math.random()*3),z=bp.z+(Math.random()-.5)*5;let ok=true;for(const b of solids){if(x>b.minX-.6&&x<b.maxX+.6&&z>b.minZ-.6&&z<b.maxZ+.6){ok=false;break}}if(ok)best={x,z}}}
  for(let i=0;i<60&&!best;i++){const a=P.yaw+(Math.random()-.5)*1.2,d=(i<40?8:5)+Math.random()*5,x=sx-Math.sin(a)*d,z=sz-Math.cos(a)*d;
    if(!fb)fb={x,z};
    let ok=true;for(const b of solids){if(x>b.minX-.6&&x<b.maxX+.6&&z>b.minZ-.6&&z<b.maxZ+.6){ok=false;break}}
    if(ok)best={x,z}}
  best=best||fb;
  const r=mkAvatar('copia','',0);r.has=true;r.cur.set(best.x,0,best.z);r.tgt.copy(r.cur);
  r.yaw=r.cy=Math.atan2(-(sx-best.x),-(sz-best.z));interfGhost(r,true);INTERF.copy=r;
}
function interfMoveCopy(r){ // depois de sumir, a cópia reaparece em outro lugar, atrás de você
  const sx=P.pos.x,sz=P.pos.z;
  for(let i=0;i<40;i++){const a=P.yaw+Math.PI+(Math.random()-.5)*1.6,d=7+Math.random()*5,x=sx-Math.sin(a)*d,z=sz-Math.cos(a)*d;
    let ok=true;for(const b of solids){if(x>b.minX-.6&&x<b.maxX+.6&&z>b.minZ-.6&&z<b.maxZ+.6){ok=false;break}}
    if(ok){r.cur.set(x,0,z);r.tgt.copy(r.cur);r.yaw=r.cy=Math.atan2(-(sx-x),-(sz-z));return}}
}
function interfEnd(){
  for(const id in NET.rem)interfGhost(NET.rem[id],false);
  if(INTERF.copy){scene.remove(INTERF.copy.g);INTERF.copy=null}
  INTERF.ph=0;INTERF.st=0;nosigEl.style.display='none';
  INTERF.next=performance.now()+(6+Math.random()*4)*60e3;
}
function interfTick(dt){
  const now=performance.now();
  if(INTERF.auto&&!INTERF.ph&&GS.mode==='play'&&active&&!PH.dead&&!(typeof BLK!=='undefined'&&BLK.ph)){if(!INTERF.next)INTERF.next=now+(6+Math.random()*4)*60e3;if(now>INTERF.next)interfStart()}
  if(!INTERF.ph)return;
  if(GS.mode!=='play'||!active||PH.dead){interfEnd();return}
  INTERF.t+=dt;const u=post.uniforms;
  if(INTERF.ph===1){const p=Math.min(1,INTERF.t/INTERF.A);
    u.sig.value=Math.max(u.sig.value,.12*p+(Math.random()<.08?.5:0));u.shake.value+=p*2.2;
    if(INTERF.t>=INTERF.A){INTERF.ph=2;INTERF.t=0}
  }else if(INTERF.ph===2){ // piscada: sinal totalmente perdido; no meio dela a câmera é girada e o mundo "muda"
    const p=INTERF.t/INTERF.B;u.sig.value=1;u.shake.value+=4;nosigEl.style.display=(Math.floor(INTERF.t*9)%2===0)?'block':'none';
    if(!INTERF.turned&&p>=.5){INTERF.turned=true;
      P.yaw+=(Math.random()<.5?-1:1)*(Math.PI*(.55+Math.random()*.9));
      for(const id in NET.rem){const r=NET.rem[id];if(r.has&&!r.dead)interfGhost(r,true)}
      if(!Object.keys(NET.rem).length)interfSpawnCopy();
    }
    if(INTERF.t>=INTERF.B){INTERF.ph=3;INTERF.t=0;nosigEl.style.display='none'}
  }else if(INTERF.ph===3){ // desorientado: tremor fraco, falhas curtas de sinal
    u.shake.value+=.5;if(Math.random()<.012)u.sig.value=Math.max(u.sig.value,.5+Math.random()*.4);
    if(INTERF.t>=INTERF.C){INTERF.ph=4;INTERF.t=0;try{nz(.6,.25,2200,1,1.5,0,'bandpass')}catch(e){}}
  }else if(INTERF.ph===4){ // piscada final: tudo volta
    u.sig.value=1;u.shake.value+=3;nosigEl.style.display=(Math.floor(INTERF.t*9)%2===0)?'block':'none';
    if(INTERF.t>=INTERF.D)interfEnd();
  }
  if(INTERF.ph>=2&&INTERF.ph<=3&&INTERF.turned){ // vultos tremem e falham; quando você olha direto para um, ele some
    // durante o apagão os vultos só aparecem nos instantes em que a luz está forte: lampejos entre as piscadas
    const lit=!(typeof BLK!=='undefined'&&BLK.ph>=2&&BLK.ph<=5)||BLK.mx>.55,fl=Math.random()<.93&&lit,fw=camera.getWorldDirection(INTERF.v),cp=camera.position;let sMax=0;
    const eat=r=>{if(!r||!r.ghost||!r.has||r.dead)return false;
      if(r.hideT>0){r.hideT-=dt;r.g.visible=false;if(r.hideT<=0&&r===INTERF.copy)interfMoveCopy(r);return true}
      const dx=r.cur.x-cp.x,dz=r.cur.z-cp.z,d=Math.hypot(dx,dz)||1e-3,g=(fw.x*dx+fw.z*dz)/(d*Math.hypot(fw.x,fw.z)||1),prox=Math.max(0,1-d/12);
      r.lg=g;r.gz=Math.max(0,(r.gz||0)+(g>.94&&d<30?dt:-dt*2));
      if(r.gz>.3){r.gz=0;r.hideT=3+Math.random()*3;r.g.visible=false;u.sig.value=1;u.shake.value+=3;try{nz(.25,.3,2600,1,2,0,'bandpass')}catch(e){}return true} // sumiu
      sMax=Math.max(sMax,prox*prox*(.25+.75*Math.pow(Math.max(0,g),3)));r.g.visible=fl;return false};
    for(const id in NET.rem)eat(NET.rem[id]);
    // passos vindos da posição do vulto (mesmo escondido): o jogador procura a direção do som
    INTERF.vo=(INTERF.vo===undefined?4:INTERF.vo)-dt;   // o vulto/cópia "fala" com um trecho da voz de um jogador, vindo da posição dele
    if(INTERF.vo<=0&&typeof VOICE!=='undefined'&&VOICE.mimic){INTERF.vo=7+Math.random()*8;
      const src=[];for(const id in NET.rem){const r=NET.rem[id];if(r&&r.ghost&&r.has&&!r.dead)src.push({id,r})}
      if(INTERF.copy)src.push({id:null,r:INTERF.copy});
      if(src.length){const q=src[Math.floor(Math.random()*src.length)];VOICE.mimic(q.id,q.r.cur.x,q.r.cur.z)}}
    INTERF.sa-=dt;
    if(INTERF.sa<=0){INTERF.sa=.5+Math.random()*.35;
      const stp=r=>{if(!r||!r.ghost||!r.has||r.dead)return;if(r.spd<.8)return;
        const x=r.cur.x,z=r.cur.z;if(Math.hypot(x-cp.x,z-cp.z)>32)return;
        sndAt({x,z},()=>{SV=attn(x,z)*1.15*((typeof BLK!=='undefined'&&BLK.ph>=4)?1.5:1);sfx('step',.9);SV=1})};
      for(const id in NET.rem)stp(NET.rem[id]);stp(INTERF.copy)}
    if(INTERF.copy){const r=INTERF.copy;animRemote(r,dt);const hid=eat(r);if(!hid&&Math.random()<.04)r.g.visible=false;if(!r.g.parent)scene.add(r.g);
      // a cópia só anda quando você NÃO está olhando para ela: vem devagar na sua direção e para a uns 3,5 m
      const dx=cp.x-r.cur.x,dz=cp.z-r.cur.z,d=Math.hypot(dx,dz)||1,go=!hid&&(r.lg===undefined||r.lg<.5)&&d>3.5;
      if(go){const nx=r.cur.x+dx/d*1.25*dt,nz2=r.cur.z+dz/d*1.25*dt;let ok=true;
        for(const b of solids){if(nx>b.minX-.4&&nx<b.maxX+.4&&nz2>b.minZ-.4&&nz2<b.maxZ+.4){ok=false;break}}
        if(ok){r.cur.x=r.tgt.x=nx;r.cur.z=r.tgt.z=nz2}else r.spd=0;
        r.yaw=Math.atan2(-dx,-dz)}
      if(go)r.spd=ok?1.6:0;else r.spd=0}
    INTERF.gm.opacity=.85+Math.random()*.1;
    INTERF.st+=(sMax-INTERF.st)*Math.min(1,dt*6);
    if(INTERF.st>.02){u.sig.value=Math.max(u.sig.value,Math.min(.9,INTERF.st*1.05)*(Math.random()>.12?1:.5));u.shake.value+=INTERF.st*3}
  }
}
addEventListener('keydown',e=>{if(!e.repeat&&e.code===INTERF.key)interfStart()});
