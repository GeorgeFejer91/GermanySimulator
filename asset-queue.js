(function(root){
  'use strict';

  function createAssetQueue({concurrency=2,timeoutMs=30000,waitTimeoutMs=120000,isHidden=()=>false}={}){
    if(!Number.isInteger(concurrency)||concurrency<1||![timeoutMs,waitTimeoutMs].every(value=>Number.isFinite(value)&&value>0))throw new RangeError('Invalid asset queue limits');
    const pending=[];
    let active=0;

    function pump(){
      while(active<concurrency&&pending.length){
        const urgent=pending.findIndex(job=>job.foreground);
        const ordinary=pending.findIndex(job=>!job.background);
        const index=urgent>=0?urgent:isHidden()?-1:ordinary>=0?ordinary:0;
        if(index<0)return;
        const job=pending.splice(index,1)[0];
        clearTimeout(job.timer);job.started=true;active++;
        job.timer=setTimeout(()=>job.cancel(new DOMException('Asset execution deadline exceeded','TimeoutError')),timeoutMs);
        Promise.resolve().then(()=>{
          if(job.controller.signal.aborted)throw job.controller.signal.reason;
          return job.task({signal:job.controller.signal});
        }).then(value=>job.finish(true,value),error=>job.finish(false,error));
      }
    }

    function enqueue(task,{foreground=false,background=false,signal}={}){
      if(typeof task!=='function')return Promise.reject(new TypeError('Asset task must be a function'));
      if(signal?.aborted)return Promise.reject(signal.reason);
      return new Promise((resolve,reject)=>{
        const controller=new AbortController();
        const job={task,foreground,background,controller,started:false,finished:false,timer:null};
        const abort=()=>job.cancel(signal.reason);
        job.finish=(succeeded,value)=>{
          if(job.finished)return;
          job.finished=true;clearTimeout(job.timer);signal?.removeEventListener('abort',abort);
          if(job.started)active--;
          else {const index=pending.indexOf(job);if(index>=0)pending.splice(index,1)}
          if(succeeded)resolve(value);else reject(value);
          pump();
        };
        job.cancel=reason=>{
          if(job.finished)return;
          controller.abort(reason);job.finish(false,reason);
        };
        job.timer=setTimeout(()=>job.cancel(new DOMException('Asset admission deadline exceeded','TimeoutError')),waitTimeoutMs);
        signal?.addEventListener('abort',abort,{once:true});
        pending.push(job);pump();
      });
    }

    return {enqueue,pump,inspect:()=>({active,pending:pending.length})};
  }

  const api={createAssetQueue};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.GermanyAssetQueue=api;
})(globalThis);
