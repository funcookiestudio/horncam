// [HORNCAM] js/rendering/lv-shader.js
// ===== LEITURA DO VOLUME DE LUZ NOS MATERIAIS (fase 4) =====
// Carregado ANTES de qualquer material do jogo. Todo MeshStandard/Phong que passa pelo compilador ganha, no fim do
// bloco de luzes, a luz do volume do galpão ativo (1 leitura de textura 3D + 3 para a direção), no lugar das PointLights.
// Os uniforms são objetos compartilhados (LVU): atualizar o valor atualiza todos os materiais de uma vez.
const LVU={
  tex:{value:null},org:{value:new THREE.Vector3()},size:{value:new THREE.Vector3(1,1,1)},
  tint:{value:new THREE.Vector3(1,.93,.66)},   // luz de lâmpada velha: amarelo doentio (antes azul-branca 0xcfe0ff)
  on:{value:0},gain:{value:1},cs:{value:1},
  refl:{value:0},dirt:{value:0},   // reflexos no chão / sujeira procedural (opções do jogador; 0 = desligado e sem custo)
  tex2:{value:null},org2:{value:new THREE.Vector3()},size2:{value:new THREE.Vector3(1,1,1)},on2:{value:0},mul2:{value:new THREE.Vector4(1,0,0,0)}, // volume SECUNDÁRIO: o galpão visitado antes (visto por buracos/janelas)
  mul:{value:new THREE.Vector4(1,0,0,0)}};   // pesos dos 4 canais (estável, defeito 1, defeito 2, partida)
