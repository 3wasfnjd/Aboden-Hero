import {HERO_FIRE_FRAMES,heroFirePose,FIRE_POSE_END} from './hero-weapon.js?v=20260917-muzzle-1';
// Original comic-action art: ink contours, steel-blue shadows and copper light.
// The final Aboden hero is rendered from assets/aboden-hero-spritesheet.png.
const INK='#0a121e';
const HERO_SHEET_URL='./assets/aboden-hero-spritesheet.png';
const HERO_BASE_W=1254;
const HERO_BASE_H=1254;
const HERO_FRAMES={
 idle:[[184,8,110,198],[348,8,111,198],[515,8,112,198],[681,8,111,198]],
 aim:[[173,221,127,178],[354,222,165,177],[539,222,180,178]],
 charge:[[178,416,130,169],[353,418,166,165],[534,405,192,179]],
 fire:HERO_FIRE_FRAMES,
 hit:[[164,780,184,167],[376,797,138,149]],
 enraged:[[191,961,145,165],[383,961,164,165],[565,952,178,175]],
 death:[[152,1130,127,118],[273,1140,134,108],[412,1158,155,86],[583,1180,138,66],[739,1185,156,53],[904,1193,158,46],[1070,1192,163,46]]
};

const heroSheet=new Image();
let heroAtlas=null;
heroSheet.decoding='async';
heroSheet.src=HERO_SHEET_URL;
heroSheet.addEventListener('load',()=>{
 try{
  const off=document.createElement('canvas');
  off.width=heroSheet.naturalWidth;off.height=heroSheet.naturalHeight;
  const ox=off.getContext('2d',{willReadFrequently:true});
  ox.drawImage(heroSheet,0,0);
  const data=ox.getImageData(0,0,off.width,off.height);
  const px=data.data;
  for(let i=0;i<px.length;i+=4){
   const r=px[i],g=px[i+1],b=px[i+2],min=Math.min(r,g,b),max=Math.max(r,g,b);
   if(min>242&&max-min<18){px[i+3]=0;continue;}
   if(min>218&&max-min<20){px[i+3]=Math.min(px[i+3],Math.max(0,(242-min)*11));}
  }
  ox.putImageData(data,0,0);heroAtlas=off;
 }catch{heroAtlas=heroSheet;}
});

export function createArt(ctx){
 const c=ctx;
 const path=(d,fill,stroke=INK,lw=2)=>{const p=new Path2D(d);c.fillStyle=fill;c.fill(p);if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.lineJoin='round';c.lineCap='round';c.stroke(p);}};
 const ellipse=(x,y,rx,ry,fill,stroke=INK,lw=2)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}};
 const line=(x,y,x2,y2,col=INK,w=2)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.stroke();};
 const round=(x,y,w,h,r,fill,stroke=INK,lw=2)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}};
 const star=(x,y,r,fill='#eac66e',rot=0)=>{c.save();c.translate(x,y);c.rotate(rot);c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.46:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle='#765937';c.lineWidth=1.7;c.stroke();c.restore();};
 function drawHeroFrame(frame,p,displayH,bob=0,lean=0){const sx=heroAtlas.width/HERO_BASE_W,sy=heroAtlas.height/HERO_BASE_H;const [fx,fy,fw,fh]=frame;const sw=fw*sx,sh=fh*sy;const dw=displayH*(fw/fh),dh=displayH;c.save();c.translate(p.x+p.w/2,p.y+p.h+bob);c.scale(p.facing,1);if(lean)c.transform(1,0,lean,1,0,0);c.drawImage(heroAtlas,fx*sx,fy*sy,sw,sh,-dw/2,-dh,dw,dh);c.restore();}
 function heroMuzzle(p){return heroAtlas?heroFirePose(p).muzzle:{x:p.x+p.w/2,y:p.y+p.h/2};}
 function hero(p,time){if(!heroAtlas)return;if(p.shot>FIRE_POSE_END){const pose=heroFirePose(p);drawHeroFrame(pose.frame,p,pose.height);return;}ellipse(p.x+p.w/2,p.y+p.h+2,22,4,'#07122055',null);let frames=HERO_FRAMES.idle,rate=3.2,displayH=82,bob=0,lean=0;const justHit=p.invulnerable>1.05;if(justHit){frames=HERO_FRAMES.hit;rate=10;displayH=78;}else if(p.dashTime>0){frames=HERO_FRAMES.charge;rate=14;displayH=80;lean=-.10;}else if(p.shot>.02){frames=HERO_FRAMES.fire;rate=18;displayH=82;}else if(!p.grounded){frames=[HERO_FRAMES.charge[0]];rate=1;displayH=78;lean=p.vy<0?-.08:.05;bob=-2;}else if(Math.abs(p.vx)>28){frames=[HERO_FRAMES.aim[0],HERO_FRAMES.aim[1],HERO_FRAMES.aim[0],HERO_FRAMES.idle[1]];rate=9.5;displayH=80;lean=-.08;bob=Math.sin(time*19)*1.2;}const index=Math.floor(time*rate)%frames.length;drawHeroFrame(frames[index],p,displayH,bob,lean);}
 function sign(x,text){line(x,440,x,393,'#4a5e70',4);round(x-72,370,145,32,3,'#1b3045','#6b7d89',1);c.fillStyle='#d7c4a1';c.font='bold 12px Tahoma';c.textAlign='center';c.fillText(text,x,391);}
 function flower(x,y){line(x,y,x+12,y-4,'#778082',1);}
 return {hero,heroMuzzle,flower,star,ellipse,round,path,line,sign};
}

