export class PuzzleAudio {
  constructor({
    masterVolume=.9,
    musicVolume=.055,
    sfxVolume=.16,
    ambientInterval=2400
  }={}){
    this.masterVolume=masterVolume;
    this.musicVolume=musicVolume;
    this.sfxVolume=sfxVolume;
    this.ambientInterval=ambientInterval;

    this.context=null;
    this.masterGain=null;
    this.musicGain=null;
    this.sfxGain=null;
    this.muted=false;
    this.ambientTimer=null;
    this.ambientStep=0;
    this.destroyed=false;
  }

  createContext(){
    if(this.context||this.destroyed)return this.context;
    const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AudioContextClass)return null;

    const context=new AudioContextClass();
    const master=context.createGain();
    const music=context.createGain();
    const sfx=context.createGain();

    master.gain.value=this.muted?0:this.masterVolume;
    music.gain.value=this.musicVolume;
    sfx.gain.value=this.sfxVolume;

    music.connect(master);
    sfx.connect(master);
    master.connect(context.destination);

    this.context=context;
    this.masterGain=master;
    this.musicGain=music;
    this.sfxGain=sfx;
    return context;
  }

  async unlock(){
    const context=this.createContext();
    if(!context)return false;
    if(context.state==='suspended'){
      try{await context.resume();}catch{return false;}
    }
    if(context.state==='running'&&!this.ambientTimer)this.startAmbient();
    return context.state==='running';
  }

  setMuted(value){
    this.muted=Boolean(value);
    const context=this.context;
    const gain=this.masterGain;
    if(context&&gain){
      const now=context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value,now);
      gain.gain.linearRampToValueAtTime(this.muted?0:this.masterVolume,now+.06);
    }
    return this.muted;
  }

  toggleMuted(){
    return this.setMuted(!this.muted);
  }

  tone({
    frequency=220,
    endFrequency=null,
    duration=.12,
    gain=.08,
    type='sine',
    destination=null,
    when=0,
    attack=.008
  }={}){
    const context=this.context;
    if(!context||context.state!=='running'||this.destroyed)return false;

    const output=destination||this.sfxGain;
    const start=context.currentTime+Math.max(0,when);
    const stop=start+duration;
    const oscillator=context.createOscillator();
    const envelope=context.createGain();

    oscillator.type=type;
    oscillator.frequency.setValueAtTime(frequency,start);
    if(endFrequency&&endFrequency>0){
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency,stop);
    }

    envelope.gain.setValueAtTime(.0001,start);
    envelope.gain.linearRampToValueAtTime(gain,start+Math.min(attack,duration*.35));
    envelope.gain.exponentialRampToValueAtTime(.0001,stop);

    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(start);
    oscillator.stop(stop+.02);
    return true;
  }

  playRotate(){
    return this.tone({
      frequency:205,
      endFrequency:285,
      duration:.075,
      gain:.18,
      type:'triangle',
      attack:.004
    });
  }

  playSuccess(){
    if(!this.context||this.context.state!=='running')return false;
    const notes=[523.25,659.25,783.99,1046.5];
    notes.forEach((frequency,index)=>{
      this.tone({
        frequency,
        duration:.32,
        gain:.15,
        type:'sine',
        when:index*.105,
        attack:.012
      });
    });
    return true;
  }

  startAmbient(){
    const context=this.context;
    if(!context||context.state!=='running'||this.ambientTimer||this.destroyed)return false;

    const playStep=()=>{
      if(!this.context||this.context.state!=='running'||this.destroyed)return;
      const roots=[130.81,146.83,110,123.47];
      const root=roots[this.ambientStep%roots.length];
      this.ambientStep+=1;

      this.tone({
        frequency:root,
        duration:2.7,
        gain:.16,
        type:'sine',
        destination:this.musicGain,
        attack:.55
      });
      this.tone({
        frequency:root*1.5,
        duration:2.25,
        gain:.055,
        type:'sine',
        destination:this.musicGain,
        when:.16,
        attack:.7
      });
    };

    playStep();
    this.ambientTimer=setInterval(playStep,this.ambientInterval);
    return true;
  }

  stopAmbient(){
    if(this.ambientTimer){
      clearInterval(this.ambientTimer);
      this.ambientTimer=null;
    }
  }

  destroy(){
    this.destroyed=true;
    this.stopAmbient();
    if(this.context&&this.context.state!=='closed'){
      this.context.close().catch(()=>{});
    }
    this.context=null;
    this.masterGain=null;
    this.musicGain=null;
    this.sfxGain=null;
  }
}

export function createPuzzleAudio(options){
  return new PuzzleAudio(options);
}
