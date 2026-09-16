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
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),createPattern:()=>({})},{get:(o,k)=>o[k]??(()=>{})});
const els=new Map(),buttons=['left','right','jump','shoot'].map(action=>{const b=new Element();b.dataset.action=action;return b;});
globalThis.document={getElementById:id=>{if(!els.has(id))els.set(id,new Element());return els.get(id);},querySelectorAll:()=>buttons,createElement:()=>new Element(),addEventListener(){}};
globalThis.window=new Element();globalThis.location={search:'?test'};globalThis.matchMedia=()=>({matches:true});globalThis.requestAnimationFrame=()=>{};globalThis.HTMLButtonElement=Element;globalThis.Path2D=class{};
await import('../src/main.js');const g=window.__game,dt=1/120;
const steps=n=>{for(let i=0;i<n;i++)g.tick(dt);};
const key=(code,down)=>window.emit(down?'keydown':'keyup',{code,target:{}});
test('movement, collecting, simultaneous controls, cancellation, pause, checkpoint and replay',()=>{
 g.play();key('KeyD',true);steps(85);key('KeyD',false);assert(g.player.x>260);assert(g.stats.collected>=1);
 buttons[1].emit('pointerdown',{pointerId:1});buttons[2].emit('pointerdown',{pointerId:2});buttons[3].emit('pointerdown',{pointerId:3});assert(g.input.right&&g.input.jump&&g.input.shoot);steps(4);assert(g.bullets.length>0);assert(g.player.vy<0);
 buttons[2].emit('pointercancel',{pointerId:2});assert(!g.input.jump&&g.input.right&&g.input.shoot);
 g.pause();assert.equal(g.state,'paused');assert(!g.input.right&&!g.input.shoot);const x=g.player.x;steps(120);assert.equal(g.player.x,x);g.play();
 g.player.x=1650;g.player.y=396;g.player.vy=0;g.player.vx=0;g.player.grounded=true;steps(1);assert.equal(g.checkpoint,1650);g.player.y=700;steps(1);assert.equal(g.player.x,1650);assert.equal(g.player.hp,5);assert.equal(g.stats.deaths,1);
 g.player.x=6415;g.player.y=396;steps(1);assert.equal(g.state,'won');g.play();assert.equal(g.state,'playing');assert.equal(g.stats.collected,0);assert.equal(g.checkpoint,110);assert.equal(g.stats.deaths,0);
 g.draw();
});
