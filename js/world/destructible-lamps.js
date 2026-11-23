// [HORNCAM] js/world/destructible-lamps.js
// ---------- lâmpadas destrutíveis ----------

function sparkShower(c,n){
  const hw=(L0=>L0&&L0.parameters?L0.parameters.width/2:.8)(null);
  for(let i=0;i<n;i++)deb1(new V3(c.x+R2(-.7,.7),c.y-.12,c.z+R2(-.2,.2)),new V3(R2(-.4,.4),-.3,R2(-.4,.4)),'spark',R2(.008,.016),R2(1.6,3),R2(.8,1.7));
}
function breakLamp(i,quiet){
  const L=lamps[i];if(!L)return;
  const first=!L.dead;L.dead=true;L.off=true;if(first)L.fz=quiet?0:.45;
  if(quiet)return;
  sparkShower(L.p.position,first?100:18);
  if(first){for(let i=0;i<7;i++)puff(L.p.position.clone().add(new V3(R2(-.6,.6),R2(-.35,-.1),R2(-.15,.15))),new V3(0,-.2,0),R2(.7,1.4),0x3a3b3a,R2(2.5,4.5),.55,.35);
    nz(.12,.5,6000,1,2,.2,'highpass');tn(2200,300,.2,.12,'sawtooth');nz(.06,.4,3000,1,3,.1,'bandpass',.05);}
}
function hitLamp(i){
  const L=lamps[i];if(!L)return;const first=!L.dead;
  breakLamp(i,false);if(first)NET.send({t:'lp',i});
}

