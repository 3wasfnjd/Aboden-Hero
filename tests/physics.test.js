import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,createLevel,stepPlayer,TUNING} from '../src/world.js';
const dt=1/120,ground=[{x:0,y:440,w:6600,h:130}],idle={left:false,right:false,jump:false};
function step(p,input=idle,n=1,solids=ground){for(let i=0;i<n;i++)stepPlayer(p,input,solids,dt);return p;}
function settled(){return step(createPlayer(),idle,60);}
test('smooth acceleration, full speed and quick braking',()=>{const p=settled();step(p,{...idle,right:true},1);assert(p.vx>0&&p.vx<TUNING.speed);step(p,{...idle,right:true},120);assert.equal(p.vx,TUNING.speed);const x=p.x;step(p,idle,30);assert.equal(p.vx,0);assert(p.x-x<25);});
test('hold jumps higher than tap; holding does not auto-bounce',()=>{function jump(frames){const p=settled();let min=p.y;for(let i=0;i<180;i++){step(p,{...idle,jump:i<frames});min=Math.min(min,p.y);}return {p,height:396-min};}const tap=jump(4),hold=jump(180);assert(hold.height>95&&hold.height<120);assert(tap.height<65);assert.equal(hold.p.y,396);assert.equal(hold.p.vy,0);});
test('coyote jump works shortly after walking off edge, but not later',()=>{const p=settled();p.x=140;const ledge=[{x:0,y:440,w:150,h:100}];step(p,{...idle,right:true},12,ledge);assert(!p.grounded);step(p,{...idle,right:true,jump:true},1,ledge);assert(p.vy<0);const q=settled();q.x=151;step(q,idle,22,ledge);step(q,{...idle,jump:true},1,ledge);assert(q.vy>0);});
test('jump buffer fires after landing',()=>{const p=createPlayer(100,370);p.vy=160;step(p,{...idle,jump:true},14);assert(p.vy<0);});
test('cannot double jump during ascent',()=>{const p=settled();step(p,{...idle,jump:true},10);step(p,idle,1);const before=p.vy;step(p,{...idle,jump:true},1);assert(p.vy>before);});
test('one-way platforms allow upward passage and catch descending player',()=>{const p=settled(),solids=[...ground,{x:50,y:365,w:200,h:20,oneWay:true}];step(p,{...idle,jump:true},140,solids);assert.equal(p.y,321);assert(p.grounded);});
test('all mandatory gaps can be crossed at normal speed',()=>{const level=createLevel(),grounds=level.solids.filter(s=>s.ground);for(let i=0;i<grounds.length-1;i++){const edge=grounds[i].x+grounds[i].w,next=grounds[i+1].x;const p=createPlayer(edge-45,396);p.grounded=true;p.vx=TUNING.speed;step(p,{...idle,right:true,jump:true},100,level.solids);assert(p.x>next,`gap at ${edge}`);assert(p.y<441,`survived gap at ${edge}`);}});
test('horizontal travel independent of render frame grouping',()=>{const a=settled(),b=settled();step(a,{...idle,right:true},240);for(let i=0;i<60;i++)step(b,{...idle,right:true},4);assert.equal(a.x,b.x);});
