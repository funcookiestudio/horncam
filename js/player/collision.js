// [HORNCAM] js/player/collision.js
// ---------- Colisão do jogador contra os sólidos (consulta espacial) ----------
function collide0(){
  const nearbySolids=spatialQuery(spatialSolids,P.pos.x-P.r,P.pos.x+P.r,P.pos.z-P.r,P.pos.z+P.r);
  spatialStats.solidCandidates=nearbySolids.size;
  for(const b of nearbySolids){
    const cx=Math.max(b.minX,Math.min(P.pos.x,b.maxX)),cz=Math.max(b.minZ,Math.min(P.pos.z,b.maxZ));
    const dx=P.pos.x-cx,dz=P.pos.z-cz,d=Math.hypot(dx,dz);
    if(d<P.r){
      if(d>1e-4){P.pos.x+=dx/d*(P.r-d);P.pos.z+=dz/d*(P.r-d);}
      else{P.pos.x+=P.r;}
    }
  }
}


