// Original, code-drawn scenery: ink contours, muted paint, paper grain.
// Replace drawHero() with a spritesheet renderer when final character art is ready.
const INK='#403c2c';
export function createArt(ctx){
 const c=ctx;
 const path=(d,fill,stroke=INK,lw=2)=>{const p=new Path2D(d);c.fillStyle=fill;c.fill(p);if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.lineJoin='round';c.lineCap='round';c.stroke(p);}};
 const ellipse=(x,y,rx,ry,fill,stroke=INK,lw=2)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}};
 const line=(x,y,x2,y2,col=INK,w=2)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.stroke();};
 const round=(x,y,w,h,r,fill,stroke=INK,lw=2)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}};
 const star=(x,y,r,fill='#eac66e',rot=0)=>{c.save();c.translate(x,y);c.rotate(rot);c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.46:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle='#765937';c.lineWidth=1.7;c.stroke();c.restore();};
 const cloud=(x,y,s=1)=>{c.save();c.translate(x,y);c.scale(s,s);path('M-70 20 Q-100 15 -88 -3 Q-81 -18 -57 -10 Q-57 -44 -24 -45 Q2 -65 19 -30 Q50 -39 55 -10 Q88 -11 87 10 Q88 26 59 25 Z','#f2e7c7','#7c9384',1.5);path('M-82 15 Q-50 22 -35 10 Q-14 24 6 12 Q36 29 73 13 L65 25 L-68 22 Z','#d6d9bd',null);c.restore();};
 function tree(x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);path('M-25 0 Q-10 -90 -30 -180 L-15 -215 L10 -210 Q-2 -110 28 0Z','#99734f');path('M-5 -25 Q-18 -112 -12 -171 M-15 -104 Q-53 -121 -60 -157 M7 -137 Q48 -158 51 -183','#99734f',INK,6);path('M-18 -173 Q-108 -157 -102 -217 Q-125 -259 -71 -271 Q-67 -310 -20 -291 Q18 -325 52 -286 Q104 -288 101 -240 Q132 -196 70 -176 Q25 -156 -18 -173Z','#708057');path('M-94 -230 Q-85 -275 -46 -251 Q-35 -289 6 -269 Q28 -293 65 -265 Q31 -250 35 -216 Q-13 -236 -24 -199 Q-55 -226 -94 -209Z','#909658',null);path('M-77 -189 Q-32 -169 -17 -207 M15 -180 Q54 -180 57 -208 M-45 -255 Q-20 -262 -11 -239','transparent','#566c4c',3);c.restore();}
 function house(x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);path('M-78 0 L-68 -112 Q-5 -164 63 -106 L76 0Z','#d7ba7e');path('M-94 -105 Q-62 -183 18 -173 Q72 -164 95 -113 Q39 -85 -4 -108 Q-53 -87 -94 -105Z','#b7674c',INK,3);path('M-77 -115 Q-45 -163 3 -158 Q45 -158 75 -119 Q28 -138 -4 -121 Q-37 -128 -77 -115Z','#d58a60',null);ellipse(-37,-128,12,8,'#e3b57a',null);ellipse(34,-142,13,8,'#e3b57a',null);path('M-18 0 L-19 -50 Q2 -84 24 -49 L26 0Z','#665b42');line(4,-60,4,-3,'#9c865b',3);ellipse(17,-27,3,3,'#e5bd69');round(-55,-75,23,28,8,'#678276');line(-44,-72,-44,-49,'#d9ba79');line(-53,-61,-34,-61,'#d9ba79');path('M48 -165 Q62 -184 54 -196 L71 -198 L82 -154Z','#947952');c.restore();}
 function flower(x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);line(0,0,0,-20,'#667b4f',2);ellipse(-5,-9,5,2,'#8b985e',null);for(let j=0;j<5;j++){const a=j*Math.PI*.4;ellipse(Math.cos(a)*5,-23+Math.sin(a)*5,3,4,'#ddb787',null);}ellipse(0,-23,3,3,'#987346',null);c.restore();}
 function background(camera,time){
  const sky=c.createLinearGradient(0,0,0,500);sky.addColorStop(0,'#8facad');sky.addColorStop(.72,'#d5d5b5');sky.addColorStop(1,'#e4d0a3');c.fillStyle=sky;c.fillRect(0,0,960,540);
  ellipse(735-camera*.035,106,52,52,'#ede1af','#d2cb9f',2);ellipse(735-camera*.035,106,43,43,'#f3e6b7',null);
  for(let i=-1;i<8;i++)cloud(i*270-((camera*.12+time*2)%270),95+(i%3)*41,.62+(i%2)*.22);
  c.save();c.translate(-camera*.22,0);
  for(let i=-1;i<9;i++){const x=i*500;path(`M${x-80} 422 Q${x+90} 110 ${x+230} 285 Q${x+360} 125 ${x+570} 424Z`,i%2?'#92a38c':'#a0ad93','#859b86',2);path(`M${x+74} 335 Q${x+123} 221 ${x+177} 264 Q${x+125} 273 ${x+112} 349Z`,'#bec3a2',null);}
  c.restore();
  c.save();c.translate(-camera*.45,0);
  for(let i=-1;i<10;i++){const x=i*480;path(`M${x-80} 450 Q${x+50} 305 ${x+210} 375 Q${x+355} 272 ${x+550} 450Z`,'#8a9b70','#687f60',2);house(x+230,404,.52);tree(x+50,418,.6);}
  c.restore();
  // Winding stream behind the playable ground.
  path('M0 446 Q220 382 430 423 Q650 473 960 398 L960 540 L0 540Z','#739d97','#5a7b70',2);
  for(let i=0;i<15;i++){const x=(i*93+time*9)%1030-40;line(x,462+(i%4)*14,x+35,460+(i%4)*14,'#c5d0ac',1);}
 }
 function scenery(camera){c.save();c.translate(-camera,0);
  for(let i=0;i<14;i++){const x=i*470+210;if(x<camera-220||x>camera+1180)continue;tree(x+110,442,.8+(i%3)*.12);if(i%2===0)house(x+15,442,.8);}
  // Decorative fence stays behind the walkable surface.
  for(let x=Math.floor(camera/100)*100-100;x<camera+1050;x+=100){round(x,410,10,31,3,'#a38a5c');line(x-35,422,x+65,415,'#746549',5);}
 c.restore();}
 function platform(s){c.save();c.translate(s.x,s.y);
  if(s.ground){round(0,0,s.w,s.h,8,'#ae9062',INK,3);c.fillStyle='#c4a777';c.fillRect(5,20,s.w-10,16);for(let x=20;x<s.w;x+=43){line(x,58+(x%3)*8,x+12,63+(x%3)*8,'#8c7753',2);ellipse(x+16,95,3,2,'#d5b586',null);}path(`M0 7 Q6 -5 17 0 L${s.w-14} 0 Q${s.w} -4 ${s.w} 12 L${s.w-2} 21 Q${s.w-18} 28 ${s.w-28} 17 L22 18 Q9 29 0 17Z`,'#849354',INK,2);for(let x=20;x<s.w-10;x+=30){line(x,4,x+5,-3,'#acb478',2);}}
  else{round(0,0,s.w,20,8,'#b28e57',INK,3);round(4,-5,s.w-8,11,5,'#98a267',INK,2);for(let x=16;x<s.w-10;x+=35)line(x,12,x+20,12,'#775e3f',1);path(`M12 21 L25 39 L40 21 M${s.w-40} 21 L${s.w-25} 39 L${s.w-12} 21`,'#907448',INK,2);}
 c.restore();}
 function hero(p,time){c.save();c.translate(p.x+p.w/2,p.y+p.h);c.scale(p.facing,1);
  const moving=p.grounded&&Math.abs(p.vx)>20,walk=moving?Math.sin(time*19):0,bob=moving?Math.abs(walk)*2:Math.sin(time*3)*.6;
  c.translate(0,-bob);ellipse(0,1,19,4,'#28392f35',null);
  // Springy boots and gloved arms; an original explorer placeholder, not a licensed character.
  line(-6,-13,-7-walk*5,-3,INK,5);line(5,-13,6+walk*5,-3,INK,5);
  ellipse(-9-walk*5,-2,9,4,'#d6ac68');ellipse(8+walk*5,-2,9,4,'#d6ac68');
  ellipse(0,-20,12,15,'#69887d');path('M-11 -28 Q0 -34 10 -26 L8 -18 L-9 -19Z','#c47852');
  line(-9,-24,-15,-18+walk*3,INK,5);ellipse(-16,-17+walk*3,5,5,'#ece4bf');
  line(9,-25,19,-23,INK,5);ellipse(20,-24,5,5,'#ece4bf');round(20,-29,13,7,2,'#a99158');ellipse(34,-26,3,5,'#dbb671');
  ellipse(0,-40,14,13,'#e1ca91');ellipse(-10,-39,5,6,'#c1a06e');ellipse(5,-42,5,7,'#f5ecd2');ellipse(7,-42,2,4,INK,null);ellipse(14,-37,5,4,'#9b7350');path('M2 -32 Q8 -29 11 -32','transparent',INK,1.4);
  path('M-16 -47 Q-14 -65 5 -60 Q15 -58 16 -47Z','#b76c49');ellipse(2,-47,20,4,'#c99058');round(-7,-59,12,7,3,'#77998f');line(-6,-57,1,-58,'#b3c4a6',2);
 c.restore();}
 function enemy(e,time){c.save();c.translate(e.x+17,e.y+32);const bob=Math.sin(time*10+e.x)*1.3;c.translate(0,bob);ellipse(0,1,20,4,'#28392f30',null);ellipse(-9,-3,8,4,'#655740');ellipse(9,-3,8,4,'#655740');ellipse(0,-18,18,16,e.hit>0?'#f8e6b5':'#af684e');path('M-22 -23 Q-18 -45 0 -40 Q18 -43 22 -22 Q0 -13 -22 -23Z','#c89453');ellipse(-9,-29,5,3,'#e6c98d',null);ellipse(9,-30,4,3,'#e6c98d',null);ellipse(-6,-19,5,6,'#ede0b9');ellipse(6,-19,5,6,'#ede0b9');ellipse(-5,-18,2,3,INK,null);ellipse(5,-18,2,3,INK,null);line(-10,-26,-2,-23,INK,2);line(10,-26,2,-23,INK,2);c.restore();}
 function checkpoint(cp,time){line(cp.x,440,cp.x,349,'#654f37',5);ellipse(cp.x,345,5,5,'#d7b369');const wave=Math.sin(time*4)*4;path(`M${cp.x+2} 351 Q${cp.x+23} ${343+wave} ${cp.x+48} 355 L${cp.x+40} 369 L${cp.x+49} 380 Q${cp.x+20} ${369+wave} ${cp.x+2} 383Z`,cp.active?'#8aaa70':'#c08156',INK,2);star(cp.x+22,364,7,'#f3dfaa');}
 function goal(g,time){c.save();c.translate(g.x,g.y);round(-8,0,106,129,38,'#b39562',INK,3);round(7,16,76,115,32,'#455e4b',INK,3);round(15,27,60,104,25,'#748d61',null);line(44,29,44,123,'#324a3e',3);ellipse(34,86,4,4,'#e9c46c');ellipse(55,86,4,4,'#e9c46c');round(-23,-22,136,31,8,'#a57748',INK,3);c.fillStyle='#f2dfac';c.font='bold 15px Tahoma';c.textAlign='center';c.fillText('بوابة الوادي',45,-1);star(45,-47,15,'#edcd78',Math.sin(time)*.12);c.restore();}
 function sign(x,text){line(x,440,x,390,'#76603f',6);round(x-72,369,145,35,7,'#d5b783',INK,2);c.fillStyle='#584831';c.font='bold 12px Tahoma';c.textAlign='center';c.fillText(text,x,391);}
 return {background,scenery,platform,hero,enemy,checkpoint,goal,flower,star,ellipse,round,path,line,sign};
}
