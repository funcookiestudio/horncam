// [HORNCAM] js/effects/muzzle-smoke.js
// ---------- Fumaça saindo da boca da arma depois dos disparos (alguns segundos, esmaecendo) ----------
// Detecta cada disparo pelo clarão (W.fl), faz um sopro inicial e depois um fiapo contínuo que vai rareando.
// Usa o mesmo sistema de partículas leves da poeira (puff), sem mesh nem luz nova.
(function(){
  let prevFl=0,prevW=0,smoke=0,acc=0,last=performance.now();const P3=new V3(),F3=new V3(),UP=new V3(0,1,0);
  const loop=now=>{requestAnimationFrame(loop);const dt=Math.min(.1,(now-last)/1000);last=now;
    if(typeof active==='undefined'||!active||typeof fl==='undefined'||typeof puff!=='function'){prevFl=0;smoke=0;return}
    const wc=typeof wpnCur==='function'?wpnCur():0;if(wc!==prevW){prevW=wc;smoke=0;prevFl=W.fl}   // trocou de arma: a nova ainda não atirou, sem fumaça
    const shot=W.fl>0&&prevFl<=0;prevFl=W.fl;
    if(shot){smoke=Math.min(3.5,smoke+(W.cd>.5?1.7:1.2));acc=1}      // cada tiro estende a fumaça (máx. ~3,5 s)
    if(smoke<=0)return;smoke-=dt;
    // fluxo contínuo: muitas partículas pequenas, translúcidas e sobrepostas a cada quadro (forma uma coluna, não bolinhas separadas)
    acc+=dt*(isTouch?32:58)*Math.min(1,smoke/1.6);
    fl.getWorldPosition(P3);camera.getWorldDirection(F3);
    for(let k=0;acc>=1&&k<3;k++,acc-=1){
      const n=F3.clone().multiplyScalar(.18).addScaledVector(UP,.12);
      puff(P3.clone().addScaledVector(F3,R2(0,.03)),n,R2(.09,.16)*(shot?1.5:1),0xdcdcd8,R2(1.3,2),R2(.08,.14)*Math.min(1,.45+smoke/3),0)}
  };requestAnimationFrame(loop);
})();