(function(){
  const dummy=new THREE.DataTexture3D(new Uint16Array(4),1,1,1);dummy.format=THREE.RGBAFormat;dummy.type=THREE.HalfFloatType;dummy.internalFormat='RGBA16F';
  dummy.minFilter=dummy.magFilter=THREE.LinearFilter;dummy.unpackAlignment=1;dummy.needsUpdate=true;LVU.tex.value=dummy;LVU.tex2.value=dummy;LVU.dummy=dummy;
  const FRAG_DECL=`
varying vec3 vLvP;
precision highp sampler3D;
uniform sampler3D lvTex;uniform vec3 lvOrg;uniform vec3 lvSize;uniform vec3 lvTint;uniform float lvOn;uniform float lvGain;uniform float lvCs;uniform vec4 lvMul;uniform float lvRefl;uniform float lvDirt;
uniform sampler3D lvTex2;uniform vec3 lvOrg2;uniform vec3 lvSize2;uniform float lvOn2;uniform vec4 lvMul2;
float lvH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float lvN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(lvH(i),lvH(i+vec2(1.,0.)),f.x),mix(lvH(i+vec2(0.,1.)),lvH(i+vec2(1.,1.)),f.x),f.y);}
// sujeira por posição no mundo: manchas, mofo na base das superfícies, escorridos nas paredes e sangue seco no chão
vec3 lvGrime(vec3 col,vec3 p,vec3 n){
  float up=smoothstep(.75,.95,n.y),low=1.-smoothstep(0.,1.6,p.y);
  float big=lvN(p.xz*.35+p.y*.1),mid=lvN(p.xz*1.7+vec2(p.y*2.1,0.)),fine=lvN(p.xz*7.+p.y*5.);
  float stain=0.;                    // borda larga = umidade difusa, sem recorte duro
  float mold=0.;
  float drip=0.;
  col*=1.-.15*stain*(.55+.45*lvN(p.xz*13.+p.y*3.));
  col=mix(col,col*vec3(.86,.76,.6),stain*.4);                       // mancha = sujeira amarronzada, não sombra
  col=mix(col,col*vec3(.55,.78,.42),mold*.75);
  vec2 g=floor(p.xz/7.);float hv=lvH(g+.5);
  if(hv>.9&&up>.5){vec2 c=(g+.2+.6*vec2(lvH(g+3.1),lvH(g+7.7)))*7.;float r=.35+.9*lvH(g+9.3),d=length(p.xz-c)+(lvN(p.xz*6.)-.5)*.35;
    float bm=(1.-smoothstep(r*.5,r,d))*up,rim=smoothstep(r*.55,r*.8,d)*(1.-smoothstep(r*.8,r,d));
    col=mix(col,vec3(.24,.03,.022)*(.55+.9*lvN(p.xz*17.)),bm*.78+rim*.25);}   // sangue: miolo manchado, borda mais escura
  return col;}
float lvT(vec3 p,bool s){vec3 u=s?(p-lvOrg2)/lvSize2:(p-lvOrg)/lvSize;vec3 t=vec3(u.x,u.z,u.y);return s?dot(textureLod(lvTex2,t,0.),lvMul2):dot(textureLod(lvTex,t,0.),lvMul);}
float lvMask(vec3 u){return smoothstep(0.,.05,min(min(u.x,1.-u.x),min(u.z,1.-u.z)))*smoothstep(1.,.93,u.y)*step(0.,u.y+.02);}
`;
  const FRAG_USE=`
if(lvOn>0.){
  vec3 lvp=vLvP;
  float lvm=lvMask((lvp-lvOrg)/lvSize);bool lvsec=false;
  if(lvm<=0.&&lvOn2>0.){lvm=lvMask((lvp-lvOrg2)/lvSize2);lvsec=true;}   // fora do volume ativo: vê o galpão visitado antes (buraco, janela)
  if(lvm>0.){
    vec3 lwn=inverseTransformDirection(normal,viewMatrix);
    vec3 lsp=lvp+lwn*lvCs*.55;                                       // amostra no ar da sala, não dentro da célula da parede/chão (tira a faixa escura no pé)
    float lc=lvT(lsp,lvsec);
    vec3 lg=vec3(lvT(lsp+vec3(lvCs,0.,0.),lvsec)-lc,lvT(lsp+vec3(0.,lvCs,0.),lvsec)-lc,lvT(lsp+vec3(0.,0.,lvCs),lvsec)-lc);
    float lgl=length(lg);vec3 ld=lgl>1e-4?lg/lgl:lwn;
    float lnl=mix(.04,1.,smoothstep(-.1,.68,dot(lwn,ld)));   // face de costas para a luz (lado de fora da parede) quase não recebe: sem vazamento pela parede
    float lao=lwn.y>.5?1.:mix(.5,1.,smoothstep(0.,1.5,lvp.y))*mix(.72,1.,smoothstep(0.,1.2,6.4-lvp.y));   // contato: base e topo de paredes e colunas mais escuros
    reflectedLight.directDiffuse+=lc*lvGain*lvm*lnl*lao*lvTint*material.diffuseColor;
    // chão molhado: reflete a luz do plano das lâmpadas na direção do espelho (1 leitura extra); poças por ruído
    if(lvRefl>0.&&lwn.y>.9&&lvp.y<.25){
      vec3 lvV=normalize(cameraPosition-lvp),rv=reflect(-lvV,lwn);
      if(rv.y>.04){
        float pud=smoothstep(.5,.72,lvN(lvp.xz*.55+3.7)*.7+lvN(lvp.xz*2.3)*.3),sheen=.16+.84*pud;
        vec3 q=lvp+rv*((6.3-lvp.y)/rv.y),qu=lvsec?(q-lvOrg2)/lvSize2:(q-lvOrg)/lvSize;
        if(qu.x>0.&&qu.x<1.&&qu.z>0.&&qu.z<1.){
          float sl=lvT(q,lvsec),fr=.04+.96*pow(1.-max(dot(lwn,lvV),0.),4.);
          reflectedLight.directSpecular+=lvTint*smoothstep(.6,2.4,sl)*sl*fr*sheen*lvRefl*lvm*lvGain*.9;}}}
  }
}
`;
  function lvPatch(sh,m){
    if(!(m.isMeshStandardMaterial||m.isMeshPhongMaterial))return;
    const f=sh.fragmentShader,v=sh.vertexShader;
    if(f.indexOf('#include <lights_fragment_begin>')<0||v.indexOf('#include <project_vertex>')<0||f.indexOf('#include <common>')<0||v.indexOf('#include <common>')<0)return;
    const gl=f.indexOf('#include <lights_physical_fragment>')>=0?'#include <lights_physical_fragment>':(f.indexOf('#include <lights_phong_fragment>')>=0?'#include <lights_phong_fragment>':'');
    sh.vertexShader=v.replace('#include <common>','#include <common>\nvarying vec3 vLvP;').replace('#include <project_vertex>','#include <project_vertex>\n{vec4 lvw=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nlvw=instanceMatrix*lvw;\n#endif\nvLvP=(modelMatrix*lvw).xyz;}');
    sh.fragmentShader=f.replace('#include <common>','#include <common>\n'+FRAG_DECL).replace('#include <lights_fragment_begin>','#include <lights_fragment_begin>\n'+FRAG_USE);
    if(gl)sh.fragmentShader=sh.fragmentShader.replace(gl,'if(lvDirt>0.)diffuseColor.rgb=mix(diffuseColor.rgb,lvGrime(diffuseColor.rgb,vLvP,inverseTransformDirection(normal,viewMatrix)),lvDirt);\n'+gl);
    sh.uniforms.lvTex=LVU.tex;sh.uniforms.lvOrg=LVU.org;sh.uniforms.lvSize=LVU.size;sh.uniforms.lvTint=LVU.tint;sh.uniforms.lvOn=LVU.on;sh.uniforms.lvGain=LVU.gain;sh.uniforms.lvCs=LVU.cs;sh.uniforms.lvMul=LVU.mul;sh.uniforms.lvTex2=LVU.tex2;sh.uniforms.lvOrg2=LVU.org2;sh.uniforms.lvSize2=LVU.size2;sh.uniforms.lvOn2=LVU.on2;sh.uniforms.lvMul2=LVU.mul2;sh.uniforms.lvRefl=LVU.refl;sh.uniforms.lvDirt=LVU.dirt}
  Object.defineProperty(THREE.Material.prototype,'onBeforeCompile',{configurable:true,
    get(){return this._lvW||(this._lvW=(function(m){return function(sh,r){if(m._lvO)m._lvO.call(m,sh,r);lvPatch(sh,m)}})(this))},
    set(fn){this._lvO=fn}});
  THREE.Material.prototype.customProgramCacheKey=function(){return(this._lvO?this._lvO.toString():'')+'|lv1'};
})();
