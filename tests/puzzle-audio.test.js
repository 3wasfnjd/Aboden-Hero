import test from 'node:test';
import assert from 'node:assert/strict';
import {PuzzleAudio,createPuzzleAudio} from '../puzzle-kit/core/puzzle-audio.js';

test('procedural puzzle audio can be configured and muted without a browser context',()=>{
  const audio=createPuzzleAudio({musicVolume:.04,sfxVolume:.12});
  assert.equal(audio instanceof PuzzleAudio,true);
  assert.equal(audio.musicVolume,.04);
  assert.equal(audio.sfxVolume,.12);
  assert.equal(audio.muted,false);
  assert.equal(audio.toggleMuted(),true);
  assert.equal(audio.toggleMuted(),false);
  audio.destroy();
  assert.equal(audio.destroyed,true);
});

test('unlock fails cleanly when Web Audio is unavailable',async()=>{
  const audio=new PuzzleAudio();
  assert.equal(await audio.unlock(),false);
  audio.destroy();
});
