import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUBE_ROUTE,CUBE_INITIAL,cubeType,routeProgress,isCubesSolved,swapCubeSlots
} from '../puzzle-kit/cubes/cubes-logic.js';

test('Cubes Puzzle route matches the supplied solution image',()=>{
  assert.deepEqual(CUBE_ROUTE,[
    {slot:0,type:'start'},
    {slot:1,type:'right'},
    {slot:2,type:'down'},
    {slot:5,type:'down'},
    {slot:8,type:'goal'}
  ]);
});

test('the two down pieces are interchangeable',()=>{
  assert.equal(cubeType('down-a'),'down');
  assert.equal(cubeType('down-b'),'down');
});

test('initial arrangement is not solved',()=>{
  assert.equal(isCubesSolved(CUBE_INITIAL),false);
  assert.ok(routeProgress(CUBE_INITIAL)<CUBE_ROUTE.length);
});

test('solution allows distractors in the four unused cells',()=>{
  const solution=[
    'start','right','down-a',
    'lock','junction','down-b',
    'straight',null,'goal'
  ];
  assert.equal(isCubesSolved(solution),true);
});

test('slot swapping preserves all pieces',()=>{
  const swapped=swapCubeSlots(CUBE_INITIAL,0,4);
  assert.equal(swapped[0],null);
  assert.equal(swapped[4],'lock');
  assert.deepEqual([...swapped].sort(),[...CUBE_INITIAL].sort());
});
