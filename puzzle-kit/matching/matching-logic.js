export const MATCH_COLORS=Object.freeze(['blue','purple','orange']);

export const MATCH_PORTS=Object.freeze([
  Object.freeze({id:'left-blue',side:'left',color:'blue'}),
  Object.freeze({id:'left-purple',side:'left',color:'purple'}),
  Object.freeze({id:'left-orange',side:'left',color:'orange'}),
  Object.freeze({id:'right-blue',side:'right',color:'blue'}),
  Object.freeze({id:'right-orange',side:'right',color:'orange'}),
  Object.freeze({id:'right-purple',side:'right',color:'purple'})
]);

export const MATCH_PAIRS=Object.freeze({
  blue:Object.freeze(['left-blue','right-blue']),
  purple:Object.freeze(['left-purple','right-purple']),
  orange:Object.freeze(['left-orange','right-orange'])
});

export function getPort(id){
  return MATCH_PORTS.find(port=>port.id===id)??null;
}

export function canAttemptMatch(firstId,secondId,connectedColors=new Set()){
  const first=getPort(firstId),second=getPort(secondId);
  if(!first||!second||first.id===second.id)return false;
  if(first.side===second.side)return false;
  if(connectedColors.has(first.color)||connectedColors.has(second.color))return false;
  return true;
}

export function matchingColor(firstId,secondId){
  const first=getPort(firstId),second=getPort(secondId);
  if(!first||!second||first.side===second.side)return null;
  return first.color===second.color?first.color:null;
}

export function isMatchingSolved(connectedColors){
  const set=connectedColors instanceof Set?connectedColors:new Set(connectedColors??[]);
  return MATCH_COLORS.every(color=>set.has(color));
}
