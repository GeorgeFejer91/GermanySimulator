// Synthetic accounting only; these rows are not recordings or native receipts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyCrowd27RecoveryAccounting} from '../tools/curate-voice-library.mjs';
function fixture(){
 const prior=Array.from({length:21},(_,i)=>`synthetic-prior-${i}`),selected=Array.from({length:5},(_,i)=>`synthetic-new-${i}`),held=['crowd-manfred-mittagsruhe-germany-02'];
 const ids=[...prior,...selected,...held];
 const authority={completedPriorClipIds:prior,selectedClipIds:selected,heldInterruptedClipIds:held,allRenderedClipIds:ids};
 const rows=ids.map(clipId=>held.includes(clipId)?{clipId,processingOrigin:'original-process-interrupted-held-unknown',asrReadings:null,asrReadingsBounds:{minimum:0,maximum:2},technicalEligible:false}:{clipId,processingOrigin:prior.includes(clipId)?'saved-before-original-process-interruption':'new-recovery5-process',asrReadings:1,asrBeams:[1]});
 return {authority,summary:{originalProcessSuccessful:false,previousCompletedCount:21,newRecoveryCompletedCount:5,heldInterruptedCount:1,selectedClipCount:27,newNativeCalls:0,newAsrReadings:5,knownCompletedAsrReadings:26,unknownInterruptedAsrReadings:{minimum:0,maximum:2},overallAsrReadingsUpperBound:28,overallExactAsrCountKnown:false,rows}};
}
test('saved, new and interrupted partitions keep unknown historical reads bounded',()=>{
 const {authority,summary}=fixture();assert.equal(verifyCrowd27RecoveryAccounting(authority,summary),true);
});
test('recovery cannot invent original success, generation or an exact interrupted count',()=>{
 for(const [key,value] of [['originalProcessSuccessful',true],['newNativeCalls',1],['overallExactAsrCountKnown',true],['newAsrReadings',11],['overallAsrReadingsUpperBound',55]]){
  const {authority,summary}=fixture();summary[key]=value;assert.throws(()=>verifyCrowd27RecoveryAccounting(authority,summary));
 }
 const {authority,summary}=fixture();summary.rows.at(-1).technicalEligible=true;assert.throws(()=>verifyCrowd27RecoveryAccounting(authority,summary));
});
test('duplicate partitions, changed row origins and impossible beam counts are rejected',()=>{
 for(const change of [
  (a,s)=>a.selectedClipIds.push(a.completedPriorClipIds[0]),
  (a,s)=>{s.rows[0]=s.rows[1]},
  (a,s)=>{s.rows[0].processingOrigin='new-recovery5-process'},
  (a,s)=>{s.rows[0].asrBeams=[5]},
  (a,s)=>{s.knownCompletedAsrReadings++},
 ]){const {authority,summary}=fixture();change(authority,summary);assert.throws(()=>verifyCrowd27RecoveryAccounting(authority,summary));}
});
