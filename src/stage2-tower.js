export const TOWER_WIDTH=1024;
export const TOWER_HEIGHT=1536;

/**
 * Ground lines calibrated directly against the single supplied Chapter 2 tower image.
 * Index 1 is the lowest floor and index 6 is the rooftop control room.
 */
export const FLOOR_GROUNDS=Object.freeze([
  null,
  1412,
  1160,
  946,
  720,
  510,
  304
]);

export const FLOOR_LEFT=142;
export const ELEVATOR_X=750;
export const ELEVATOR_WIDTH=100;
export const ELEVATOR_PLATFORM_HEIGHT=18;
export const FLOOR_RIGHT=ELEVATOR_X+ELEVATOR_WIDTH;

export const PUZZLE_X=Object.freeze({
  2:560,
  4:360,
  6:520
});

export const FLOOR_LABEL_X=800;

export function groundY(floor){
  const value=FLOOR_GROUNDS[floor];
  if(!Number.isFinite(value))throw new RangeError(`Unknown Chapter 2 floor: ${floor}`);
  return value;
}

export function makeFloorPlatforms(){
  return FLOOR_GROUNDS.slice(1).map((y,index)=>({
    floor:index+1,
    x:FLOOR_LEFT,
    y,
    w:ELEVATOR_X-FLOOR_LEFT+2,
    h:92,
    ground:true,
    oneWay:true
  }));
}

export function elevatorGround(fromFloor,toFloor,progress){
  const t=Math.max(0,Math.min(1,Number(progress)||0));
  return groundY(fromFloor)+(groundY(toFloor)-groundY(fromFloor))*t;
}

export function isFloorGeometryValid(){
  for(let floor=1;floor<=6;floor++){
    if(!Number.isFinite(FLOOR_GROUNDS[floor]))return false;
    if(floor>1&&FLOOR_GROUNDS[floor]>=FLOOR_GROUNDS[floor-1])return false;
  }
  return true;
}
