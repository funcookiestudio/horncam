// [HORNCAM] js/core/scene.js
// ---------- Cena ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090d0a);
scene.fog = new THREE.FogExp2(0x0b110c, 0.018); // neblina esverdeada escura
const camera = new THREE.PerspectiveCamera(80, 1, 0.1, 140);
scene.add(camera);
