// Headless integration checks use a minimal DOM/Canvas adapter, not a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
class Element {
 constructor(){this.listeners={};this.dataset={};this.classList={add(){},remove(){}};this.style={};this.hidden=false;this.textContent='';}
 addEventListener(t,fn){this.listeners[t]=fn;}
 setAttribute(){} setPointerCapture(){} blur(){}
 emit(t,extra={}){this.listeners[t]?.({preventDefault(){},target:this,...extra});}
 getContext(){return context;}
}
const context=new Proxy({canvas:{width:960,height:540},getImageData:()=>({data:new Uint8ClampedArray(4)}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),createPattern:()=>({})},{get:(o,k)=>o[k]??(()=>{})});
const els=new Map(),buttons=['left','right','jump','shoot','dash'].map(action=>{const b=new Element();b.dataset.action=action;return b;});
globalThis.document={getElementById:id=>{if(!els.has(id))els.set(id,new Element());return els.get(id);},querySelectorAll:()=>buttons,createElement:()=>new Element(),addEventListener(){}};
globalThis.window=new Element();globalThis.location={search:'?test'};globalThis.matchMedia=()=>({matches:true});globalThis.requestAnimationFrame=()=>{};globalThis.HTMLButtonElement=Element;globalThis.Path2D=class{};
globalThis.Image=class{constructor(){this.listeners={};this.naturalWidth=1254;this.naturalHeight=1254;}addEventListener(t,fn){this.listeners[t]=fn;}set src(url){if(url.includes('hero-spritesheet'))queueMicrotask(()=>this.listeners.load?.());}};
await import('../src/main.js');const g=window.__game,dt=1/120;
const steps=n=>{for(let i=0;i<n;i++)g.tick(dt);};
const key=(code,down)=>window.emit(down?'keydown':'keyup',{code,target:{}});
test('movement, collecting, simultaneous controls, cancellation, pause, checkpoint and replay',()=>{
 g.play();key('KeyD',true);steps(85);key('KeyD',false);assert(g.player.x>260);assert(g.stats.collected>=1);
 buttons[1].emit('pointerdown',{pointerId:1});buttons[2].emit('pointerdown',{pointerId:2});buttons[3].emit('pointerdown',{pointerId:3});assert(g.input.right&&g.input.jump&&g.input.shoot);steps(4);assert(g.bullets.length>0);assert(g.player.vy<0);
 buttons[2].emit('pointercancel',{pointerId:2});assert(!g.input.jump&&g.input.right&&g.input.shoot);
 g.pause();assert.equal(g.state,'paused');assert(!g.input.right&&!g.input.shoot);const x=g.player.x;steps(120);assert.equal(g.player.x,x);g.play();
 g.player.x=1650;g.player.y=396;g.player.vy=0;g.player.vx=0;g.player.grounded=true;steps(1);assert.equal(g.checkpoint,1650);g.player.y=700;steps(1);assert.equal(g.player.x,1650);assert.equal(g.player.hp,5);assert.equal(g.stats.deaths,1);
 g.player.x=6415;g.player.y=396;steps(1);assert.equal(g.state,'playing','exit stays locked while boss lives');g.level.boss.hp=0;steps(1);assert.equal(g.state,'won');g.play();assert.equal(g.state,'playing');assert.equal(g.stats.collected,0);assert.equal(g.checkpoint,110);assert.equal(g.stats.deaths,0);
 g.draw();
});

test('boss can be defeated with shots and enemy shots are cleared',()=>{
 g.reset();g.play();g.player.x=5830;g.player.y=396;g.player.invulnerable=30;
 g.level.enemies.forEach(e=>e.hp=0);key('KeyJ',true);steps(900);key('KeyJ',false);
 assert(g.level.boss.hp<=0);assert.equal(g.stats.kills,1);assert.equal(g.enemyShots.length,0);
 g.player.x=6420;steps(1);assert.equal(g.state,'won');
});
test('dash evades hostile projectiles, normal contact costs health',()=>{
 g.reset();g.play();steps(60);g.player.invulnerable=0;
 g.enemyShots.push({x:g.player.x+12,y:g.player.y+10,w:10,h:7,vx:0,vy:0,life:1});
 key('KeyL',true);steps(1);key('KeyL',false);assert(g.player.dashTime>0);assert.equal(g.player.hp,5);
 steps(30);g.enemyShots.push({x:g.player.x+12,y:g.player.y+10,w:10,h:7,vx:0,vy:0,life:1});steps(1);assert.equal(g.player.hp,4);
});


test('new sprite muzzle shots damage guards in both facing directions',()=>{
 for(const facing of [1,-1]){
  g.reset();g.play();steps(60);g.player.x=700;g.player.facing=facing;
  const e=g.level.enemies[0];e.x=facing===1?810:580;e.min=e.x;e.max=e.x+e.w;e.vx=0;e.fire=100;e.hp=3;
  key('KeyJ',true);steps(22);key('KeyJ',false);
  assert(e.hp<3,`facing ${facing} hits at sprite weapon height`);
 }
});
