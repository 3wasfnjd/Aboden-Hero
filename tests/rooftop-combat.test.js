import test from 'node:test';
import assert from 'node:assert/strict';

test('a rooftop boss hit pushes the hero away from the attacker',async()=>{
  const PreviousImage=globalThis.Image;
  globalThis.Image=class{addEventListener(){}};
  try{
    const {createRooftopBattle}=await import('../src/stage2-rooftop.js');
    const battle=createRooftopBattle({});
    const idle={left:false,right:false,jump:false,dash:false,shoot:false};
    battle.start();
    let hit=false;
    for(let i=0;i<2400;i++){
      const before=battle.stats();
      const events=battle.tick(1/120,idle);
      if(events.includes('hero-hit')){
        const after=battle.stats();
        assert.ok(before.bossX>before.heroX);
        assert.ok(after.heroX<before.heroX);
        assert.ok(after.heroHp<before.heroHp);
        hit=true;break;
      }
    }
    assert.ok(hit,'the boss reaches the hero and lands its first attack');
  }finally{
    if(PreviousImage===undefined)delete globalThis.Image;else globalThis.Image=PreviousImage;
  }
});
