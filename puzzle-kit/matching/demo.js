import {createMatchingPuzzle} from './matching.js?v=1';

const root=document.getElementById('puzzle-root');

try{
  const puzzle=await createMatchingPuzzle({root});
  puzzle.onSolved(()=>{document.title='✓ Matching Solved • ABODEN Puzzle Kit';});
  window.puzzle=puzzle;
  puzzle.start();
}catch(error){
  console.error('Failed to start Matching Puzzle',error);
  const message=document.createElement('div');
  message.className='puzzle-empty';
  message.textContent='تعذر تشغيل لغز المطابقة. افتح وحدة المطور لمراجعة الخطأ.';
  root.replaceChildren(message);
}
