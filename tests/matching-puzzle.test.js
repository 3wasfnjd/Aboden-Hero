import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MATCH_COLORS,MATCH_PAIRS,getPort,canAttemptMatch,matchingColor,isMatchingSolved
} from '../puzzle-kit/matching/matching-logic.js';

test('matching puzzle exposes the three intended color pairs',()=>{
  assert.deepEqual(MATCH_COLORS,['blue','purple','orange']);
  assert.deepEqual(MATCH_PAIRS.blue,['left-blue','right-blue']);
  assert.deepEqual(MATCH_PAIRS.purple,['left-purple','right-purple']);
  assert.deepEqual(MATCH_PAIRS.orange,['left-orange','right-orange']);
});

test('only opposite sides can attempt a connection',()=>{
  assert.equal(canAttemptMatch('left-blue','right-blue',new Set()),true);
  assert.equal(canAttemptMatch('left-blue','left-purple',new Set()),false);
  assert.equal(canAttemptMatch('left-blue','right-purple',new Set()),true);
});

test('matchingColor accepts same-color opposite-side pairs only',()=>{
  assert.equal(matchingColor('left-blue','right-blue'),'blue');
  assert.equal(matchingColor('left-purple','right-purple'),'purple');
  assert.equal(matchingColor('left-orange','right-orange'),'orange');
  assert.equal(matchingColor('left-blue','right-purple'),null);
  assert.equal(matchingColor('left-blue','left-blue'),null);
  assert.equal(getPort('missing'),null);
});

test('puzzle solves only after all three colors are connected',()=>{
  assert.equal(isMatchingSolved(new Set(['blue','purple'])),false);
  assert.equal(isMatchingSolved(new Set(['blue','purple','orange'])),true);
});
