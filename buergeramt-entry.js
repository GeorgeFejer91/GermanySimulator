import {createLevelVortex,entryVortexFrame} from './level-transition-effects.js?v=20261014-building-levels';
export {entryVortexFrame};

export function createBuergeramtEntry(config){
  const effect=createLevelVortex(config);let elapsed=0,reduced=!!config.reducedMotion,frame=entryVortexFrame(0,reduced);
  return {
    render(dt,reduce=reduced){
      if(reduce&&!reduced){elapsed=frame.progress*.24;reduced=true;}
      elapsed+=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));frame=entryVortexFrame(elapsed,reduced);
      effect.render(frame.progress,reduced);return frame.done;
    },
    inspect(){return {...frame,elapsed,...effect.inspect()}},
    dispose:()=>effect.dispose()
  };
}
