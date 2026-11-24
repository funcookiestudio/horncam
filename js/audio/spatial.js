// [HORNCAM] js/audio/spatial.js
// ---------- Som espacial dos eventos do mundo: volume por distância + balanço estéreo ----------
// Envolve as funções que geram som de coisas quebrando/explodindo/abrindo. Os tiros do próprio jogador não passam por aqui (saem na posição da câmera).
(function(){
  const wrap=(name,pos,k)=>{const f=self[name];if(typeof f!=='function')return;
    self[name]=function(){const a=arguments,o=pos.apply(this,a);return o?sndAt(o,()=>f.apply(this,a),k):f.apply(this,a)}};
  const arr=p=>p?{x:p[0],z:p[2]}:null;
  wrap('decFx',function(k,q,p){return arr(p)});                       // vidro, caixas, lâmpadas decorativas...
  wrap('voxFx',function(pt){return pt});                              // concreto/tijolo
  wrap('steelFx',function(pt){return pt});
  wrap('propFx',function(pt){return pt});
  wrap('blast',function(pt){return pt},.07);                          // explosão: ouvida de bem mais longe
  wrap('breakLamp',function(i){const L=lamps[i];return L&&L.p?L.p.position:null});
  wrap('setDoor',function(d){return d?{x:d.hx,z:d.hz}:null});
  wrap('setBreaker',function(wi){const b=BRKW[wi];return b?{x:b.x,z:b.z}:null});
})();
