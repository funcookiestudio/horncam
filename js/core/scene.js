// [HORNCAM] js/core/scene.js
// ---------- Cena ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c0d);
scene.fog = new THREE.FogExp2(0x0a0c0d, 0.018);
const camera = new THREE.PerspectiveCamera(80, 1, 0.1, 140);
scene.add(camera);
