// [HORNCAM] js/core/renderer.js
const isTouch = matchMedia('(pointer:coarse)').matches;
const canvas = document.getElementById('c');
let renderer;
try{renderer = new THREE.WebGLRenderer({canvas, antialias:false});}catch(err){document.getElementById('ov').querySelector('p').textContent='WebGL indisponível neste navegador: '+err.message;throw err;}
renderer.setPixelRatio(1); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap;
// ---------- Filtragem de textura (custo ~zero: só configura o sampler) ----------
// Anisotropia limitada pela capacidade REAL da GPU e por um teto sensato (8x desktop / 4x mobile / 2x mobile fraco).
// Obs.: three r128 não usa colorSpace (r152+); o equivalente é .encoding. O projeto inteiro trabalha em espaço linear
// sem conversão sRGB (cores hex, post-process e saída consistentes), então as texturas ficam em LinearEncoding de propósito.
const ANISO=Math.max(1,Math.min(renderer.capabilities.getMaxAnisotropy?renderer.capabilities.getMaxAnisotropy():1,8));
function texQ(t){t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=ANISO;return t}

