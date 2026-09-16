// Original comic-action art: ink contours, steel-blue shadows and copper light.
// Replace hero() with a spritesheet renderer when final character art is ready.
const INK='#0a121e';
export function createArt(ctx){
 const c=ctx;
 const path=(d,fill,stroke=INK,lw=2)=>{const p=new Path2D(d);c.fillStyle=fill;c.fill(p);if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.lineJoin='round';c.lineCap='round';c.stroke(p);}};
 const ellipse=(x,y,rx,ry,fill,stroke=INK,lw=2)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}};
 const line=(x,y,x2,y2,col=INK,w=2)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.stroke();};
 const round=(x,y,w,h,r,fill,stroke=INK,lw=2)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}};
 const star=(x,y,r,fill='#eac66e',rot=0)=>{c.save();c.translate(x,y);c.rotate(rot);c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.46:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle='#765937';c.lineWidth=1.7;c.stroke();c.restore();};
 function building(x,y,w,h,col,lit=true){
  round(x,y-h,w,h,1,col,'#142335',2);
  path(`M${x} ${y-h} L${x+w-8} ${y-h-9} L${x+w+5} ${y-h-4} L${x+w} ${y-h}Z`,'#354657','#142335',2);
  for(let row=0;row<h/35-1;row++)for(let column=0;column<w/25-1;column++){
   const on=lit&&(row*7+column*3+Math.round(x))%5<2;
   c.fillStyle=on?'#cf9962':'#172738';c.fillRect(x+12+column*25,y-h+20+row*35,9,15);
   if(on){c.fillStyle='#f3bd7b';c.fillRect(x+12+column*25,y-h+20+row*35,3,15);}
  }
  line(x+5,y-h+6,x+5,y,'#4b5963',1);
 }
 function background(camera,time){
  const sky=c.createLinearGradient(0,0,0,540);sky.addColorStop(0,'#131e30');sky.addColorStop(.65,'#455a70');sky.addColorStop(1,'#ae785b');c.fillStyle=sky;c.fillRect(0,0,960,540);
  ellipse(715-camera*.025,100,47,47,'#ddc7a0',null);ellipse(703-camera*.025,87,10,8,'#caba9c',null);
  for(let i=0;i<25;i++){c.fillStyle='#abb7bc66';c.fillRect((i*163+17)%960,28+(i*67)%170,1.5,1.5);}
  for(let layer=0;layer<2;layer++){
   const factor=layer?.3:.14,offset=camera*factor;
   for(let i=Math.floor(offset/130)-1;i<Math.ceil((offset+960)/130)+1;i++){
    const x=i*130-offset,w=90+(i*17%40),h=110+Math.abs(Math.sin(i*3.3+layer))*160;
    building(x,layer?410:350,w,h,layer?'#24374a':'#32475b',layer===1);
    if(i%3===0){line(x+w/2,350-h,x+w/2,310-h,'#1c3044',2);line(x+w/2-16,320-h,x+w/2+16,320-h,'#1c3044',2);}
   }
  }
  // Distant elevated railway and drifting haze.
  line(0,387,960,387,'#1a2c3d',12);for(let x=0;x<960;x+=130)line(x,387,x+30,470,'#1a2c3d',8);
  c.fillStyle='#8593a310';for(let i=0;i<4;i++)c.fillRect(((i*300+time*6)%1250)-250,340+i*25,370,12);
 }
 function scenery(camera){c.save();c.translate(-camera,0);
  for(let i=Math.floor(camera/550)-1;i<Math.ceil((camera+960)/550)+1;i++){
   const x=i*550+200;
   // Industrial silhouettes, wall pipes and old neon.
   building(x,440,140,175,'#34414d');round(x+12,367,92,73,2,'#1d2a3b');for(let j=0;j<7;j++)line(x+15,372+j*9,x+100,372+j*9,'#42505b',2);
   round(x+15,285,113,30,1,i%2?'#723e38':'#234951');c.fillStyle=i%2?'#efa780':'#8abbc2';c.font='bold 12px monospace';c.textAlign='center';c.fillText(i%2?'SECTOR 07':'ABODEN',x+72,305);
   line(x+152,437,x+152,325,'#182333',7);line(x+152,325,x+198,325,'#182333',7);ellipse(x+198,328,9,4,'#e4bc87',null);
   path(`M${x+191} 334 L${x+159} 440 L${x+235} 440 L${x+204} 334Z`,'#e7b4770d',null);
   line(x-60,365,x+205,346,'#101b2a',2);
   round(x-68,406,42,34,3,'#59626a');line(x-65,421,x-28,421,'#28323e',3);
  }
 c.restore();}
 function platform(s){c.save();c.translate(s.x,s.y);
  if(s.ground){round(0,0,s.w,s.h,2,'#253344',INK,3);c.fillStyle='#59606a';c.fillRect(0,0,s.w,10);c.fillStyle='#919089';c.fillRect(0,0,s.w,3);for(let x=0;x<s.w;x+=82){line(x,15,x,52,'#0f1d2d',2);line(x+42,55,x+42,93,'#0f1d2d',2);line(x,55,x+80,55,'#0f1d2d',2);line(x+7,96,x+72,96,'#53606a',1);}for(let x=8;x<s.w;x+=130){path(`M${x} 13 l20 0 l-9 9 l-20 0Z`,'#b09559',null);}}
  else{round(0,0,s.w,20,2,'#435162',INK,3);c.fillStyle='#a4a392';c.fillRect(0,0,s.w,3);for(let x=15;x<s.w-5;x+=35){line(x,9,x+20,9,'#71808b',2);ellipse(x,16,2,2,'#101b29',null);}path(`M12 20 L25 36 L40 20 M${s.w-40} 20 L${s.w-25} 36 L${s.w-12} 20`,'#243548',INK,2);}
 c.restore();}
 function hero(p,time){c.save();c.translate(p.x+p.w/2,p.y+p.h);c.scale(p.facing,1);
  const moving=p.grounded&&Math.abs(p.vx)>20,walk=moving?Math.sin(time*21):0;
  const bob=moving?Math.abs(walk)*1.5:Math.sin(time*3)*.5;
  ellipse(0,1,19,4,'#07122055',null);c.translate(0,-bob);if(p.dashTime>0){c.transform(1,0,-.2,1,0,0);}
  // Dark cargo trousers and heavy boots, matching the poster's silhouette.
  line(-6,-22,-7-walk*6,-5,'#0a1320',10);line(6,-22,7+walk*6,-5,'#0a1320',10);
  line(-6,-21,-7-walk*6,-6,'#344257',6);line(6,-21,7+walk*6,-6,'#26354b',6);
  round(-15-walk*6,-7,15,8,2,'#111b2b');round(2+walk*6,-7,16,8,2,'#111b2b');line(-14-walk*6,-1,-2-walk*6,-1,'#bb6e46',2);line(3+walk*6,-1,16+walk*6,-1,'#9f583c',2);
  path('M-12 -43 Q-2 -49 12 -42 L11 -23 L-12 -23Z','#9c3533',INK,2);path('M-5 -43 L5 -43 L8 -24 L-5 -24Z','#182130');path('M-10 -43 L-4 -46 L-2 -36Z','#d86443');line(-10,-37,-10,-27,'#d06545',2);round(-12,-25,24,4,1,'#292b31');round(-1,-26,6,5,1,'#958a79');
  line(-10,-39,-16,-28+walk*2,INK,8);line(-10,-39,-16,-28+walk*2,'#9b3633',6);ellipse(-16,-25+walk*2,5,5,'#17202c');
  line(10,-39,20,-34,INK,8);line(10,-39,20,-34,'#a34237',6);line(20,-34,27,-35,'#bc784e',5);ellipse(27,-35,4,5,'#152030');round(27,-40,18,7,1,'#5a6672');round(29,-34,5,8,1,'#252f3b');line(31,-41,41,-41,'#a1a59c',1);
  // Bald crown, short dark beard and warm copper face lighting.
  ellipse(1,-53,11,13,'#c98556');path('M-9 -54 Q-5 -42 8 -43 Q16 -50 11 -54 L9 -47 L1 -44 L-5 -47Z','#342b2b',INK,1.5);path('M-8 -59 Q-4 -68 6 -64 L9 -61 Q1 -64 -8 -59Z','#e8a367',null);ellipse(-8,-52,3,4,'#b97750');ellipse(6,-55,3.5,2,'#e9d0a3',null);ellipse(7,-55,1.5,2,INK,null);line(3,-59,10,-58,'#362726',2);path('M10 -55 L15 -50 L9 -49Z','#d9935d',INK,1);line(3,-46,9,-47,'#bd9e7b',1);line(-7,-62,-2,-66,'#31262a',1);
 c.restore();}
 function enemy(e,time){c.save();c.translate(e.x+17,e.y+32);c.scale((e.windup>0?e.aimX<e.x:e.vx<0)?-1:1,1);const walk=Math.sin(time*12+e.x)*2;
  ellipse(0,1,20,4,'#07122055',null);line(-7,-12,-8-walk,-3,'#121d2b',7);line(7,-12,8+walk,-3,'#121d2b',7);round(-12-walk,-5,12,6,1,'#192333');round(3+walk,-5,12,6,1,'#192333');round(-13,-30,26,22,4,e.hit>0?'#e5bb90':'#4c606b');line(-9,-21,9,-21,'#21323f',4);ellipse(0,-35,12,10,'#1b2b3b');round(-10,-38,20,6,2,e.windup>0?'#f2ab55':'#b95743');line(12,-25,24,-22,'#293843',6);round(21,-26,14,7,1,'#607785');if(e.windup>0)ellipse(36,-23,4,4,'#efbc71',null);
 c.restore();}
 function boss(b,time){if(b.hp<=0)return;c.save();c.translate(b.x+b.w/2,b.y+b.h);ellipse(0,3,48,7,'#08122088',null);line(-22,-27,-24,-6,INK,19);line(22,-27,25,-6,INK,19);round(-37,-10,26,13,3,'#3b4d62');round(11,-10,27,13,3,'#3b4d62');round(-34,-68,68,45,9,b.hit>0?'#d5b18a':'#394e62',INK,4);path('M-25 -61 L0 -49 L25 -61 L17 -34 L-18 -34Z','#8c3b35',INK,3);ellipse(0,-48,8,8,b.windup>0?'#ffc46c':'#d5684e',INK,2);round(-21,-87,42,24,7,'#536373',INK,3);round(-17,-80,34,8,2,b.windup>0?'#f4bf76':'#bd6755');line(-31,-56,-49,-33,'#263b50',19);round(-65,-48,30,21,4,'#516477',INK,3);ellipse(-67,-37,5,10,b.windup>0?'#e5a358':'#142333');line(32,-54,44,-35,'#263b50',16);round(32,-39,24,15,3,'#4e6576');c.restore();}
 function checkpoint(cp){round(cp.x-15,376,30,64,3,'#263c4d');round(cp.x-11,383,22,20,2,cp.active?'#78c5c0':'#c19464');line(cp.x-7,413,cp.x+7,413,'#9bacaa',2);line(cp.x-7,420,cp.x+3,420,'#9bacaa',2);}
 function goal(g,time,locked=false){c.save();c.translate(g.x,g.y);round(-10,-10,110,139,3,'#314657',INK,4);round(0,0,90,129,2,'#122336');for(let x=9;x<90;x+=17)line(x,2,x,126,locked?'#aa6250':'#568281',3);round(-15,-29,120,26,2,'#203040');c.fillStyle=locked?'#e69772':'#91c9c2';c.font='bold 12px Tahoma';c.textAlign='center';c.fillText(locked?'اهزم حارس البوابة':'نقطة الإخلاء',45,-11);c.restore();}
 function sign(x,text){line(x,440,x,393,'#4a5e70',4);round(x-72,370,145,32,3,'#1b3045','#6b7d89',1);c.fillStyle='#d7c4a1';c.font='bold 12px Tahoma';c.textAlign='center';c.fillText(text,x,391);}
 function flower(x,y){line(x,y,x+12,y-4,'#778082',1);}
 return {background,scenery,platform,hero,enemy,boss,checkpoint,goal,flower,star,ellipse,round,path,line,sign};
}
