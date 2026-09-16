const W = 480;
const H = 270;

class GameScene extends Phaser.Scene {
  constructor(){ super('game'); }

  create(){
    this.physics.world.setBounds(0, 0, 3200, H);
    this.cameras.main.setBounds(0, 0, 3200, H);
    this.cameras.main.setBackgroundColor('#18213a');

    // Backdrop
    this.add.rectangle(1600, 135, 3200, 270, 0x18213a).setScrollFactor(0);
    for (let x=0; x<3200; x+=160) {
      this.add.rectangle(x+80, 150, 100, 70, 0x26365f).setOrigin(.5,1).setDepth(-2);
      this.add.rectangle(x+35, 190, 55, 110, 0x31446f).setOrigin(.5,1).setDepth(-2);
    }

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    this.makePlatform(1600, 250, 3200, 40);
    this.makePlatform(520, 205, 180, 18);
    this.makePlatform(930, 170, 160, 18);
    this.makePlatform(1390, 210, 220, 18);
    this.makePlatform(1890, 180, 170, 18);
    this.makePlatform(2400, 205, 210, 18);

    // Player placeholder sprite (replace later with your character spritesheet)
    const g = this.add.graphics();
    g.fillStyle(0xffcc44).fillRoundedRect(0, 0, 28, 42, 6);
    g.fillStyle(0x1f2937).fillRect(20, 11, 8, 6);
    g.generateTexture('hero', 28, 42);
    g.destroy();

    this.player = this.physics.add.sprite(120, 180, 'hero');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(22, 38).setOffset(3, 4);
    this.player.setDepth(3);
    this.player.setMaxVelocity(235, 620);

    this.physics.add.collider(this.player, this.platforms);

    // Enemies
    const eg = this.add.graphics();
    eg.fillStyle(0xe44d61).fillRoundedRect(0,0,26,30,6);
    eg.fillStyle(0xffffff).fillCircle(18,9,3);
    eg.generateTexture('enemy',26,30); eg.destroy();

    this.enemies = this.physics.add.group();
    [650, 1040, 1500, 2040, 2550].forEach((x,i)=>{
      const e=this.enemies.create(x, 210, 'enemy');
      e.setCollideWorldBounds(true).setVelocityX(i%2?45:-45).setBounce(1,0);
      e.hp=2;
    });
    this.physics.add.collider(this.enemies, this.platforms);

    // Bullets
    const bg = this.add.graphics();
    bg.fillStyle(0xfff36b).fillRect(0,0,10,4);
    bg.generateTexture('bullet',10,4);
    bg.destroy();

    this.bullets=this.physics.add.group({maxSize:12});
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);

    this.cursors=this.input.keyboard.createCursorKeys();
    this.keyA=this.input.keyboard.addKey('A');
    this.keyD=this.input.keyboard.addKey('D');
    this.keyJ=this.input.keyboard.addKey('J');
    this.keyK=this.input.keyboard.addKey('K');

    this.facing=1;
    this.lastShot=0;
    this.playerHP=3;
    this.invulnerableUntil=0;

    // Movement tuning
    this.moveSpeed = 220;
    this.groundAccel = 1650;
    this.airAccel = 980;
    this.groundDecel = 2100;
    this.airDecel = 360;
    this.jumpVelocity = -385;
    this.jumpCutVelocity = -150;
    this.coyoteTime = 110;
    this.jumpBufferTime = 130;
    this.lastGroundedAt = 0;
    this.jumpBufferedUntil = 0;
    this.wasJumpHeld = false;

    this.createTouchControls();

    this.cameras.main.startFollow(this.player, true, 0.14, 0.12, -70, 0);
    this.cameras.main.setDeadzone(86, 48);
    this.cameras.main.setLerp(0.14, 0.12);

    this.hud=this.add.text(8,8,'HP ♥♥♥', {
      fontFamily:'monospace',fontSize:'14px',color:'#ffffff',stroke:'#000',strokeThickness:3
    }).setScrollFactor(0).setDepth(20);

