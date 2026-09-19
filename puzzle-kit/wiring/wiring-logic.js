export const DIRS=Object.freeze(['N','E','S','W']);
export const OPPOSITE=Object.freeze({N:'S',E:'W',S:'N',W:'E'});
export const STEP=Object.freeze({N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]});

export const BASE_PORTS=Object.freeze({
  straight:Object.freeze(['N','S']),
  elbow:Object.freeze(['N','E']),
  cross:Object.freeze(['N','E','S','W']),
  tee:Object.freeze(['N','E','W'])
});

// User-defined solution path from START to END:
// r1c1 -> r2c1 -> r2c2 -> r2c3 -> r2c4 -> r3c4
export const SOLUTION_PATH=Object.freeze([0,4,5,6,7,11]);

export const WIRING_LAYOUT=Object.freeze([
  Object.freeze({type:'elbow',solution:2,path:true}),
  Object.freeze({type:'tee',solution:null,path:false}),
  Object.freeze({type:'cross',solution:null,path:false}),
  Object.freeze({type:'straight',solution:null,path:false}),

  Object.freeze({type:'elbow',solution:0,path:true}),
  Object.freeze({type:'straight',solution:1,path:true}),
  Object.freeze({type:'straight',solution:1,path:true}),
  Object.freeze({type:'elbow',solution:2,path:true}),

  Object.freeze({type:'tee',solution:null,path:false}),
  Object.freeze({type:'cross',solution:null,path:false}),
  Object.freeze({type:'straight',solution:null,path:false}),
  Object.freeze({type:'elbow',solution:0,path:true})
]);

// Starts deliberately unsolved. Piece types stay fixed; taps rotate them.
export const INITIAL_ROTATIONS=Object.freeze([
  1,2,1,0,
  1,0,2,1,
  2,3,1,3
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

function samePorts(a,b){
  if(a.length!==b.length)return false;
  const set=new Set(a);
  return b.every(port=>set.has(port));
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

export function matchesDefinedPath(layout=WIRING_LAYOUT,rotations=INITIAL_ROTATIONS){
  return SOLUTION_PATH.every(index=>{
    const tile=layout[index];
    if(tile?.solution==null)return false;
    return samePorts(
      portsFor(tile.type,rotations[index]),
      portsFor(tile.type,tile.solution)
    );
  });
}

export function isWiringSolved(layout=WIRING_LAYOUT,rotations=INITIAL_ROTATIONS,options={}){
  const endIndex=options.endIndex??11;
  const endSide=options.endSide??'E';

  // The puzzle must match the user's intended six-piece route, not an
  // accidental alternative route through distractor cells.
  if(!matchesDefinedPath(layout,rotations))return false;

  const connected=connectedFromStart(layout,rotations,options);
  if(!connected.has(endIndex))return false;
  return portsFor(layout[endIndex].type,rotations[endIndex]).includes(endSide);
}
