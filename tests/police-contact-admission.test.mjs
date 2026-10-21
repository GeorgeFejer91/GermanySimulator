import test from 'node:test';
import assert from 'node:assert/strict';
import {policeContactPhaseAuthority} from '../tools/admit-police-contact-voices.mjs';
const pins={authoritySha256:'a'.repeat(64),adapterSha256:'b'.repeat(64),requestSha256:'c'.repeat(64),frozenSha256:'d'.repeat(64)};
function phase(){return {phase:'render',specificationSha256:pins.authoritySha256,producerSha256:pins.adapterSha256,authoredPlanSha256:pins.requestSha256,frozenRequestSha256:pins.frozenSha256,exitCode:0,rootRetired:true,timedOut:false,logsComplete:true,survivingOwnedChildren:[],ownedCleanupKills:[],postflightPinFailures:[],censusErrors:[]};}
test('ROOT phase acceptance requires exact new authority/request/helper pins and a clean retirement',()=>{
 assert.equal(policeContactPhaseAuthority(phase(),pins),true);
 for(const change of [p=>p.specificationSha256='0'.repeat(64),p=>p.producerSha256='0'.repeat(64),p=>p.frozenRequestSha256='0'.repeat(64),p=>p.phase='old-police12',p=>p.exitCode=1,p=>p.rootRetired=false,p=>p.timedOut=true,p=>p.logsComplete=false,p=>p.survivingOwnedChildren=[1234],p=>p.ownedCleanupKills=[1234],p=>p.postflightPinFailures=['game.js'],p=>p.censusErrors=['permission denied'],p=>delete p.censusErrors]){
  const changed=phase();change(changed);assert.throws(()=>policeContactPhaseAuthority(changed,pins));
 }
});
