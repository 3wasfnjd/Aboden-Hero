import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readdirSync,readFileSync,statSync} from 'node:fs';
import {dirname,extname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {cubeAssets} from '../puzzle-kit/cubes/assets.js';
import {matchingAssets} from '../puzzle-kit/matching/assets.js';
import {wiringAssets} from '../puzzle-kit/wiring/assets.js';

const root=fileURLToPath(new URL('../',import.meta.url));
function filesUnder(dir){
  return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(entry.name.startsWith('.'))return [];
    const path=join(dir,entry.name);
    return entry.isDirectory()?filesUnder(path):[path];
  });
}
function requireFile(path,source){
  assert.ok(existsSync(path),`${source} references missing resource: ${path}`);
  assert.ok(statSync(path).isFile()&&statSync(path).size>0,`${source} references an empty resource: ${path}`);
}
function checkRelative(url,base,source){
  if(!url||/^(?:[a-z]+:|\/\/|#)/i.test(url))return;
  const path=resolve(base,url.split(/[?#]/)[0]);
  requireFile(path.endsWith('/')||existsSync(path)&&statSync(path).isDirectory()?join(path,'index.html'):path,source);
}

test('game and standalone puzzle pages retain their local modules, styles and images',()=>{
  for(const file of filesUnder(root)){
    if(!['.html','.css','.js'].includes(extname(file))||file.includes('/tests/'))continue;
    const source=readFileSync(file,'utf8'),base=dirname(file);
    if(file.endsWith('.html')){
      for(const match of source.matchAll(/(?:src|href)=["']([^"']+)["']/g))checkRelative(match[1],base,file);
    }
    if(file.endsWith('.css')||file.endsWith('.html')){
      for(const match of source.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g))checkRelative(match[1],base,file);
    }
    if(file.endsWith('.js')){
      for(const match of source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g))checkRelative(match[1],base,file);
      // Renderer image URLs are relative to the game document, not src/.
      for(const match of source.matchAll(/["'](\.\/assets\/[^"']+)["']/g))checkRelative(match[1],root,file);
    }
  }
});

test('all dynamically constructed Puzzle Kit asset URLs resolve to retained files',()=>{
  function visit(value){
    if(typeof value==='string'&&value.startsWith('file:'))requireFile(fileURLToPath(value),'Puzzle Kit asset map');
    else if(value&&typeof value==='object')Object.values(value).forEach(visit);
  }
  [cubeAssets,matchingAssets,wiringAssets].forEach(visit);
});

test('CI asset checks refer to existing files',()=>{
  const workflow=readFileSync(join(root,'.github/workflows/stage2-ci.yml'),'utf8');
  for(const match of workflow.matchAll(/test -s (\S+)/g))requireFile(join(root,match[1]),'Stage 2 CI');
});
