import test from 'node:test';
import assert from 'node:assert/strict';
import {N,E,S,W,createPipesPuzzle,rotatePipe,isPipesSolved,createCubesPuzzle,slideCube,isCubesSolved,createMatchPuzzle,connectMatch,isMatchSolved} from '../src/puzzles.js';

// Each cell's connectivity depends only on its own rotation, so "is this puzzle
// solvable" reduces to: does a route from the start port to the end port exist
// through cells that can each be independently rotated to pass it through? A
// BFS over (cell, entry side) answers that without needing to know which cells
// the generator actually intended as the path — then we replay the discovered
// route's rotations for real via rotatePipe to prove the UI-facing move also
// reaches solved.
const SHAPES={empty:0,straight:N|S,elbow:N|E,t:N|E|S,cross:N|E|S|W};
const OPP={[N]:S,[E]:W,[S]:N,[W]:E};
const STEP={[N]:[-1,0],[E]:[0,1],[S]:[1,0],[W]:[0,-1]};
function baseRotate(bits,times){for(let i=0;i<times;i++){let nd=0;if(bits&N)nd|=E;if(bits&E)nd|=S;if(bits&S)nd|=W;if(bits&W)nd|=N;bits=nd;}return bits;}
function exitsFor(type,inDir){
 const out=new Map();
 for(let rot=0;rot<4;rot++){
  const bits=baseRotate(SHAPES[type],rot);
  if(!(bits&inDir))continue;
  for(const outDir of [N,E,S,W])if(outDir!==inDir&&(bits&outDir)&&!out.has(outDir))out.set(outDir,rot);
 }
 return out;
}
function findSolutionMoves(p){
 const {rows,cols,cells,start,end}=p;
 const startKey=(r,c,d)=>`${r},${c},${d}`;
 const seen=new Set([startKey(start.row,start.col,W)]);
 const queue=[[start.row,start.col,W]],pred=new Map();
 while(queue.length){
  const [r,c,inDir]=queue.shift();
  const exits=exitsFor(cells[r][c].type,inDir);
  if(r===end.row&&c===end.col&&exits.has(E))return backtrack(r,c,inDir);
  for(const [outDir,rot] of exits){
   const [dr,dc]=STEP[outDir],nr=r+dr,nc=c+dc;
   if(nr<0||nc<0||nr>=rows||nc>=cols)continue;
   const nextIn=OPP[outDir],key=startKey(nr,nc,nextIn);
   if(seen.has(key))continue;
   seen.add(key);
   pred.set(key,{from:[r,c,inDir],rot,r,c});
   queue.push([nr,nc,nextIn]);
  }
 }
 return null;
 function backtrack(r,c,inDir){
  const moves=[];
  // The final cell's rotation must satisfy inDir->E; exitsFor already recorded it.
  moves.push({r,c,rot:exitsFor(cells[r][c].type,inDir).get(E)});
  let key=startKey(r,c,inDir);
  while(pred.has(key)){
   const step=pred.get(key);
   moves.push({r:step.r,c:step.c,rot:step.rot});
   const [pr,pc,pd]=step.from;key=startKey(pr,pc,pd);
  }
  return moves;
 }
}
function trySolve(p){
 const moves=findSolutionMoves(p);
 if(!moves)return false;
 for(const {r,c,rot} of moves)while(!p.solved&&p.cells[r][c].rot!==rot)rotatePipe(p,r,c);
 return p.solved;
}

test('pipes puzzle starts unsolved but the constructed path is always solvable by rotation alone',()=>{
 for(let seed=1;seed<=40;seed++){
  const p=createPipesPuzzle(seed);
  assert(!isPipesSolved(p),`seed ${seed} should not start solved`);
  assert(trySolve(p),`seed ${seed} unsolvable by greedy per-cell rotation`);
  assert(isPipesSolved(p));
 }
});
test('rotating a pipe does nothing once the puzzle is already solved',()=>{
 const p=createPipesPuzzle(2);
 assert(trySolve(p));
 const snapshot=JSON.stringify(p.cells);
 rotatePipe(p,0,0);
 assert.equal(JSON.stringify(p.cells),snapshot);
});

test('cubes puzzle starts unsolved and is solvable via legal slides',()=>{
 for(let seed=1;seed<=20;seed++){
  const p=createCubesPuzzle(seed);
  assert(!isCubesSolved(p),`seed ${seed} should not start solved`);
  const key=cells=>cells.map(c=>c.type).join(',');
  const neighborsOf=i=>{const row=Math.floor(i/3),col=i%3;const l=[];if(row>0)l.push(i-3);if(row<2)l.push(i+3);if(col>0)l.push(i-1);if(col<2)l.push(i+1);return l;};
  let frontier=[p.cells.map(c=>({...c}))],seen=new Set([key(p.cells)]),solved=false;
  for(let depth=0;depth<15&&frontier.length&&!solved;depth++){
   const next=[];
   for(const state of frontier){
    const emptyIdx=state.findIndex(c=>c.type==='empty');
    for(const n of neighborsOf(emptyIdx)){
     const clone=state.map(c=>({...c}));
     [clone[emptyIdx],clone[n]]=[clone[n],clone[emptyIdx]];
     const k=key(clone);
     if(seen.has(k))continue;
     seen.add(k);
     const test={kind:'cubes',cols:3,rows:3,cells:clone};
     if(isCubesSolved(test)){solved=true;break;}
     next.push(clone);
    }
    if(solved)break;
   }
   frontier=next;
  }
  assert(solved,`seed ${seed} not solvable by sliding within depth 15`);
 }
});
test('sliding a cube not adjacent to the empty slot is a no-op',()=>{
 const p=createCubesPuzzle(1);
 const emptyIdx=p.cells.findIndex(c=>c.type==='empty');
 const farIdx=(emptyIdx+4)%9===emptyIdx?(emptyIdx+1)%9:(emptyIdx+4)%9;
 const before=JSON.stringify(p.cells);
 slideCube(p,farIdx);
 assert.equal(JSON.stringify(p.cells),before);
});

test('match puzzle starts mismatched and is solved by pairing each symbol',()=>{
 for(let seed=1;seed<=20;seed++){
  const p=createMatchPuzzle(seed);
  assert(!isMatchSolved(p),`seed ${seed} should not start solved`);
  for(let li=0;li<3;li++)connectMatch(p,li,p.right.indexOf(p.left[li]));
  assert(isMatchSolved(p),`seed ${seed} not solved after pairing by symbol`);
  assert(p.solved);
 }
});
test('connecting to an already-used terminal swaps the two connections, keeping a valid bijection',()=>{
 const p=createMatchPuzzle(1);
 connectMatch(p,0,2);
 assert.equal(p.connections[0],2);
 assert.equal(new Set(p.connections).size,3,'connections stay a permutation');
});
