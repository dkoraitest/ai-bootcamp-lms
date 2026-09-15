import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTypeScriptModule} from './helpers/load-ts.mjs';
const path='src/lib/projects/demoVoting.ts';
const impl=existsSync(path)?loadTypeScriptModule(path):{};
test('ballot accepts real zero scores and rejects missing, fractional or out-of-range scores',()=>{
 assert.equal(typeof impl.ballotTotal,'function');
 assert.equal(impl.ballotTotal({usefulness:0,working:0,understanding:0}),0);
 assert.equal(impl.ballotTotal({usefulness:3,working:2,understanding:1}),6);
 for(const ballot of [{usefulness:null,working:2,understanding:1},{usefulness:4,working:2,understanding:1},{usefulness:1.5,working:2,understanding:1}]) assert.equal(impl.ballotTotal(ballot),null);
});
test('an explicit skip clears a vote while incomplete inputs cannot be submitted as zero',()=>{
 assert.equal(typeof impl.makeBallotPayload,'function');
 assert.deepEqual(impl.makeBallotPayload('madina',{usefulness:0,working:1,understanding:3},false),{candidate_key:'madina',scores:{usefulness:0,working:1,understanding:3}});
 assert.deepEqual(impl.makeBallotPayload('madina',{usefulness:null,working:null,understanding:null},true),{candidate_key:'madina',scores:null});
 assert.throws(()=>impl.makeBallotPayload('madina',{usefulness:null,working:1,understanding:3},false));
});
test('dirty-state comparison distinguishes unscored from scored zero',()=>{
 assert.equal(typeof impl.sameBallot,'function');
 assert.equal(impl.sameBallot(null,{usefulness:0,working:0,understanding:0}),false);
 assert.equal(impl.sameBallot({usefulness:3,working:2,understanding:1},{usefulness:3,working:2,understanding:1}),true);
});
