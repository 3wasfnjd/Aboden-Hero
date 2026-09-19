// Full-screen DOM puzzle overlay: renders the three terminal puzzle types
// from src/puzzles.js and reports back to main.js when one is solved.
import {N,E,S,W,createPipesPuzzle,rotatePipe,createCubesPuzzle,slideCube,createMatchPuzzle,connectMatch} from './puzzles.js?v=20260919-puzzles-1';

const TITLES={pipes:'لوحة التوصيل الكهربائي',cubes:'لوحة ترتيب المكعبات',match:'لوحة مطابقة الرموز'};
const HINTS={pipes:'اضغط على أنبوب لتدويره — وصّل البداية بالنهاية',cubes:'اضغط على مكعب مجاور للخانة الفارغة لتحريكه',match:'اضغط رمزًا يسارًا ثم الرمز المطابق له يمينًا'};
const SYMBOL_GLYPH={hex:'⬡',bolt:'⚡',tri:'▲'};
const SYMBOL_COLOR={hex:'#4fb2e8',bolt:'#f2c94c',tri:'#b98af0'};
const CUBE_GLYPH={start:'S',goal:'G',straight:'═',arrow:'➤',cross:'✦',locked:'🔒',empty:''};

let overlay,titleEl,hintEl,statusEl,boardEl,closeBtn;
let puzzle=null,selection=-1,onSolved=null,onClose=null;

function ensureDom(){
 if(overlay)return;
 overlay=document.getElementById('puzzle-overlay');
 titleEl=document.getElementById('puzzle-title');
 hintEl=document.getElementById('puzzle-hint');
 statusEl=document.getElementById('puzzle-status');
 boardEl=document.getElementById('puzzle-board');
 closeBtn=document.getElementById('puzzle-close');
 closeBtn.addEventListener('click',()=>close());
 boardEl.addEventListener('click',onBoardClick);
}

function svg(children,viewBox='0 0 40 40'){return `<svg viewBox="${viewBox}" class="puzzle-cell-svg">${children}</svg>`;}
const MID={[N]:'20,3',[E]:'37,20',[S]:'20,37',[W]:'3,20'};
function pipeSvg(type,rot){
 const SHAPES={empty:0,straight:N|S,elbow:N|E,t:N|E|S,cross:N|E|S|W};
 const bits=SHAPES[type];
 let lines='';
 for(const d of [N,E,S,W])if(bits&d)lines+=`<line x1="20" y1="20" x2="${MID[d].split(',')[0]}" y2="${MID[d].split(',')[1]}"/>`;
 if(bits)lines+='<circle cx="20" cy="20" r="3.4"/>';
 return `<div class="puzzle-pipe" style="transform:rotate(${rot*90}deg)">${svg(lines)}</div>`;
}

function renderPipes(){
 boardEl.className='puzzle-board pipes'+(puzzle.solved?' solved':' unsolved');
 let grid=`<div class="pipes-grid" style="grid-template-columns:repeat(${puzzle.cols},1fr);grid-template-rows:repeat(${puzzle.rows},1fr)">`;
 for(let r=0;r<puzzle.rows;r++)for(let c=0;c<puzzle.cols;c++){
  const cell=puzzle.cells[r][c];
  grid+=`<button class="puzzle-cell" data-row="${r}" data-col="${c}" aria-label="أنبوب">${pipeSvg(cell.type,cell.rot)}</button>`;
 }
 grid+='</div>';
 boardEl.innerHTML=`<div class="pipes-row"><span class="pipes-port">◀ START</span>${grid}<span class="pipes-port">END ▶</span></div>`;
}

function renderCubes(){
 boardEl.className='puzzle-board cubes'+(puzzle.solved?' solved':' unsolved');
 let html='';
 puzzle.cells.forEach((cell,i)=>{
  html+=`<button class="puzzle-cell cube-${cell.type}" data-index="${i}" aria-label="${cell.type}">${CUBE_GLYPH[cell.type]}</button>`;
 });
 boardEl.innerHTML=html;
}

function renderMatch(){
 boardEl.className='puzzle-board match'+(puzzle.solved?' solved':' unsolved');
 let leftNodes='',rightNodes='';
 puzzle.left.forEach((sym,i)=>{leftNodes+=`<button class="puzzle-node left${selection===i?' selected':''}" data-side="left" data-idx="${i}" style="--nc:${SYMBOL_COLOR[sym]}">${SYMBOL_GLYPH[sym]}</button>`;});
 puzzle.right.forEach((sym,i)=>{rightNodes+=`<button class="puzzle-node right" data-side="right" data-idx="${i}" style="--nc:${SYMBOL_COLOR[sym]}">${SYMBOL_GLYPH[sym]}</button>`;});
 const nodes=`<div class="match-col">${leftNodes}</div><div class="match-col">${rightNodes}</div>`;
 let wires='';
 puzzle.left.forEach((sym,i)=>{
  const ri=puzzle.connections[i];
  const y1=14+i*28,y2=14+ri*28;
  const ok=puzzle.right[ri]===sym;
  wires+=`<path d="M18 ${y1} C 50 ${y1}, 50 ${y2}, 82 ${y2}" stroke="${SYMBOL_COLOR[sym]}" fill="none" stroke-width="3" opacity="${ok?1:.55}" stroke-dasharray="${ok?'0':'4 4'}"/>`;
 });
 boardEl.innerHTML=`<svg viewBox="0 0 100 84" class="match-wires">${wires}</svg><div class="match-nodes">${nodes}</div>`;
}

function render(){
 if(!puzzle)return;
 hintEl.textContent=HINTS[puzzle.kind];
 statusEl.textContent=puzzle.solved?'متصل ✦ ONLINE':'غير متصل ✦ OFFLINE';
 statusEl.className=puzzle.solved?'online':'offline';
 if(puzzle.kind==='pipes')renderPipes();
 else if(puzzle.kind==='cubes')renderCubes();
 else renderMatch();
 if(puzzle.solved)finishSoon();
}

let finishTimer=null;
function finishSoon(){
 if(finishTimer)return;
 finishTimer=setTimeout(()=>{finishTimer=null;const cb=onSolved;close();cb?.();},650);
}

function onBoardClick(e){
 if(!puzzle||puzzle.solved)return;
 const cell=e.target.closest('.puzzle-cell,.puzzle-node');
 if(!cell)return;
 if(puzzle.kind==='pipes'){rotatePipe(puzzle,+cell.dataset.row,+cell.dataset.col);render();}
 else if(puzzle.kind==='cubes'){slideCube(puzzle,+cell.dataset.index);render();}
 else if(puzzle.kind==='match'){
  if(cell.dataset.side==='left'){selection=+cell.dataset.idx;render();}
  else if(selection>=0){connectMatch(puzzle,selection,+cell.dataset.idx);selection=-1;render();}
 }
}

export function openPuzzle(kind,seed,solvedCb,closeCb){
 ensureDom();
 selection=-1;onSolved=solvedCb;onClose=closeCb;
 puzzle=kind==='pipes'?createPipesPuzzle(seed):kind==='cubes'?createCubesPuzzle(seed):createMatchPuzzle(seed);
 titleEl.textContent=TITLES[kind];
 overlay.hidden=false;
 render();
}

export function close(){
 if(finishTimer){clearTimeout(finishTimer);finishTimer=null;}
 if(!overlay||overlay.hidden)return;
 overlay.hidden=true;
 puzzle=null;
 const cb=onClose;onClose=null;
 cb?.();
}

export function isOpen(){return !!puzzle;}
