import * as THREE from 'three';

/** GPU-driven particle bursts, explosion rings, cybernetic forcefield shader. */
const vertex=`
attribute vec3 aVelocity;
attribute float aSize;
uniform float uTime;
uniform float uGravity;
uniform float uSize;
varying float vEnergy;
void main() {
 vec3 p=position + aVelocity*uTime + vec3(0.0,-0.5*uGravity*uTime*uTime,0.0);
 vec4 mv=modelViewMatrix*vec4(p,1.0);
 gl_Position=projectionMatrix*mv;
 gl_PointSize=clamp(aSize*uSize*(150.0/max(2.0,-mv.z)),1.0,55.0);
 vEnergy=1.0;
}
`;
const fragment=`
precision highp float;
uniform float uOpacity;
uniform vec3 uColor;
uniform float uTime;
uniform float uLife;
varying float vEnergy;
void main(){
 float d=length(gl_PointCoord-.5)*2.0;
 float soft=pow(clamp(1.0-d,0.0,1.0),1.65);
 float life=pow(clamp(1.0-uTime/max(.001,uLife),0.0,1.0),.75);
 if(d>.98)discard;
 gl_FragColor=vec4(uColor,soft*life*uOpacity*vEnergy);
}
`;
const shieldVertex=`
varying vec3 vNormal;varying vec3 vView;varying vec3 vWorld;
void main(){
 vec4 p=modelViewMatrix*vec4(position,1.0);
 vNormal=normalize(normalMatrix*normal);
 vView=normalize(-p.xyz);
 vWorld=position;
 gl_Position=projectionMatrix*p;
}
`;
const shieldFragment=`
precision highp float;
uniform float uTime;uniform vec3 uColor;uniform float uHit;
varying vec3 vNormal;varying vec3 vView;varying vec3 vWorld;
void main(){
 float fresnel=pow(1.0-abs(dot(normalize(vView),normalize(vNormal))),3.4);
 float scan=sin(vWorld.y*21.0-uTime*4.0)*.5+.5;
 float cells=sin(vWorld.x*17.0+vWorld.z*12.0+uTime)*sin(vWorld.z*22.0);
 float a=clamp(fresnel*.65+scan*.055+cells*.025+uHit*.4,0.0,.78);
 gl_FragColor=vec4(uColor*(.5+fresnel*.6+uHit*.7),a);
}
`;
const waveVertex=`
varying vec2 vUv;uniform float uTime;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`;
const waveFragment=`
precision highp float;
varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uOpacity;
void main(){
 float r=length(vUv-.5);
 float a=smoothstep(.47,.39,r)*smoothstep(.31,.37,r);
 gl_FragColor=vec4(uColor,a*uOpacity);
}`;
const clamp=(x,a,b)=>Math.max(a,Math.min(x,b));
export function createCombatVFX(scene,{quality='balanced'}={}){
 const bursts=[],waves=[],lights=[],shields=[];
 const cpuLimit=quality==='mobile'?45:quality==='ultra'?240:125;
 let counter=1234;
 const rand=()=>((counter=(Math.imul(1664525,counter)+1013904223)>>>0)/4294967296);
 function burst(at,{color=0xffbd76,count=70,force=9,life=1.2,gravity=6.0,size=.95,opacity=.9}={}){
  const n=Math.min(cpuLimit,count);
  const positions=new Float32Array(n*3),vel=new Float32Array(n*3),sizes=new Float32Array(n);
  for(let i=0;i<n;i++){
   const ang=rand()*Math.PI*2,up=.15+rand()*.95,r=Math.sqrt(1-up*up),mag=force*(.22+rand()*.9);
   positions[i*3]=(rand()-.5)*.15;positions[i*3+1]=(rand()-.5)*.18;positions[i*3+2]=(rand()-.5)*.15;
   vel[i*3]=Math.cos(ang)*r*mag;
   vel[i*3+1]=up*mag;
   vel[i*3+2]=Math.sin(ang)*r*mag;
   sizes[i]=size*(.5+rand()*1.35);
  }
  const geom=new THREE.BufferGeometry();
  geom.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geom.setAttribute('aVelocity',new THREE.BufferAttribute(vel,3));
  geom.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
  const m=new THREE.ShaderMaterial({
   uniforms:{uTime:{value:0},uGravity:{value:gravity},uSize:{value:1},uLife:{value:life},
    uOpacity:{value:opacity},uColor:{value:new THREE.Color(color)}},
   vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,
   blending:THREE.AdditiveBlending
  });
  const mesh=new THREE.Points(geom,m);mesh.frustumCulled=false;mesh.position.copy(at);scene.add(mesh);
  bursts.push({mesh,life,age:0});return mesh;
 }
 function flash(at,color=0xffad6d,intensity=50,dist=14,time=.21){
  const light=new THREE.PointLight(color,intensity,dist,2);light.position.copy(at);scene.add(light);
  lights.push({light,time,life:time});return light
 }
 function ring(at,radius=3,color=0x64e5ff,life=.48){
  const mesh=new THREE.Mesh(new THREE.RingGeometry(.83,1.0,64),new THREE.ShaderMaterial({
   uniforms:{uTime:{value:0},uColor:{value:new THREE.Color(color)},uOpacity:{value:.84}},
   vertexShader:waveVertex,fragmentShader:waveFragment,transparent:true,depthWrite:false,
   blending:THREE.AdditiveBlending,side:THREE.DoubleSide
  }));
  mesh.position.copy(at);mesh.position.y+=.07;mesh.rotation.x=-Math.PI/2;
  mesh.scale.setScalar(.2);scene.add(mesh);waves.push({mesh,life,age:0,radius});
  return mesh;
 }
 function impact(at){
  burst(at,{color:0xffb878,count:45,force:6,life:.8,gravity:9,size:.72});
  burst(at,{color:0x8ddfff,count:18,force:4,life:.7,gravity:2,size:.53});
  flash(at,0xffa855,19,7,.14);
 }
 function explosion(at,{radius=4,space=false}={}){
  burst(at,{color:0xffa260,count:170,force:radius*4.7,life:1.75,gravity:space?0:3.4,size:1.3});
  burst(at,{color:0x6f829e,count:125,force:radius*1.6,life:2.6,gravity:space?0:1.7,size:2,opacity:.48});
  burst(at,{color:0x9be9ff,count:50,force:radius*2.2,life:.98,gravity:0,size:.57});
  flash(at,0xffb46e,90,23,.36);ring(at,radius,0x8adeff,.68);
 }
 function muzzle(at){
  burst(at,{color:0xb0f9ff,count:35,force:9,life:.24,gravity:0,size:.8});
  flash(at,0x63cdff,22,8,.12)
 }
 function addShield(parent,color=0x50caff,radius=1.35){
  const m=new THREE.ShaderMaterial({
   uniforms:{uTime:{value:0},uColor:{value:new THREE.Color(color)},uHit:{value:0}},
   vertexShader:shieldVertex,fragmentShader:shieldFragment,
   transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide
  });
  const shield=new THREE.Mesh(new THREE.SphereGeometry(radius,56,40),m);
  shield.position.y=1.15;shield.visible=false;parent.add(shield);
  shields.push(shield);return shield;
 }
 function shieldHit(mesh){if(mesh){mesh.visible=true;mesh.material.uniforms.uHit.value=1}}
 function tick(dt){
  for(let i=bursts.length-1;i>=0;i--){
   const b=bursts[i];b.age+=dt;b.mesh.material.uniforms.uTime.value=b.age;
   if(b.age>=b.life){scene.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();bursts.splice(i,1)}
  }
  for(let i=waves.length-1;i>=0;i--){
   const w=waves[i];w.age+=dt;
   w.mesh.scale.setScalar(Math.max(.1,w.radius*w.age/w.life));
   w.mesh.material.uniforms.uOpacity.value=Math.max(0,1-w.age/w.life)*.78;
   w.mesh.material.uniforms.uTime.value=w.age;
   if(w.age>w.life){scene.remove(w.mesh);w.mesh.geometry.dispose();w.mesh.material.dispose();waves.splice(i,1)}
  }
  for(let i=lights.length-1;i>=0;i--){
   const l=lights[i];l.life-=dt;l.light.intensity*=Math.exp(-9*dt);
   if(l.life<=0){scene.remove(l.light);lights.splice(i,1)}
  }
  for(const s of shields){
   s.material.uniforms.uTime.value+=dt;
   s.material.uniforms.uHit.value=Math.max(0,s.material.uniforms.uHit.value-dt*2.2);
  }
 }
 function reset(){
  for(const b of bursts){scene.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose()}
  for(const w of waves){scene.remove(w.mesh);w.mesh.geometry.dispose();w.mesh.material.dispose()}
  for(const l of lights)scene.remove(l.light);
  bursts.length=0;waves.length=0;lights.length=0;shields.length=0;
 }
 return {burst,flash,impact,explosion,muzzle,ring,addShield,shieldHit,tick,reset};
}
