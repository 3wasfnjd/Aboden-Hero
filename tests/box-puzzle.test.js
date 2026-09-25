import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, applyAction, isSolved, restoreState, balance, SLIDE_ORDER, SLIDE_TARGETS } from '../puzzle-kit/box/box-logic.js';

function unlockRings(s) { for (let i=0;i<2;i++) applyAction(s,{type:'ring',index:0,direction:-1}); for(let i=0;i<3;i++) applyAction(s,{type:'ring',index:1,direction:-1}); assert.equal(applyAction(s,{type:'unlock'}),true); }
function unlockGears(s) { applyAction(s,{type:'gear',index:0,direction:-1}); applyAction(s,{type:'gear',index:1,direction:-1}); applyAction(s,{type:'gear',index:2}); applyAction(s,{type:'gear',index:2}); assert.equal(applyAction(s,{type:'unlock'}),true); }
function unlockSlides(s) { SLIDE_ORDER.forEach(index=>applyAction(s,{type:'slide',index,direction:SLIDE_TARGETS[index]})); assert.equal(applyAction(s,{type:'unlock'}),true); }
function unlockCode(s) { applyAction(s,{type:'swap',index:0,other:1}); applyAction(s,{type:'swap',index:1,other:2}); [4,1,7].forEach((n,index)=>{for(let i=0;i<n;i++)applyAction(s,{type:'digit',index});}); assert.equal(applyAction(s,{type:'unlock'}),true); }

test('the complete five-puzzle route ends only after physically extracting the key',()=>{
  const s=initialState(); unlockRings(s); unlockGears(s); unlockSlides(s); unlockCode(s);
  assert.equal(s.stage,4);
  ['left','right','right','left'].forEach((location,index)=>applyAction(s,{type:'weight',index,location}));
  assert.deepEqual(balance(s),{left:5,right:5}); assert.equal(applyAction(s,{type:'unlock'}),true);
  assert.equal(s.extracted,false); assert.equal(s.stage,5); assert.equal(applyAction(s,{type:'extract'}),true);
  assert.equal(s.extracted,true); assert.equal(applyAction(s,{type:'extract'}),false);
  assert.deepEqual(restoreState(JSON.stringify(s)),s);
});

test('hidden mechanisms and unsolved locks cannot skip stages or mutate state',()=>{
  const s=initialState(), before=JSON.stringify(s);
  for(const action of [{type:'unlock'},{type:'extract'},{type:'gear',index:0},{type:'weight',index:0,location:'left'},{type:'ring',index:30}]) assert.equal(applyAction(s,action),false);
  assert.equal(JSON.stringify(s),before);
});

test('all 64 indicator states can be solved without resetting or soft-locking',()=>{
  for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){
    const s=initialState(); unlockRings(s); s.gears=[a,b,c];
    for(let i=0;i<3;i++)for(let n=0;n<4&&s.gears[i]!==0;n++)applyAction(s,{type:'gear',index:i,direction:-1});
    assert.equal(isSolved(s),true,`${a},${b},${c}`);
  }
});

test('interlocked slides have a reversible legal path and reject moves through blockers',()=>{
  const s=initialState(); unlockRings(s); unlockGears(s);
  assert.equal(applyAction(s,{type:'slide',index:0,direction:1}),false);
  for(const index of SLIDE_ORDER) assert.equal(applyAction(s,{type:'slide',index,direction:SLIDE_TARGETS[index]}),true);
  assert.equal(isSolved(s),true);
  assert.equal(applyAction(s,{type:'slide',index:3,direction:1}),false);
  for(const index of [...SLIDE_ORDER].reverse()) assert.equal(applyAction(s,{type:'slide',index,direction:-SLIDE_TARGETS[index]}),true);
  assert.deepEqual(s.slides,[0,0,0,0]);
});

test('empty or partially loaded balance cannot satisfy the last lock',()=>{
  const s=initialState(); unlockRings(s); unlockGears(s); unlockSlides(s); unlockCode(s);
  assert.equal(isSolved(s),false);
  ['left','left','right','tray'].forEach((location,index)=>applyAction(s,{type:'weight',index,location}));
  assert.deepEqual(balance(s),{left:3,right:3}); assert.equal(isSolved(s),false);
  applyAction(s,{type:'weight',index:3,location:'left'}); assert.equal(isSolved(s),false);
});

test('save restore retains partial moves and rejects malformed or contradictory progress',()=>{
  const s=initialState(); unlockRings(s); applyAction(s,{type:'gear',index:1}); applyAction(s,{type:'hint'});
  assert.deepEqual(restoreState(JSON.stringify(s)),s);
  for(const raw of ['{bad',null,{...s,version:10},{...s,stage:9},{...s,stage:4},{...s,slides:[1,0,0,0]},{...s,weights:['x','tray','tray','tray']},{...s,fragments:[1,1,1]}]) assert.deepEqual(restoreState(raw),initialState());
});

test('resetting the current mechanism preserves unlocked parts and caps hints',()=>{
  const s=initialState(); unlockRings(s); applyAction(s,{type:'gear',index:1});
  for(let i=0;i<9;i++)applyAction(s,{type:'hint'});
  assert.equal(s.hints[1],3); applyAction(s,{type:'reset-current'});
  assert.equal(s.stage,1); assert.deepEqual(s.rings,[0,1]); assert.deepEqual(s.gears,[1,2,3]);
});
