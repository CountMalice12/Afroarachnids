import assert from 'node:assert/strict';
import * as THREE from 'three';
import {prepareDestructionPhysics,createDestructionPhysics} from '../src/destruction-physics.js';
import {createTacticalCharacter} from '../src/character-art.js';
import {createCombatVFX} from '../src/combat-vfx.js';

await prepareDestructionPhysics();
const scene=new THREE.Scene();
const events={destroyed:0,explosions:0,impacts:0};
const effects=createCombatVFX(scene,{quality:'mobile'});
const physics=createDestructionPhysics({scene,gravity:-8.5,
 onDestroyed:()=>{events.destroyed++;},
 onImpact:()=>{events.impacts++;},
 onExplosion:(p,e)=>{events.explosions++;effects.explosion(p,{radius:e.radius})}
});
const box=(x,z,hp)=>({
 x,z,w:1.7,d:1.45,name:'TEST COVER',hp,maxHP:hp,active:true,
 obj:new THREE.Mesh(new THREE.BoxGeometry(1.7,1.45,1.45),new THREE.MeshStandardMaterial())
});
const one=box(0,0,22),two=box(2,0,18);
physics.registerScene([one,two]);
assert.equal(physics.metrics().activeCover,2);
let r=physics.damage(one,12);
assert.equal(r.destroyed,false);assert.equal(one.hp,10);
r=physics.damage(one,12);
assert.equal(r.destroyed,true);assert.equal(one.active,false);
assert.equal(one.obj.visible,false);
assert.equal(physics.metrics().activeCover,1);
assert.ok(physics.metrics().debris>=8,'Destroyed cover must create rigid-body fragments');
r=physics.explosion(new THREE.Vector3(2,1.2,0),4,55,65,[one,two]);
assert.ok(r.destroyed>=1,'Explosion must destroy another target');
assert.equal(two.active,false);
assert.equal(physics.metrics().activeCover,0);
assert.ok(events.destroyed===2);
for(let i=0;i<30;i++){physics.tick(1/60);effects.tick(1/60)}
assert.ok(physics.metrics().steps>=30,'Rapier must actually simulate bodies');
const actors=['media','medic','solo','security'].map(role=>createTacticalCharacter(role));
for(const actor of actors){
 const count=(()=>{let n=0;actor.traverse(o=>{if(o.isMesh)n++});return n})();
 assert.ok(count>=35,'Detailed model needs multi-piece geometry, not a capsule: '+actor.userData.role+' '+count);
 actor.userData.animate(1/60,.8);
 actor.userData.fire();
 actor.userData.hit();
 actor.userData.animate(1/60,.1);
}
physics.dispose();effects.reset();
console.log('PASS: Rapier fixed colliders, shattering props, explosions, dynamic fragments, articulated role models, shader VFX');
