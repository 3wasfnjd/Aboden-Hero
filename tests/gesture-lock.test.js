import test from 'node:test';
import assert from 'node:assert/strict';
import {isZoomShortcut,lockSafariZoom} from '../src/gesture-lock.js';

test('Safari zoom keyboard shortcuts are identified',()=>{
  assert.equal(isZoomShortcut({metaKey:true,key:'+'}),true);
  assert.equal(isZoomShortcut({ctrlKey:true,key:'-'}),true);
  assert.equal(isZoomShortcut({metaKey:true,code:'Digit0'}),true);
  assert.equal(isZoomShortcut({key:'+'}),false);
  assert.equal(isZoomShortcut({metaKey:true,key:'k'}),false);
});

test('gesture lock is safe without a DOM',()=>{
  assert.equal(typeof lockSafariZoom({root:null,viewport:null}),'function');
});
