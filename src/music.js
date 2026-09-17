// Procedural background score: a tense, driving synth loop (A minor) built
// entirely from oscillators/noise so no audio asset needs to ship with the
// game. Uses a standard Web Audio lookahead scheduler for tight timing
// instead of relying on setTimeout to fire notes directly.
const BPM=128;
const STEP=60/BPM/4;
const BARS=2;
const STEPS=16*BARS;

// A minor: root-heavy driving bassline with a couple of passing tones.
const BASS=[55,0,55,0,55,0,65.41,0,55,0,55,0,49,0,55,0,
            55,0,55,0,58.27,0,55,0,49,0,49,0,55,0,65.41,0];
const KICK_STEPS=new Set([0,4,8,12,16,20,24,28]);
const HAT_STEPS=[1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31];
// Sparse echoing arpeggio, only a few notes per 2-bar phrase for tension.
const LEAD=new Map([[2,220],[6,164.81],[14,261.63],[18,220],[22,196],[30,164.81]]);

export function createMusic(audioContext){
 const master=audioContext.createGain();
 master.gain.value=.0001;
 const filter=audioContext.createBiquadFilter();
 filter.type='lowpass';filter.frequency.value=2200;
 filter.connect(master);master.connect(audioContext.destination);

 function bass(time,freq){
  const o=audioContext.createOscillator(),g=audioContext.createGain();
  o.type='sawtooth';o.frequency.setValueAtTime(freq,time);
  g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(.3,time+.015);g.gain.exponentialRampToValueAtTime(.0001,time+STEP*1.8);
  o.connect(g);g.connect(filter);o.start(time);o.stop(time+STEP*2);
 }
 function lead(time,freq){
  const o=audioContext.createOscillator(),g=audioContext.createGain();
  o.type='triangle';o.frequency.setValueAtTime(freq,time);
  g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(.14,time+.02);g.gain.exponentialRampToValueAtTime(.0001,time+STEP*4);
  o.connect(g);g.connect(filter);o.start(time);o.stop(time+STEP*4.2);
 }
 function kick(time){
  const o=audioContext.createOscillator(),g=audioContext.createGain();
  o.type='sine';o.frequency.setValueAtTime(130,time);o.frequency.exponentialRampToValueAtTime(38,time+.11);
  g.gain.setValueAtTime(.55,time);g.gain.exponentialRampToValueAtTime(.001,time+.16);
  o.connect(g);g.connect(master);o.start(time);o.stop(time+.17);
 }
 function hat(time){
  const buf=audioContext.createBuffer(1,audioContext.sampleRate*.03,audioContext.sampleRate);
  const data=buf.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  const src=audioContext.createBufferSource();src.buffer=buf;
  const hp=audioContext.createBiquadFilter();hp.type='highpass';hp.frequency.value=7500;
  const g=audioContext.createGain();g.gain.setValueAtTime(.09,time);g.gain.exponentialRampToValueAtTime(.001,time+.03);
  src.connect(hp);hp.connect(g);g.connect(master);src.start(time);
 }

 let stepIndex=0,nextStepTime=0,timerId=null,running=false;
 function scheduleStep(time,i){
  const note=BASS[i];if(note)bass(time,note);
  if(KICK_STEPS.has(i))kick(time);
  if(HAT_STEPS.includes(i))hat(time);
  const leadNote=LEAD.get(i);if(leadNote)lead(time,leadNote);
 }
 function scheduler(){
  while(nextStepTime<audioContext.currentTime+.15){
   scheduleStep(nextStepTime,stepIndex%STEPS);
   stepIndex++;nextStepTime+=STEP;
  }
  timerId=setTimeout(scheduler,50);
 }
 return {
  start(){
   if(running)return;running=true;stepIndex=0;nextStepTime=audioContext.currentTime+.05;
   scheduler();
  },
  setMuted(muted){
   const now=audioContext.currentTime;
   master.gain.cancelScheduledValues(now);
   master.gain.setValueAtTime(master.gain.value,now);
   master.gain.linearRampToValueAtTime(muted?.0001:.5,now+.6);
  }
 };
}
