import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,stepPlayer} from '../src/world.js';
import {makeFloorPlatforms,groundY,elevatorXForFloor,ELEVATOR_WIDTH,solidsForElevatorRide} from '../src/stage2-tower.js';

const idle={left:false,right:false,jump:false,dash:false,shoot:false};

test('each elevator carries its rider through the upper landing while descending',()=>{
  for(let from=1;from<6;from++){
    const elevator={from,to:from+1,x:elevatorXForFloor(from),y:groundY(from+1),w:ELEVATOR_WIDTH,h:18,oneWay:true};
    const player=createPlayer(elevator.x+20,elevator.y-44);
    player.grounded=true;
    const solids=[...makeFloorPlatforms(),elevator];
    for(let i=0;i<120;i++){
      const dy=.25;
      elevator.y+=dy;player.y+=dy;
      stepPlayer(player,idle,solidsForElevatorRide(solids,elevator),1/120);
      assert.ok(Math.abs(player.y+player.h-elevator.y)<.01,`floor ${from+1}, frame ${i}`);
    }
    assert.ok(player.y+player.h>groundY(from+1)+29);
  }
});

test('the same upper landing catches a player who is not riding an elevator',()=>{
  const solids=makeFloorPlatforms();
  const player=createPlayer(400,groundY(4)-80);
  for(let i=0;i<120;i++)stepPlayer(player,idle,solidsForElevatorRide(solids,null),1/120);
  assert.equal(player.y+player.h,groundY(4));
  assert.equal(player.grounded,true);
});
