import assert from 'node:assert/strict';

function between(source,start,end){
 const first=source.indexOf(start),last=source.indexOf(end,first+start.length);
 assert(first>=0&&last>first,'Actual production fixture boundaries: '+start);
 return source.slice(first,last);
}

export function motionObserverSource(source){
 const block=between(source,'let streetMotionObserver=','const speechCatalog=');
 assert(block.startsWith('let streetMotionObserver=null;'),'Actual inactive observer baseline');
 return block;
}

export function policeRemovalSource(source){
 return between(source,'function cancelActorStimulus(','function policeBark(');
}
