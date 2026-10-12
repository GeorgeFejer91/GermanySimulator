const centers={down:0,right:Math.PI/2,up:Math.PI,left:-Math.PI/2};

// Retain a view through small angle noise without delaying a real reversal.
export function amtWalkDirection(relative,previous){
  if(previous in centers){
    const delta=Math.atan2(Math.sin(relative-centers[previous]),Math.cos(relative-centers[previous]));
    if(Math.abs(delta)<=Math.PI/4+.10)return previous;
  }
  return Math.abs(relative)<Math.PI/4?'down':Math.abs(relative)>3*Math.PI/4?'up':relative>0?'right':'left';
}

// One spare sheet for the entire office, requested only by a real view change.
// Repeated A/B turns swap it with the actor's current sheet without decoding again.
export function createAmtWalkSpare(){
  let spare=null;
  return{
    exchange(owner,direction,current,currentDirection,load){
      const reused=spare?.owner===owner&&spare.direction===direction?spare.texture:null;
      if(spare&&!reused)spare.texture.dispose();
      spare=current?{owner,direction:currentDirection,texture:current}:null;
      return reused??load();
    },
    release(owner){if(spare&&(!owner||spare.owner===owner)){spare.texture.dispose();spare=null}},
    inspect(){return spare?{owner:spare.owner,direction:spare.direction,width:spare.texture.image?.width??0,height:spare.texture.image?.height??0}:null},
  };
}
