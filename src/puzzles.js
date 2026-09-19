// Pure puzzle simulation, no DOM: state factories, moves and solved-checks
// for the three rooftop-floor terminals. puzzle-ui.js renders this state.
export const N=1,E=2,S=4,W=8;
const OPP={[N]:S,[E]:W,[S]:N,[W]:E};
const SHAPES={empty:0,straight:N|S,elbow:N|E,t:N|E|S,cross:N|E|S|W};
function rotateDirs(d,times){
 for(let i=0;i<(((times%4)+4)%4);i++){
  let nd=0;
  if(d&N)nd|=E;if(d&E)nd|=S;if(d&S)nd|=W;if(d&W)nd|=N;
  d=nd;
 }
 return d;
}
function mulberry32(seed){
 let a=seed>>>0;
 return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}

// ---- Puzzle 1: pipe-routing grid ----
export function createPipesPuzzle(seed=1){
 const rand=mulberry32(seed),cols=4,rows=5;
 const path=[[0,0]];
 let r=0,c=0;
 while(r<rows-1||c<cols-1){
  if(r<rows-1&&(c>=cols-1||rand()<.55)){r++;}
  else c++;
  path.push([r,c]);
 }
 const cells=Array.from({length:rows},()=>Array.from({length:cols},()=>({type:'empty',rot:0})));
 const DECOYS=['straight','elbow','t','cross','empty'];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)cells[row][col]={type:DECOYS[Math.floor(rand()*DECOYS.length)],rot:Math.floor(rand()*4)};
 for(let i=0;i<path.length;i++){
  const [pr,pc]=path[i];
  let need=0;
  if(i>0){const [ar,ac]=path[i-1];need|=ar<pr?N:ar>pr?S:ac<pc?W:E;}
  else need|=W; // start feeds in from the outside-left port
  if(i<path.length-1){const [nr,nc]=path[i+1];need|=nr>pr?S:nr<pr?N:nc>pc?E:W;}
  else need|=E; // end feeds out to the outside-right port
  const bits=[N,E,S,W].filter(b=>need&b);
  const type=bits.length===1?'straight':bits.length===2&&OPP[bits[0]]===bits[1]?'straight':'elbow';
  let rot=0;
  for(;rot<4;rot++)if(rotateDirs(SHAPES[type],rot)===need)break;
  cells[pr][pc]={type,rot:Math.floor(rand()*4)}; // placed, but scrambled so the player must rotate it
 }
 return {kind:'pipes',cols,rows,start:{row:0,col:0},end:{row:rows-1,col:cols-1},cells,solved:false};
}
export function rotatePipe(p,row,col){
 if(p.solved)return;
 const cell=p.cells[row][col];
 cell.rot=(cell.rot+1)%4;
 p.solved=isPipesSolved(p);
}
function pipeConn(cell){return rotateDirs(SHAPES[cell.type],cell.rot);}
export function isPipesSolved(p){
 const {rows,cols,cells,start,end}=p;
 const seen=new Set();
 const startKey=`${start.row},${start.col}`;
 if(!(pipeConn(cells[start.row][start.col])&W))return false;
 const stack=[[start.row,start.col]];
 seen.add(startKey);
 while(stack.length){
  const [r,c]=stack.pop();
  const conn=pipeConn(cells[r][c]);
  for(const [d,dr,dc] of [[N,-1,0],[E,0,1],[S,1,0],[W,0,-1]]){
   if(!(conn&d))continue;
   const nr=r+dr,nc=c+dc;
   if(nr<0||nc<0||nr>=rows||nc>=cols)continue;
   if(!(pipeConn(cells[nr][nc])&OPP[d]))continue;
   const key=`${nr},${nc}`;
   if(seen.has(key))continue;
   seen.add(key);
   stack.push([nr,nc]);
  }
 }
 if(!seen.has(`${end.row},${end.col}`))return false;
 return !!(pipeConn(cells[end.row][end.col])&E);
}

// ---- Puzzle 2: 3x3 sliding cube arrangement ----
const CONDUCTIVE=new Set(['start','goal','straight','arrow','cross']);
export function createCubesPuzzle(seed=2){
 const rand=mulberry32(seed);
 // Two locked cubes (not one) so the 3x3 grid can actually be disconnected —
 // with only one non-conductive cell besides the empty slot, every
 // arrangement stays trivially connected and there is nothing to solve.
 const solved=['start','straight','locked','arrow','cross','straight','locked','goal','empty'];
 const grid=solved.map(type=>({type}));
 const at=(i)=>({row:Math.floor(i/3),col:i%3});
 const neighborsOf=(i)=>{const {row,col}=at(i);const list=[];if(row>0)list.push(i-3);if(row<2)list.push(i+3);if(col>0)list.push(i-1);if(col<2)list.push(i+1);return list;};
 const shuffle=(n)=>{let emptyIdx=grid.findIndex(c=>c.type==='empty');for(let i=0;i<n;i++){const options=neighborsOf(emptyIdx);const pick=options[Math.floor(rand()*options.length)];[grid[emptyIdx],grid[pick]]=[grid[pick],grid[emptyIdx]];emptyIdx=pick;}};
 shuffle(30);
 const p={kind:'cubes',cols:3,rows:3,cells:grid,solved:false};
 for(let guard=0;guard<50&&isCubesSolved(p);guard++)shuffle(5);
 return p;
}
export function slideCube(p,index){
 if(p.solved)return;
 const emptyIdx=p.cells.findIndex(c=>c.type==='empty');
 const {row:er,col:ec}=({row:Math.floor(emptyIdx/3),col:emptyIdx%3});
 const {row:ir,col:ic}=({row:Math.floor(index/3),col:index%3});
 if(Math.abs(er-ir)+Math.abs(ec-ic)!==1)return;
 [p.cells[emptyIdx],p.cells[index]]=[p.cells[index],p.cells[emptyIdx]];
 p.solved=isCubesSolved(p);
}
export function isCubesSolved(p){
 const start=p.cells.findIndex(c=>c.type==='start'),goal=p.cells.findIndex(c=>c.type==='goal');
 const seen=new Set([start]),stack=[start];
 const neighborsOf=(i)=>{const row=Math.floor(i/3),col=i%3;const list=[];if(row>0)list.push(i-3);if(row<2)list.push(i+3);if(col>0)list.push(i-1);if(col<2)list.push(i+1);return list;};
 while(stack.length){
  const i=stack.pop();
  for(const n of neighborsOf(i)){
   if(seen.has(n)||!CONDUCTIVE.has(p.cells[n].type))continue;
   seen.add(n);stack.push(n);
  }
 }
 return seen.has(goal);
}

// ---- Puzzle 3: symbol-matching terminals ----
const SYMBOLS=['hex','bolt','tri'];
export function createMatchPuzzle(seed=3){
 const rand=mulberry32(seed);
 let right=[...SYMBOLS];
 do{for(let i=right.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[right[i],right[j]]=[right[j],right[i]];}}
 while(right.every((s,i)=>s===SYMBOLS[i]));
 return {kind:'match',left:[...SYMBOLS],right,connections:[0,1,2],solved:false};
}
export function connectMatch(p,leftIdx,rightIdx){
 if(p.solved)return;
 const other=p.connections.indexOf(rightIdx);
 const prevTarget=p.connections[leftIdx];
 p.connections[leftIdx]=rightIdx;
 if(other!==-1&&other!==leftIdx)p.connections[other]=prevTarget;
 p.solved=isMatchSolved(p);
}
export function isMatchSolved(p){return p.left.every((sym,i)=>p.right[p.connections[i]]===sym);}
