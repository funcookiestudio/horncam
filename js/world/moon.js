// [HORNCAM] js/world/moon.js
// Lua no céu: disco pálido com crateras suaves + halo grande (luz espalhada pela neblina) + névoa passando na frente.
// Fica num quad que segue a câmera (fora do alcance da neblina), só aparece do lado de fora e some ao entrar num galpão.
(function(){
  const D=new THREE.Vector3(-.55,.42,-.72).normalize(),DIST=80,SZ=188;
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,fog:false,blending:THREE.NormalBlending,
    uniforms:{t:{value:0},a:{value:0}},
    vertexShader:'varying vec2 v;void main(){v=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 v;uniform float t,a;
    const vec3 hc=vec3(.50,.62,.80);
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
    float fb(vec2 p){return n(p)*.55+n(p*2.1+3.)*.3+n(p*4.3+7.)*.15;}
    void main(){float r=length(v);
      float R=.055;
      float mist=fb(v*2.2+vec2(t*.02,-t*.015));
      // brilho em volta: bloom suave que cai devagar, modulado pela névoa
      float hal=exp(-r*r*900.)*.55+exp(-r*r*120.)*.22+exp(-r*r*22.)*.10+exp(-r*5.)*.05;
      hal*=.8+.4*mist;
      // halo lunar: anel largo e bem tênue, borda externa avermelhada, só aparece com névoa fina
      float rg=exp(-pow((r-.34)/.05,2.))*.16+exp(-pow((r-.34)/.14,2.))*.07;
      rg*=.4+1.2*smoothstep(.35,.75,fb(v*3.+vec2(t*.01,5.)));
      vec3 rc=mix(vec3(.45,.55,.75),vec3(.80,.60,.50),smoothstep(.30,.40,r))*rg;
      // disco: esfera com mares escuros, crateras claras e escurecimento na borda
      vec2 u=v/R;float rr=length(u);
      float disc=smoothstep(1.,.90,rr);
      float z=sqrt(max(0.,1.-rr*rr));
      float mare=smoothstep(.42,.62,fb(u*1.6+4.));
      float cra=smoothstep(.55,.9,fb(u*7.+9.))*.25;
      float sur=(.92-.34*mare+cra)*(.55+.45*pow(z,.5));
      vec3 col=vec3(.88,.90,.88)*sur*.78;
      float veil=.25+.35*fb(v*3.5+vec2(-t*.03,t*.01));
      vec3 c=hc*hal+rc+col*disc*(1.-veil*.4);
      float al=clamp(hal*.9+disc+rg,0.,1.)*a;
      gl_FragColor=vec4(c*a,al);
    }`});
  const q=new THREE.Mesh(new THREE.PlaneGeometry(SZ,SZ),m);q.frustumCulled=false;q.renderOrder=-10;q.visible=false;scene.add(q);
  let k=0,last=performance.now();
  const loop=now=>{requestAnimationFrame(loop);const dt=Math.min(.1,(now-last)/1000);last=now;
    if(typeof active==='undefined'||!active||typeof camera==='undefined'){q.visible=false;return}
    const cp=camera.position,out=!(typeof LREG!=='undefined'&&LREG.whAt(cp.x,cp.z)>=0);
    k+=((out?1:0)-k)*Math.min(1,dt*1.5);
    q.visible=k>.01;if(!q.visible)return;
    q.position.copy(cp).addScaledVector(D,DIST);q.quaternion.copy(camera.quaternion);
    m.uniforms.t.value=now/1000;m.uniforms.a.value=k*.9;
  };requestAnimationFrame(loop);
})();
