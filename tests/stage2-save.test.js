import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgress} from '../src/stage2-state.js';
import {
  loadCheckpointFloor,saveCheckpointFloor,clearCheckpointFloor,restoreProgressFromCheckpoint
} from '../src/stage2-save.js';

function memoryStorage(){
  const data=new Map();
  return {
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key)
  };
}

test('Chapter 2 checkpoint survives reload-style save/load',()=>{
  const storage=memoryStorage();
  assert.equal(loadCheckpointFloor(6,storage),0);
  assert.equal(saveCheckpointFloor(4,6,storage),true);
  assert.equal(loadCheckpointFloor(6,storage),4);
  assert.equal(clearCheckpointFloor(storage),true);
  assert.equal(loadCheckpointFloor(6,storage),0);
});

test('restoring a checkpoint completes only earlier floors and restarts the saved floor challenge',()=>{
  const progress=createProgress();
  assert.equal(restoreProgressFromCheckpoint(progress,4,6),4);
  assert.equal(progress.currentFloor,4);
  assert.equal(progress.mode,'floor');
  assert.equal('elevatorReady' in progress,false);
  assert.equal('elevator' in progress,false);
  assert.equal(progress.floors[1].complete,true);
  assert.equal(progress.floors[2].complete,true);
  assert.equal(progress.floors[3].complete,true);
  assert.equal(progress.floors[4].unlocked,true);
  assert.equal(progress.floors[4].complete,false);
  assert.equal(progress.floors[5].unlocked,false);
});
