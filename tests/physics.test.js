import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,createLevel,stepPlayer,TUNING} from '../src/world.js';
const dt=1/120,ground=[{x:0,y:440,w:6600,h:130}],idle={left:false,right:false,jump:false};
function step(p,input=idle,n=1,solids=ground,width=6600){for(let i=0;i<n;i++)stepPlayer(p,input,solids,dt,width);return p;}
function settled(){return step(createPlayer(),idle,60);}
test('smooth acceleration, full speed and quick braking',()=>{const p=settled();step(p,{...idle,right:true},1);assert(p.vx>0&&p.vx<TUNING.speed);step(p,{...idle,right:true},120);assert.equal(p.vx,TUNING.speed);const x=p.x;step(p,idle,30);assert.equal(p.vx,0);assert(p.x-x<25);});
test('hold jumps higher than tap; holding does not auto-bounce',()=>{function jump(frames){const p=settled();let min=p.y;for(let i=0;i<180;i++){step(p,{...idle,jump:i<frames});min=Math.min(min,p.y);}return {p,height:396-min};}const tap=jump(4),hold=jump(180);assert(hold.height>95&&hold.height<120);assert(tap.height<65);assert.equal(hold.p.y,396);assert.equal(hold.p.vy,0);});
test('coyote jump works shortly after walking off edge, but not later',()=>{const p=settled();p.x=140;const ledge=[{x:0,y:440,w:150,h:100}];step(p,{...idle,right:true},12,ledge);assert(!p.grounded);step(p,{...idle,right:true,jump:true},1,ledge);assert(p.vy<0);const q=settled();q.x=151;step(q,idle,22,ledge);step(q,{...idle,jump:true},1,ledge);assert(q.vy>0);});
test('jump buffer fires after landing',()=>{const p=createPlayer(100,370);p.vy=160;step(p,{...idle,jump:true},14);assert(p.vy<0);});
test('cannot double jump during ascent',()=>{const p=settled();step(p,{...idle,jump:true},10);step(p,idle,1);const before=p.vy;step(p,{...idle,jump:true},1);assert(p.vy>before);});
test('one-way platforms allow upward passage and catch descending player',()=>{const p=settled(),solids=[...ground,{x:50,y:365,w:200,h:20,oneWay:true}];step(p,{...idle,jump:true},140,solids);assert.equal(p.y,321);assert(p.grounded);});
test('all mandatory gaps can be crossed at normal speed',()=>{
 const levels=[['chapter 1',createLevel(1)],...Array.from({length:7},(_,i)=>[`chapter 2 floor ${i+1}`,createLevel(2,i+1)])];
 for(const [label,level] of levels){const grounds=level.solids.filter(s=>s.ground);for(let i=0;i<grounds.length-1;i++){const edge=grounds[i].x+grounds[i].w,next=grounds[i+1].x;const p=createPlayer(edge-45,396);p.grounded=true;p.vx=TUNING.speed;step(p,{...idle,right:true,jump:true},100,level.solids,level.width);assert(p.x>next,`${label} gap at ${edge}`);assert(p.y<441,`${label} survived gap at ${edge}`);}}
});
test('horizontal travel independent of render frame grouping',()=>{const a=settled(),b=settled();step(a,{...idle,right:true},240);for(let i=0;i<60;i++)step(b,{...idle,right:true},4);assert.equal(a.x,b.x);});

// The chapter-2 building floors are vertical climbs (camera follows y, not
// x) — this replays the jump-reachability sweep used to design their ledge
// spacing, as a regression test: every ledge must be reachable jump-to-jump
// (releasing and re-pressing jump between hops, since holding it through a
// landing never re-triggers a jump), the elevator car unreachable while any
// gate stands, and reachable once it's gone.
test('every chapter-2 building floor can be climbed ledge to ledge up to the elevator car',()=>{
 for(let floor=1;floor<=6;floor++){
  const level=createLevel(2,floor);
  const ledges=level.solids.filter(s=>s.oneWay&&!s.locked);
  const p=createPlayer(level.width/2-15,396);
  p.grounded=true;
  for(const ledge of ledges){
   const centerX=ledge.x+ledge.w/2;
   step(p,{left:false,right:false,jump:false,dash:false},6,level.solids,level.width);
   let landed=false;
   for(let f=0;f<200&&!landed;f++){
    const goingRight=centerX>p.x+p.w/2;
    step(p,{left:!goingRight,right:goingRight,jump:true,dash:false},1,level.solids,level.width);
    if(p.grounded&&Math.abs((p.y+p.h)-ledge.y)<2&&p.x+p.w>ledge.x&&p.x<ledge.x+ledge.w)landed=true;
    if(p.y>700)break;
   }
   assert(landed,`floor ${floor} ledge at ${JSON.stringify(ledge)} unreachable`);
  }
  const carSolid={x:level.elevator.x,y:level.elevator.restY,w:level.elevator.w,h:20,oneWay:true};
  const top=ledges[ledges.length-1];
  if(level.terminal){
   const pBlocked=createPlayer(top.x+10,top.y-44);
   pBlocked.grounded=true;
   step(pBlocked,{left:false,right:false,jump:false,dash:false},6,level.solids,level.width);
   let reachedWhileGated=false;
   for(let f=0;f<150;f++){
    step(pBlocked,{left:false,right:false,jump:true,dash:false},1,level.solids,level.width);
    if(pBlocked.grounded&&pBlocked.y+pBlocked.h<=level.elevator.restY+1){reachedWhileGated=true;break;}
   }
   assert(!reachedWhileGated,`floor ${floor} gate should block the car until solved`);
  }
  const openSolids=[...level.solids.filter(s=>!s.locked),carSolid];
  const pOpen=createPlayer(top.x+10,top.y-44);
  pOpen.grounded=true;
  step(pOpen,{left:false,right:false,jump:false,dash:false},6,openSolids,level.width);
  let reachedCar=false;
  for(let f=0;f<150&&!reachedCar;f++){
   step(pOpen,{left:false,right:false,jump:true,dash:false},1,openSolids,level.width);
   if(pOpen.grounded&&Math.abs((pOpen.y+pOpen.h)-level.elevator.restY)<2)reachedCar=true;
  }
  assert(reachedCar,`floor ${floor} elevator car unreachable once any gate is gone`);
 }
});

test('dash is short, fast and cannot repeat until cooldown expires',()=>{const p=settled();const x=p.x;step(p,{...idle,dash:true},22);assert(p.x-x>100);assert.equal(p.dashTime,0);step(p,{...idle,dash:false});step(p,{...idle,dash:true});assert.equal(p.dashTime,0);step(p,idle,170);step(p,{...idle,dash:true});assert(p.dashTime>0);});
