import {createWiringPuzzle} from './wiring.js?v=7';

const root=document.getElementById('puzzle-root');

try{
  const puzzle=await createWiringPuzzle({root});
  puzzle.onSolved(()=>{
    document.title='✓ Wiring Solved • ABODEN Puzzle Kit';
  });
  window.puzzle=puzzle;
  puzzle.start();
}catch(error){
  console.error('Failed to start Wiring Puzzle',error);
  const message=document.createElement('div');
  message.className='puzzle-empty';
  message.textContent='تعذر تشغيل اللغز. افتح وحدة المطور لمراجعة الخطأ.';
  root.replaceChildren(message);
}
