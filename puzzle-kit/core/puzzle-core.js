export const PUZZLE_EVENTS=Object.freeze({
  READY:'puzzle:ready',
  START:'puzzle:start',
  RESET:'puzzle:reset',
  SOLVED:'puzzle:solved',
  CLOSE:'puzzle:close',
  ERROR:'puzzle:error'
});

export class PuzzleCore extends EventTarget {
  constructor({id,root,assets={}}={}){
    super();
    if(!id)throw new Error('PuzzleCore requires an id');
    if(!root)throw new Error('PuzzleCore requires a root element');
    this.id=id;
    this.root=root;
    this.assets=assets;
    this.started=false;
    this.solved=false;
    this.destroyed=false;
  }

  emit(type,detail={}){
    this.dispatchEvent(new CustomEvent(type,{detail:{id:this.id,...detail}}));
  }

  on(type,handler){
    this.addEventListener(type,handler);
    return ()=>this.removeEventListener(type,handler);
  }

  onSolved(handler){
    return this.on(PUZZLE_EVENTS.SOLVED,event=>handler(event.detail));
  }

  start(){
    if(this.destroyed)return false;
    this.started=true;
    this.emit(PUZZLE_EVENTS.START);
    return true;
  }

  reset(){
    if(this.destroyed)return false;
    this.started=false;
    this.solved=false;
    this.emit(PUZZLE_EVENTS.RESET);
    return true;
  }

  solve(detail={}){
    if(this.destroyed||this.solved)return false;
    this.solved=true;
    this.emit(PUZZLE_EVENTS.SOLVED,detail);
    return true;
  }

  close(){
    if(this.destroyed)return false;
    this.emit(PUZZLE_EVENTS.CLOSE);
    return true;
  }

  destroy(){
    this.destroyed=true;
    this.root.replaceChildren();
  }
}
