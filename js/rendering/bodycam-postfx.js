// [HORNCAM] js/rendering/bodycam-postfx.js
// ---------- Pós-processamento body cam ----------
// MSAA no alvo de render (renderer antialias:false só afeta o canvas final, que desenha apenas o quad de pós-processo).
// Padrão: 2 amostras em WebGL2. Ajuste via URL: ?msaa=0 | 2 | 4
const MSAA=(()=>{const q=new URLSearchParams(location.search).get('msaa'),mx=renderer.capabilities.maxSamples||4;
  if(q!==null&&q!=='')return Math.max(0,Math.min(parseInt(q)||0,mx));return renderer.capabilities.isWebGL2?Math.min(2,mx):0})();
const rtOpt={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter};
const rt=(MSAA>0&&THREE.WebGLMultisampleRenderTarget)?Object.assign(new THREE.WebGLMultisampleRenderTarget(2,2,rtOpt),{samples:MSAA}):new THREE.WebGLRenderTarget(2,2,rtOpt);
const post=new THREE.ShaderMaterial({
  uniforms:{t:{value:rt.texture},time:{value:0},res:{value:new THREE.Vector2(1,1)},shake:{value:0},sig:{value:0},fk:{value:1},glare:{value:0},lpos:{value:new THREE.Vector2(.5,.5)}},
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position,1.);}',
  fragmentShader:`
  varying vec2 v; uniform sampler2D t; uniform float time,shake,sig,glare,fk; uniform vec2 res,lpos;
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){
    vec2 c=v-.5; float r2=dot(c,c);
    vec2 d=c*(1.+1.1*r2*fk)*(1.-.14*fk);               // olho de peixe
    d.x+=(h(vec2(floor(time*24.),1.))-.5)*.0015*shake;
    vec2 u=d+.5;
    float band=h(vec2(floor(v.y*18.),floor(time*14.)));
    u.x+=(band-.5)*.12*sig*step(.55,band)+(h(vec2(floor(v.y*200.),floor(time*30.)))-.5)*.02*sig;
    float ca=(.006+.02*r2)*(1.+sig*8.);                    // aberração cromática
    vec3 col=vec3(texture2D(t,u+c*ca).r,texture2D(t,u).g,texture2D(t,u-c*ca).b);
    if(u.x<0.||u.x>1.||u.y<0.||u.y>1.) col=vec3(0.);
    float l=dot(col,vec3(.299,.587,.114));
    col=mix(vec3(l),col,.7);                 // dessatura
    col=(col-.5)*1.18+.5+.02;                // contraste
    col*=vec3(1.0,1.03,1.0);                 // leve tom esverdeado
    if(glare>.001){                          // luz forte direto na lente
      vec2 dl=v-lpos; dl.x*=res.x/res.y; float dd=length(dl);
      float core=exp(-dd*dd*900.), halo=exp(-dd*6.5), mid=exp(-dd*22.);
      float streak=exp(-abs(dl.y)*70.)*exp(-abs(dl.x)*2.2);       // risco horizontal (anamórfico)
      col*=1.-glare*.38*(1.-halo);                                 // auto-exposição: a cena escurece
      col=mix(col,vec3(.62,.68,.70),glare*.22*(.4+halo));          // véu de luz: perde contraste
      col+=vec3(1.,.96,.88)*(core*1.6+mid*.9+halo*.45)*glare;      // halo estourando
      col+=vec3(.35,.55,1.)*streak*glare*.55;
      col.r+=halo*glare*.05; col.b+=mid*glare*.08;
    }
    float g=h(v*res+fract(time)*100.)-.5;    // ruído
    col+=g*.12;
    col*=.93+.07*sin(v.y*res.y*1.6+time*8.);   // scanlines
    col*=.96+.04*sin(time*60.);              // flicker do sensor
    col*=1.-smoothstep(.25,.95,length(c)*1.25); // vinheta
    float sn=h(v*res*1.7+fract(time*9.)*61.);
    col=mix(col,vec3(l*.6),sig*.5);
    col+=vec3(.2,.0,.25)*sig*step(.985,h(vec2(floor(v.y*60.),floor(time*20.))));
    col=mix(col,vec3(sn*.85),smoothstep(.55,1.,sig));
    gl_FragColor=vec4(col,1.);
  }`,
  depthTest:false,depthWrite:false
});
const quadScene=new THREE.Scene(), quadCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),post));

function resize(){
  const w=innerWidth,h=innerHeight;
  renderer.setSize(w,h,false);
  const k=(matchMedia('(pointer:fine)').matches&&Math.max(w,h)>=1100)?.4:.55; rt.setSize(Math.max(2,Math.floor(w*k)),Math.max(2,Math.floor(h*k)));
  post.uniforms.res.value.set(rt.width,rt.height);
  camera.aspect=w/h; camera.updateProjectionMatrix();
  fitMenuCam(w/h);
}
addEventListener('resize',resize); resize();

