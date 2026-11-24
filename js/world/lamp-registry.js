// [HORNCAM] js/world/lamp-registry.js
// ===== REGISTRO ÚNICO DE LUMINÁRIAS (fase 2 do plano de luz em volume) =====
// Todas as 690 luminárias (69 por galpão) são emissoras de luz. Aqui ficam organizadas por galpão e por corredor,
// com os parâmetros de emissão que a grade de luz (fase 3) vai ler. Nada aqui altera o render atual:
// o pool de PointLights legado continua usando L.real até a fase 4 removê-lo.
const LREG=(function(){
  const NW=WH.length,byWh=WH.map(()=>[]),byCor=WH.map(()=>Array.from({length:NCOR},()=>[]));
  // parâmetros de luz das luminárias antes só visuais (painéis): luz mais curta e fraca que as grandes (alcance 24)
  const VIS_RANGE=12,VIS_I=.45;
  for(const L of lamps){
    const small=L.real&&L.range<24;
    L.lv=true;                                    // emissora de luz no volume
    L.lvRange=L.real?L.range:VIS_RANGE;           // alcance em metros
    L.lvI=L.real?L.base:VIS_I;                    // intensidade-base
    byWh[L.wi].push(L.id);byCor[L.wi][L.cor].push(L.id);
  }
  // defeituosas: no máximo 2 canais de piscar por galpão no volume, então as lâmpadas com defeito viram 2 grupos (esquerda/direita) e cada grupo
  // pisca junto, como um circuito com falha. L.lead = lâmpada que dita o piscar do grupo; BADG[wi] = [[ids do grupo 0],[ids do grupo 1]]
  const BADG=WH.map(()=>[[],[]]);
  for(let wi=0;wi<NW;wi++){const bl=byWh[wi].filter(id=>lamps[id].bad&&!lamps[id].dead).sort((a,b)=>lamps[a].pos.x-lamps[b].pos.x||a-b);
    const h=Math.ceil(bl.length/2);bl.forEach((id,i)=>BADG[wi][i<h?0:1].push(id));
    for(const g of BADG[wi]){const lead=g.length?Math.min(...g):-1;for(const id of g)lamps[id].lead=lead}}
  // galpão que contém o ponto (x,z); -1 fora. Planta 40x50 m centrada em (w.x,w.z), com folga de 1 m nas paredes
  function whAt(x,z){for(const w of WH){if(Math.abs(x-w.x)<=21&&Math.abs(z-w.z)<=26)return w.i}return -1}
  // emissores vivos de um galpão: posição da fonte, alcance, intensidade atual (apagada/piscando já considerada) e corredor
  function emitters(wi,out){out=out||[];out.length=0;
    for(const id of byWh[wi]){const L=lamps[id];
      const I=L.off?0:L.lvI*(L.bad?L.f:1)*(L.su===undefined?1:L.su);
      out.push({id,x:L.pos.x,y:L.pos.y-L.ly,z:L.pos.z,range:L.lvRange,I,cor:L.cor})}
    return out}
  // lâmpadas relevantes para efeitos de câmera (halo de lente, exposição): as do galpão onde a câmera está; fora de galpões, as reais legadas
  const lists=byWh.map(a=>a.map(id=>lamps[id]));
  function nearLamps(){const wi=whAt(camera.position.x,camera.position.z);return wi>=0?lists[wi]:RL}
  return {nearLamps,byWh,byCor,BADG,whAt,emitters,NW,VIS_RANGE,VIS_I,cur:-1}
})();
