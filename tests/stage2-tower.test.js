import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOWER_WIDTH,TOWER_HEIGHT,FLOOR_GROUNDS,FLOOR_LEFT,FLOOR_RIGHT,
  ELEVATOR_X,ELEVATOR_WIDTH,groundY,makeFloorPlatforms,elevatorGround,isFloorGeometryValid
} from '../src/stage2-tower.js';

test('tower geometry matches the supplied six-floor background',()=>{
  assert.equal(TOWER_WIDTH,1024);
  assert.equal(TOWER_HEIGHT,1536);
  assert.deepEqual(FLOOR_GROUNDS.slice(1),[1412,1160,946,720,510,304]);
  assert.equal(isFloorGeometryValid(),true);
});

test('floor platforms align with the tower play area',()=>{
  const platforms=makeFloorPlatforms();
  assert.equal(platforms.length,6);
  for(let i=0;i<platforms.length;i++){
    const p=platforms[i];
    assert.equal(p.floor,i+1);
    assert.equal(p.y,groundY(i+1));
    assert.equal(p.x,FLOOR_LEFT);
    assert.equal(p.oneWay,true);
    assert.ok(p.x+p.w<=ELEVATOR_X+2);
  }
  assert.ok(FLOOR_RIGHT>=ELEVATOR_X+ELEVATOR_WIDTH);
});

test('elevator ground interpolates between adjacent floors',()=>{
  assert.equal(elevatorGround(1,2,0),groundY(1));
  assert.equal(elevatorGround(1,2,1),groundY(2));
  assert.equal(elevatorGround(1,2,.5),(groundY(1)+groundY(2))/2);
});
