import {createCubesPuzzle} from './cubes.js?v=1';

const root=document.getElementById('puzzle-root');

try{
  const puzzle=await createCubesPuzzle({root});
  puzzle.onSolved(()=>{document.title='✓ Cubes Solved • ABODEN Puzzle Kit';});
  window.puzzle=puzzle;
  puzzle.start();
}catch(error){
  console.error('Failed to start Cubes Puzzle',error);
  const message=document.createElement('div');
  message.className='puzzle-empty';
  message.textContent='تعذر تشغيل لغز المكعبات. افتح وحدة المطور لمراجعة الخطأ.';
  root.replaceChildren(message);
}
