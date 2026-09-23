export const TOWER_WIDTH=1024;
export const TOWER_HEIGHT=1536;

/**
 * Ground lines calibrated against the supplied Chapter 2 tower artwork.
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
export const FLOOR_RIGHT=882;

export const ELEVATOR_LEFT_X=171;
export const ELEVATOR_RIGHT_X=760;
export const ELEVATOR_WIDTH=92;
export const ELEVATOR_PLATFORM_HEIGHT=18;

export const PUZZLE_INTERACTION=Object.freeze({
  2:Object.freeze({x:560,range:92}),
  4:Object.freeze({x:440,range:118}),
  6:Object.freeze({x:520,range:92})
});

export function puzzleInteraction(floor){
  return PUZZLE_INTERACTION[floor]??null;
}

export const FLOOR_LABEL_LEFT_X=226;
export const FLOOR_LABEL_RIGHT_X=798;
export const FLOOR_LABEL_Y=Object.freeze([
  null,
  1220,
  1015,
  802,
  590,
  383,
  190
]);

export function groundY(floor){
  const value=FLOOR_GROUNDS[floor];
  if(!Number.isFinite(value))throw new RangeError(`Unknown Chapter 2 floor: ${floor}`);
  return value;
}

/**
 * Exit elevators alternate sides so the player always traverses the new floor:
 * 1→2 right, 2→3 left, 3→4 right, 4→5 left, 5→6 right.
 */
export function elevatorXForFloor(floor){
  return floor%2===1?ELEVATOR_RIGHT_X:ELEVATOR_LEFT_X;
}

/** Floor numbers sit opposite the onward elevator, matching the supplied reference. */
export function floorLabelX(floor){
  return floor%2===1?FLOOR_LABEL_LEFT_X:FLOOR_LABEL_RIGHT_X;
}

export function floorLabelY(floor){
  const value=FLOOR_LABEL_Y[floor];
  if(!Number.isFinite(value))throw new RangeError(`Unknown Chapter 2 floor label: ${floor}`);
  return value;
}

/**
 * Floor 1 starts on the left. Higher floors begin where the previous elevator arrived,
 * which is opposite the elevator that continues upward from that floor.
 */
export function arrivalElevatorXForFloor(floor){
  if(floor<=1)return null;
  return elevatorXForFloor(floor-1);
}

export function arrivalXForFloor(floor,playerWidth=30){
  if(floor<=1)return FLOOR_LEFT+70;
  const shaft=arrivalElevatorXForFloor(floor);
  return shaft+ELEVATOR_WIDTH/2-playerWidth/2;
}

export function makeFloorPlatforms(){
  return FLOOR_GROUNDS.slice(1).map((y,index)=>({
    floor:index+1,
    x:FLOOR_LEFT,
    y,
    w:FLOOR_RIGHT-FLOOR_LEFT,
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
  return ELEVATOR_LEFT_X>=FLOOR_LEFT
    && ELEVATOR_RIGHT_X+ELEVATOR_WIDTH<=FLOOR_RIGHT;
}
