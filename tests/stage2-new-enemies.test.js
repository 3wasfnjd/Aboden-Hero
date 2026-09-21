import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FLOOR_DEFS} from '../src/stage2-state.js';
import {bulletTargetBounds,enemyDisplayHeight} from '../src/hero-weapon.js';
import {fallbackEnemyMuzzle} from '../src/enemy-weapon.js';

const stage2=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
const art=readFileSync(new URL('../src/art.js',import.meta.url),'utf8');
const combat=readFileSync(new URL('../src/combat.js',import.meta.url),'utf8');

test('Chapter 2 adds two drones to floors 1 and 5 and the new guard to floor 3',()=>{
  assert.deepEqual(FLOOR_DEFS[1].enemies,['city','city','drone','drone']);
  assert.deepEqual(FLOOR_DEFS[3].enemies,['city','sniper','newguard']);
  assert.deepEqual(FLOOR_DEFS[5].enemies,['heavy','city','sniper','drone','drone']);
});

test('new Stage 2 guard and both drone poses use the uploaded assets',()=>{
  assert.match(art,/712D453B-A752-4A91-BB87-AE9554BBF4FA\.png/);
  assert.match(art,/CE321790-436E-4BF6-BF00-23D8E11F8635\.png/);
  assert.match(art,/152AB8BD-FD1C-44F8-BCBD-D043437BC255\.png/);
  assert.match(art,/type==='drone'\)\{drawDrone\(e,time\);return;\}/);
  assert.match(art,/type==='newguard'\?newGuardAsset/);
});

test('drones hover, move and have their own shooting rhythm',()=>{
  assert.match(stage2,/e\.kind==='drone'\)e\.y=e\.hoverY\+Math\.sin/);
  assert.match(stage2,/isDrone\?g-82:g-32/);
  assert.match(combat,/drone:\{windup:\.40,speed:285,cooldown:1\.90,range:610/);
  const drone={x:500,y:800,w:48,h:46,kind:'drone',aimX:300};
  assert.equal(enemyDisplayHeight(drone),82);
  const box=bulletTargetBounds(drone);
  assert.ok(box.y<drone.y&&box.h>drone.h);
  assert.ok(fallbackEnemyMuzzle(drone,0,false).y>drone.y);
});

test('expanded combat floors use explicit four- and five-enemy layouts',()=>{
  assert.match(stage2,/if\(count===4\)return \[235,390,560,720\]/);
  assert.match(stage2,/if\(count===5\)return \[215,345,480,615,750\]/);
});
