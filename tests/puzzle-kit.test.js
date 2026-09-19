import test from 'node:test';
import assert from 'node:assert/strict';
import {PuzzleCore,PUZZLE_EVENTS} from '../puzzle-kit/core/puzzle-core.js';

function rootStub(){return {replaceChildren(){}};}

test('puzzle core exposes reusable lifecycle',()=>{
  const puzzle=new PuzzleCore({id:'demo',root:rootStub()});
  assert.equal(puzzle.started,false);
  assert.equal(puzzle.solved,false);
  assert.equal(puzzle.start(),true);
  assert.equal(puzzle.started,true);
  assert.equal(puzzle.solve({score:1}),true);
  assert.equal(puzzle.solved,true);
  assert.equal(puzzle.solve(),false);
  assert.equal(puzzle.reset(),true);
  assert.equal(puzzle.started,false);
  assert.equal(puzzle.solved,false);
});

test('onSolved returns an unsubscribe function',()=>{
  const puzzle=new PuzzleCore({id:'demo',root:rootStub()});
  let count=0;
  const off=puzzle.onSolved(()=>count++);
  puzzle.solve();
  assert.equal(count,1);
  puzzle.reset();
  off();
  puzzle.solve();
  assert.equal(count,1);
});

test('event constants are stable public contract',()=>{
  assert.equal(PUZZLE_EVENTS.SOLVED,'puzzle:solved');
  assert.equal(PUZZLE_EVENTS.READY,'puzzle:ready');
});
