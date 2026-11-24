// [HORNCAM] js/world/outdoor-fog.js
// ---------- Neblina volumétrica falsa estilo Silent Hill, barata para celular ----------
// A névoa do three (FogExp2) passa a depender da POSIÇÃO NO MUNDO de cada pixel, não de onde a câmera está:
//  · fora dos galpões a névoa é densa, pálida, mais grossa rente ao chão e com manchas largas de densidade (rolos de neblina);
//  · dentro dos galpões continua escura e fina;
//  · de dentro do galpão, o exterior visto pelo portão aparece enevoado, e de fora a neblina engole os postes e as paredes.
// Custo: só duas contas por pixel (uma máscara sem loop pesado e dois senos); nada de sprites, nem passes extras, nem texturas.
(function(){
  const boxes=WH.map(w=>`vec4(${(w.x).toFixed(1)},${(w.z).toFixed(1)},21.0,26.0)`).join(',');
  const SC=THREE.ShaderChunk;
  SC.fog_pars_vertex=`#ifdef USE_FOG
varying float fogDepth;varying vec3 fogW;
#endif`;
  SC.fog_vertex=`#ifdef USE_FOG
fogDepth=-mvPosition.z;fogW=cameraPosition+mvPosition.xyz*mat3(viewMatrix);
#endif`;
  SC.fog_pars_fragment=`#ifdef USE_FOG
uniform vec3 fogColor;uniform float fogDensity;uniform vec4 uFL;uniform vec4 uFD;varying float fogDepth;varying vec3 fogW;
const vec4 FBX[${WH.length}]=vec4[${WH.length}](${boxes});
float fogInside(vec2 p){ // 1 dentro de algum galpão (borda suave de 3 m), 0 fora
  if(abs(p.y)<38.0)return 0.0; // faixa do pátio: nenhum galpão
  float m=0.0;
  for(int i=0;i<${WH.length};i++){vec4 b=FBX[i];vec2 d=abs(p-b.xy)-b.zw;float e=max(d.x,d.y);m=max(m,1.0-smoothstep(-3.0,0.0,e));}
  return m;}
#endif`;
  SC.fog_fragment=`#ifdef USE_FOG
{ float ins=fogInside(fogW.xz);
  if(ins>0.0)ins*=fogInside(cameraPosition.xz); // por fora, as paredes e o telhado dos galpões levam a neblina densa; a névoa fina só vale quando a câmera também está dentro
  float lay=mix(1.5,.6,smoothstep(.0,14.0,fogW.y));                       // mais densa perto do chão
  float cl=1.0+.32*sin(fogW.x*.037+fogW.z*.021)*sin(fogW.z*.043-fogW.x*.017); // manchas largas
  float dOut=fogDensity*2.1*lay*cl;
  float dn=mix(dOut,fogDensity,ins);
  float fogFactor=1.0-exp(-dn*dn*fogDepth*fogDepth);
  if(uFL.w>0.0){vec3 fv=fogW-uFL.xyz;float fL=length(fv);float fb=smoothstep(.86,.97,dot(fv/max(fL,.01),uFD.xyz))*uFL.w;
    fogFactor*=1.0-.8*fb*(1.0-smoothstep(5.0,22.0,fL));} // o facho da lanterna rasga a neblina: dentro do cone a névoa some (menos perto, mais longe)
  vec3 fc=mix(fogColor,vec3(.043,.067,.047),ins);
  gl_FragColor.rgb=mix(gl_FragColor.rgb,fc,fogFactor);}
#endif`;
  // uniformes COMPARTILHADOS da lanterna (objetos simples {x,y,z,w}: o three só copia por referência quando clona os uniformes dos materiais)
  const UFL={x:0,y:0,z:0,w:0},UFD={x:0,y:0,z:-1,w:.9};
  for(const k in THREE.ShaderLib){const u=THREE.ShaderLib[k].uniforms;if(u&&u.fogDensity){u.uFL={value:UFL};u.uFD={value:UFD}}}
  // fundo: acompanha a cor da neblina de onde a câmera está
  const BGI=new THREE.Color(0x090d0a),BGO=new THREE.Color(0x14191a),OUT=new THREE.Color(0x151a17),tmp=new THREE.Color();
  let k=0,last=performance.now();
  const loop=now=>{requestAnimationFrame(loop);const dt=Math.min(.1,(now-last)/1000);last=now;
    scene.fog.color.copy(OUT);
    if(typeof dust!=='undefined'){const U=dust.material.uniforms,on=typeof flashOn!=='undefined'&&flashOn&&typeof active!=='undefined'&&active;
      UFL.x=U.cp.value.x;UFL.y=U.cp.value.y;UFL.z=U.cp.value.z;UFL.w=on?1:0;UFD.x=U.cf.value.x;UFD.y=U.cf.value.y;UFD.z=U.cf.value.z;
      // e a neblina deixa o cone da lanterna mais visível (luz espalhada no ar): mais forte do lado de fora
      if(typeof beam!=='undefined'&&beam.material.uniforms.kf)beam.material.uniforms.kf.value=1+1.7*k}
    if(typeof active==='undefined'||!active){k=0;scene.background.copy(BGI);if(camera.far!==140){camera.far=140;camera.updateProjectionMatrix()}return}
    const cp=camera.position,out=!(typeof LREG!=='undefined'&&LREG.whAt(cp.x,cp.z)>=0);
    k+=((out?1:0)-k)*Math.min(1,dt*1.2);
    // com a neblina densa, o que passa de ~85 m já é névoa total: o alcance da câmera encolhe e a GPU deixa de desenhar o fundo (prédios, árvores, postes distantes)
    const far=140-55*k;if(Math.abs(camera.far-far)>.5){camera.far=far;camera.updateProjectionMatrix()}
    scene.background.copy(tmp.copy(BGI).lerp(BGO,k));
  };requestAnimationFrame(loop);
})();
