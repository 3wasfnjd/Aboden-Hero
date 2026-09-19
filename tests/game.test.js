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
 g.player.x=6415;g.player.y=396;steps(1);assert.equal(g.state,'playing','exit stays locked while boss lives');g.level.boss.hp=0;steps(1);assert.equal(g.state,'chapterEnd','chapter 1 ends before the final mission');g.play();assert.equal(g.state,'playing');assert.equal(g.chapter,2);assert.equal(g.floor,1);assert.equal(g.stats.collected,0);assert.equal(g.checkpoint,110);assert.equal(g.stats.deaths,0);
 for(let f=1;f<7;f++){
  if(g.level.terminal){
   g.player.x=g.level.terminal.x+5;g.player.y=g.level.terminal.y+5;g.player.grounded=true;steps(1);
   assert.equal(g.state,'puzzle',`floor ${f} terminal opens the puzzle overlay`);
   g.debugSolveTerminal();
   assert.equal(g.state,'playing',`floor ${f} puzzle close resumes play`);
   assert(g.level.terminal.solved);
  }
  g.player.x=g.level.elevator.x+10;g.player.y=g.level.elevator.restY-g.player.h;g.player.vy=0;g.player.grounded=true;steps(1);
  assert.equal(g.state,'riding',`floor ${f} stepping onto the car starts the ride`);
  steps(320); // real elevator ride: physically rises from restY to topY over time
  assert.equal(g.state,'playing',`floor ${f} ride finishes back into play`);
  assert.equal(g.floor,f+1,`elevator ride advances from floor ${f}`);
 }
 g.player.x=g.level.goal.x+10;g.player.y=396;steps(1);assert.equal(g.state,'playing','chapter 2 exit stays locked while its boss lives');
 g.level.boss.hp=0;steps(1);assert.equal(g.state,'won','the campaign only ends after the final chapter and floor');g.play();assert.equal(g.state,'playing');assert.equal(g.chapter,1,'replaying from the final win restarts the campaign');
 g.draw();
});

test('boss can be defeated with shots and enemy shots are cleared',()=>{
 g.reset();g.play();g.player.x=5830;g.player.y=396;g.player.invulnerable=30;
 g.level.enemies.forEach(e=>e.hp=0);key('KeyJ',true);steps(900);key('KeyJ',false);
 assert(g.level.boss.hp<=0);assert.equal(g.stats.kills,1);assert.equal(g.enemyShots.length,0);
 g.player.x=6420;steps(1);assert.equal(g.state,'chapterEnd');
 g.play();
});
test('dash evades hostile projectiles, normal contact costs health',()=>{
 g.reset();g.play();steps(60);g.player.invulnerable=0;
 g.enemyShots.push({x:g.player.x+12,y:g.player.y+10,w:10,h:7,vx:0,vy:0,life:1});
 key('KeyL',true);steps(1);key('KeyL',false);assert(g.player.dashTime>0);assert.equal(g.player.hp,5);
 steps(30);g.enemyShots.push({x:g.player.x+12,y:g.player.y+10,w:10,h:7,vx:0,vy:0,life:1});steps(1);assert.equal(g.player.hp,4);
});


test('shielded chapter-2 guards block frontal shots but take damage from behind',()=>{
 g.reset(2,3);g.play();
 const e=g.level.enemies.find(x=>x.shield);
 assert(e,'chapter 2 floor 3 (the workshop) has at least one shielded guard');
 e.windup=0;e.vx=-48;e.hp=3; // facing left: front toward -x, back toward +x
 g.bullets.length=0;g.bullets.push({x:e.x+5,y:e.y+e.h-20,w:13,h:8,vx:620,life:1});
 g.tick(1/60);
 assert.equal(e.hp,3,'a shot into the shielded side does no damage');
 g.bullets.length=0;g.bullets.push({x:e.x+5,y:e.y+e.h-20,w:13,h:8,vx:-620,life:1});
 g.tick(1/60);
 assert.equal(e.hp,2,'a shot from behind the shield still damages the guard');
});
test('the hovering mini-boss appears on floor 5 (the lab) and the rooftop captain uses the shared boss escalation',()=>{
 g.reset(2,5);g.play();
 const chopper=g.level.enemies.find(x=>x.flying);
 assert(chopper,'chapter 2 floor 5 has a flying mini-boss');
 assert(chopper.hp>3,'the mini-boss is tougher than a regular guard');
 g.reset(2,7);g.play();
 assert.equal(g.level.boss.kind,'captain');
 assert.equal(g.level.boss.maxHP,30);
});
test('new sprite muzzle shots damage guards in both facing directions',()=>{
 for(const facing of [1,-1]){
  g.reset();g.play();steps(60);g.player.x=700;g.player.facing=facing;
  const e=g.level.enemies[0];e.x=facing===1?810:580;e.min=e.x;e.max=e.x+e.w;e.vx=0;e.fire=100;e.hp=3;
  key('KeyJ',true);steps(22);key('KeyJ',false);
  assert(e.hp<3,`facing ${facing} hits at sprite weapon height`);
 }
});
