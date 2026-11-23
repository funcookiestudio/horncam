// [HORNCAM] js/ui/touch-controls.js
// ===== editor de layout dos botões (arrastar, redimensionar, salvar) =====
(function(){
  const T=document.getElementById('touch'),KEY='horncam_layout_v1',btns=[...T.querySelectorAll('.btn')];
  btns.forEach(b=>b.dataset.k=b.dataset.a||b.id);
  const def={};btns.forEach(b=>def[b.dataset.k]={x:b.style.getPropertyValue('--x'),y:b.style.getPropertyValue('--y'),sz:''});
  const num=v=>parseFloat(v)||0,gv=(b,n)=>b.style.getPropertyValue(n);
  function apply(m){btns.forEach(b=>{const d=m[b.dataset.k];if(!d)return;b.style.setProperty('--x',d.x);b.style.setProperty('--y',d.y);
    if(d.sz)b.style.setProperty('--sz',d.sz);else b.style.removeProperty('--sz');});}
  try{const sv=localStorage.getItem(KEY);if(sv)apply(JSON.parse(sv));}catch(e){}
  const panel=document.getElementById('edpanel'),gear=document.getElementById('edgear');
  let editing=false,sel=null,drag=null;
  function select(b){if(sel)sel.classList.remove('sel');sel=b;if(b)b.classList.add('sel');}
  function setEdit(on){editing=on;T.classList.toggle('editing',on);panel.style.display=on?'flex':'none';gear.style.display=on?'none':'flex';
    if(!on){select(null);drag=null;}else{input.sprint=false;W.trig=false;W.aim=false;}}
  gear.addEventListener('pointerdown',e=>{e.preventDefault();setEdit(true);});
  T.addEventListener('pointerdown',e=>{
    if(!editing)return;const b=e.target.closest('.btn');if(!b)return;
    e.stopPropagation();e.preventDefault();select(b);
    drag={id:e.pointerId,b,sx:e.clientX,sy:e.clientY,x:num(gv(b,'--x')),y:num(gv(b,'--y'))};
    try{b.setPointerCapture(e.pointerId);}catch(_){}
  },true);
  T.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const b=drag.b,w=b.getBoundingClientRect().width,dx=e.clientX-drag.sx,dy=e.clientY-drag.sy,
      isL=b.classList.contains('l'),isT=b.classList.contains('t');
    let x=drag.x+(isL?dx:-dx),y=drag.y+(isT?dy:-dy);
    x=Math.max(0,Math.min(innerWidth-w,x));y=Math.max(0,Math.min(innerHeight-w,y));
    b.style.setProperty('--x',x+'px');b.style.setProperty('--y',y+'px');
  },true);
  ['pointerup','pointercancel'].forEach(v=>T.addEventListener(v,e=>{if(drag&&e.pointerId===drag.id)drag=null;},true));
  panel.querySelectorAll('.eb').forEach(el=>el.addEventListener('pointerdown',e=>{
    e.preventDefault();const a=el.dataset.e;
    if((a==='plus'||a==='minus')&&sel){const w=sel.getBoundingClientRect().width;
      sel.style.setProperty('--sz',Math.max(32,Math.min(120,Math.round(w+(a==='plus'?6:-6))))+'px');}
    if(a==='reset'){apply(def);try{localStorage.removeItem(KEY);}catch(_){}}
    if(a==='save'){const m={};btns.forEach(b=>m[b.dataset.k]={x:gv(b,'--x'),y:gv(b,'--y'),sz:gv(b,'--sz')});
      try{localStorage.setItem(KEY,JSON.stringify(m));}catch(_){}setEdit(false);}
  }));
})();

// ===== botão de fogo também funciona como analógico de mira =====
(function(){
  const fb=document.querySelector('.btn[data-a="fire"]');let fp=null;
  fb.addEventListener('pointerdown',e=>{fp={id:e.pointerId,x:e.clientX,y:e.clientY};try{fb.setPointerCapture(e.pointerId);}catch(_){}});
  fb.addEventListener('pointermove',e=>{
    if(!fp||e.pointerId!==fp.id)return;
    const dx=e.clientX-fp.x,dy=e.clientY-fp.y;fp.x=e.clientX;fp.y=e.clientY;
    P.yaw-=dx*.0055;P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch-dy*.0055));
  });
  ['pointerup','pointercancel'].forEach(v=>fb.addEventListener(v,e=>{if(fp&&e.pointerId===fp.id)fp=null;}));
})();