    this.tip=this.add.text(W/2,16,'MOVE • JUMP • SHOOT', {
      fontFamily:'monospace',fontSize:'10px',color:'#cbd5e1'
    }).setOrigin(.5,0).setScrollFactor(0).setDepth(20);
  }

  makePlatform(x,y,w,h){
    const p=this.add.rectangle(x,y,w,h,0x586a8f).setStrokeStyle(2,0x9fb2d8);
    this.physics.add.existing(p,true);
    this.platforms.add(p);
    return p;
  }

  createTouchControls(){
    this.touch={left:false,right:false,jump:false,shoot:false};

    const mk=(x,y,r,label,key)=>{
      const c=this.add.circle(x,y,r,0x000000,0.28)
        .setStrokeStyle(2,0xffffff,0.35)
        .setScrollFactor(0)
        .setDepth(30)
        .setInteractive();

      this.add.text(x,y,label,{
        fontFamily:'monospace',fontSize:'14px',color:'#fff'
      }).setOrigin(.5).setScrollFactor(0).setDepth(31);

      const down=()=>{ this.touch[key]=true; c.setAlpha(.72); };
      const up=()=>{ this.touch[key]=false; c.setAlpha(1); };

      c.on('pointerdown',down);
      c.on('pointerup',up);
      c.on('pointerout',up);
      c.on('pointerupoutside',up);
    };

    mk(42,H-40,28,'◀','left');
    mk(106,H-40,28,'▶','right');
    mk(W-104,H-40,31,'J','jump');
    mk(W-38,H-40,31,'S','shoot');
  }

  shoot(time){
    if(time < this.lastShot+210) return;
    this.lastShot=time;

    const x=this.player.x+this.facing*18;
    const y=this.player.y-6;
    const b=this.bullets.get(x,y,'bullet');
    if(!b) return;

    b.enableBody(true,x,y,true,true);
    b.setVelocityX(this.facing*440);
    b.setData('born',time);
    b.setFlipX(this.facing<0);
  }

  hitEnemy(b,e){
    b.disableBody(true,true);
    e.hp--;
    e.setTintFill(0xffffff);
    this.time.delayedCall(70,()=>{ if(e?.active) e.clearTint(); });
    if(e.hp<=0) e.destroy();
  }

  hitPlayer(){
    const now=this.time.now;
    if(now<this.invulnerableUntil) return;

    this.invulnerableUntil=now+900;
    this.playerHP=Math.max(0,this.playerHP-1);
    this.player.setTint(0xff8888);
    this.player.setVelocityY(-220);
    this.player.setVelocityX(-this.facing*150);

    this.time.delayedCall(250,()=>this.player.clearTint());
    this.hud.setText('HP ' + '♥'.repeat(this.playerHP));

    if(this.playerHP<=0) this.scene.restart();
  }

  approach(current, target, amount){
    if(current < target) return Math.min(current + amount, target);
    if(current > target) return Math.max(current - amount, target);
    return target;
  }

  update(time, delta){
    const dt=Math.min(delta, 33)/1000;
    const body=this.player.body;
    const grounded=body.blocked.down || body.touching.down;

    if(grounded) this.lastGroundedAt=time;

    const left=this.cursors.left.isDown || this.keyA.isDown || this.touch.left;
    const right=this.cursors.right.isDown || this.keyD.isDown || this.touch.right;

    let axis=0;
    if(left && !right) axis=-1;
    else if(right && !left) axis=1;

    if(axis!==0){
      this.facing=axis;
      this.player.setFlipX(axis<0);

      const accel=grounded ? this.groundAccel : this.airAccel;
      body.velocity.x=this.approach(body.velocity.x, axis*this.moveSpeed, accel*dt);
    } else {
      const decel=grounded ? this.groundDecel : this.airDecel;
      body.velocity.x=this.approach(body.velocity.x, 0, decel*dt);
    }

    const keyboardJumpHeld=this.cursors.up.isDown || this.keyK.isDown;
    const jumpHeld=keyboardJumpHeld || this.touch.jump;
    const jumpPressed=(jumpHeld && !this.wasJumpHeld);

    if(jumpPressed) this.jumpBufferedUntil=time+this.jumpBufferTime;

    const canCoyoteJump=(time-this.lastGroundedAt)<=this.coyoteTime;
    const hasBufferedJump=time<=this.jumpBufferedUntil;

    if(hasBufferedJump && canCoyoteJump){
      body.setVelocityY(this.jumpVelocity);
      this.jumpBufferedUntil=0;
      this.lastGroundedAt=-9999;
    }

    // Variable jump height: tap = short jump, hold = full jump.
    if(!jumpHeld && this.wasJumpHeld && body.velocity.y < this.jumpCutVelocity){
      body.setVelocityY(this.jumpCutVelocity);
    }

    this.wasJumpHeld=jumpHeld;

    const shootPressed=Phaser.Input.Keyboard.JustDown(this.keyJ) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      this.touch.shoot;

    if(shootPressed) this.shoot(time);

    this.bullets.children.iterate(b=>{
      if(!b?.active) return;
      if(time-(b.getData('born')||0)>1500) b.disableBody(true,true);
    });

    this.enemies.children.iterate(e=>{
      if(!e?.active) return;
      if(e.body.blocked.left) e.setVelocityX(45);
      if(e.body.blocked.right) e.setVelocityX(-45);
    });
  }
}

const config={
  type:Phaser.AUTO,
  parent:'game',
  width:W,
  height:H,
  pixelArt:true,
  backgroundColor:'#111827',
  physics:{
    default:'arcade',
    arcade:{gravity:{y:1050},debug:false}
  },
  scale:{
    mode:Phaser.Scale.FIT,
    autoCenter:Phaser.Scale.CENTER_BOTH
  },
  scene:[GameScene]
};

new Phaser.Game(config);
