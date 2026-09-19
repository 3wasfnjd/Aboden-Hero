export const DIRS=Object.freeze(['N','E','S','W']);
export const OPPOSITE=Object.freeze({N:'S',E:'W',S:'N',W:'E'});
export const STEP=Object.freeze({N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]});

export const BASE_PORTS=Object.freeze({
  straight:Object.freeze(['N','S']),
  elbow:Object.freeze(['N','E']),
  cross:Object.freeze(['N','E','S','W']),
  tee:Object.freeze(['N','E','W'])
});

export const WIRING_LAYOUT=Object.freeze([
  Object.freeze({type:'straight',solution:1}),
  Object.freeze({type:'tee',solution:0}),
  Object.freeze({type:'straight',solution:1}),
  Object.freeze({type:'elbow',solution:2}),

  Object.freeze({type:'elbow',solution:1}),
  Object.freeze({type:'cross',solution:0}),
  Object.freeze({type:'tee',solution:2}),
  Object.freeze({type:'straight',solution:0}),

  Object.freeze({type:'tee',solution:3}),
  Object.freeze({type:'elbow',solution:0}),
  Object.freeze({type:'cross',solution:0}),
  Object.freeze({type:'elbow',solution:0})
]);

export const INITIAL_ROTATIONS=Object.freeze([
  0,1,2,1,
  2,0,3,1,
  1,3,0,3
]);

export function normalizeRotation(value){
  return ((Number(value)||0)%4+4)%4;
}

export function rotateDirection(direction,quarterTurns=0){
  const index=DIRS.indexOf(direction);
  if(index<0)throw new Error(`Unknown direction: ${direction}`);
  return DIRS[(index+normalizeRotation(quarterTurns))%4];
}

export function portsFor(type,rotation=0){
  const base=BASE_PORTS[type];
  if(!base)throw new Error(`Unknown pipe type: ${type}`);
  return base.map(direction=>rotateDirection(direction,rotation));
}

export function connectedFromStart(layout=WIRING_LAYOUT,rotations=INITIAL_ROTATIONS,{cols=4,rows=3,startIndex=0,startSide='W'}={}){
  if(layout.length!==cols*rows||rotations.length!==layout.length)return new Set();
  const startPorts=portsFor(layout[startIndex].type,rotations[startIndex]);
  if(!startPorts.includes(startSide))return new Set();

  const visited=new Set([startIndex]);
  const queue=[startIndex];

  while(queue.length){
    const index=queue.shift();
    const x=index%cols,y=Math.floor(index/cols);
    const ports=portsFor(layout[index].type,rotations[index]);

    for(const direction of ports){
      const [dx,dy]=STEP[direction];
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
      const next=ny*cols+nx;
      const nextPorts=portsFor(layout[next].type,rotations[next]);
      if(!nextPorts.includes(OPPOSITE[direction]))continue;
      if(!visited.has(next)){visited.add(next);queue.push(next);}
    }
  }

  return visited;
}

export function isWiringSolved(layout=WIRING_LAYOUT,rotations=INITIAL_ROTATIONS,options={}){
  const endIndex=options.endIndex??11;
  const endSide=options.endSide??'E';
  const connected=connectedFromStart(layout,rotations,options);
  if(!connected.has(endIndex))return false;
  return portsFor(layout[endIndex].type,rotations[endIndex]).includes(endSide);
}
