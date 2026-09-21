import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOWER_WIDTH,TOWER_HEIGHT,FLOOR_GROUNDS,FLOOR_LEFT,FLOOR_RIGHT,
  ELEVATOR_LEFT_X,ELEVATOR_RIGHT_X,ELEVATOR_WIDTH,
  FLOOR_LABEL_LEFT_X,FLOOR_LABEL_RIGHT_X,
  groundY,makeFloorPlatforms,elevatorGround,isFloorGeometryValid,
  elevatorXForFloor,floorLabelX,arrivalXForFloor
} from '../src/stage2-tower.js';

test('tower geometry matches the supplied six-floor background',()=>{
  assert.equal(TOWER_WIDTH,1024);
  assert.equal(TOWER_HEIGHT,1536);
  assert.deepEqual(FLOOR_GROUNDS.slice(1),[1412,1160,946,720,510,304]);
  assert.equal(isFloorGeometryValid(),true);
});

test('floor platforms cover the full walkable width',()=>{
  const platforms=makeFloorPlatforms();
  assert.equal(platforms.length,6);
  for(let i=0;i<platforms.length;i++){
    const p=platforms[i];
    assert.equal(p.floor,i+1);
    assert.equal(p.y,groundY(i+1));
    assert.equal(p.x,FLOOR_LEFT);
    assert.equal(p.w,FLOOR_RIGHT-FLOOR_LEFT);
    assert.equal(p.oneWay,true);
  }
});

test('onward elevators alternate sides floor by floor',()=>{
  assert.equal(elevatorXForFloor(1),ELEVATOR_RIGHT_X);
  assert.equal(elevatorXForFloor(2),ELEVATOR_LEFT_X);
  assert.equal(elevatorXForFloor(3),ELEVATOR_RIGHT_X);
  assert.equal(elevatorXForFloor(4),ELEVATOR_LEFT_X);
  assert.equal(elevatorXForFloor(5),ELEVATOR_RIGHT_X);
  assert.ok(ELEVATOR_LEFT_X>=FLOOR_LEFT);
  assert.ok(ELEVATOR_RIGHT_X+ELEVATOR_WIDTH<=FLOOR_RIGHT);
});

test('floor numbers alternate opposite the onward elevator',()=>{
  assert.equal(floorLabelX(1),FLOOR_LABEL_LEFT_X);
  assert.equal(floorLabelX(2),FLOOR_LABEL_RIGHT_X);
  assert.equal(floorLabelX(3),FLOOR_LABEL_LEFT_X);
  assert.equal(floorLabelX(4),FLOOR_LABEL_RIGHT_X);
});

test('arrival side is opposite the next elevator on upper floors',()=>{
  assert.equal(arrivalXForFloor(1,30),FLOOR_LEFT+70);
  assert.equal(arrivalXForFloor(2,30),ELEVATOR_RIGHT_X+ELEVATOR_WIDTH/2-15);
  assert.equal(arrivalXForFloor(3,30),ELEVATOR_LEFT_X+ELEVATOR_WIDTH/2-15);
});

test('elevator ground interpolates between adjacent floors',()=>{
  assert.equal(elevatorGround(1,2,0),groundY(1));
  assert.equal(elevatorGround(1,2,1),groundY(2));
  assert.equal(elevatorGround(1,2,.5),(groundY(1)+groundY(2))/2);
});
