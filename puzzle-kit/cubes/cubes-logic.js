export const CUBE_ROUTE=Object.freeze([
  Object.freeze({slot:0,type:'start'}),
  Object.freeze({slot:1,type:'right'}),
  Object.freeze({slot:2,type:'down'}),
  Object.freeze({slot:5,type:'down'}),
  Object.freeze({slot:8,type:'goal'})
]);

export const CUBE_INITIAL=Object.freeze([
  'lock','down-a','start',
  'right',null,'goal',
  'straight','down-b','junction'
]);

export const CUBE_DISTRACTORS=Object.freeze(['lock','straight','junction']);

export function cubeType(id){
  if(id==='down-a'||id==='down-b')return 'down';
  return id;
}

export function routeProgress(order){
  if(!Array.isArray(order)||order.length!==9)return 0;
  return CUBE_ROUTE.reduce((count,step)=>count+(cubeType(order[step.slot])===step.type?1:0),0);
}

export function isCubesSolved(order){
  return routeProgress(order)===CUBE_ROUTE.length;
}

export function swapCubeSlots(order,a,b){
  if(!Array.isArray(order)||order.length!==9)return null;
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>8||b>8)return null;
  const next=[...order];
  [next[a],next[b]]=[next[b],next[a]];
  return next;
}
