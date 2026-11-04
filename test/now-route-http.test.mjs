import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startWorkbenchServer} from '../src/server.mjs';

test('localhost NOW-ROUTE HTML and CSRF-gated HTTP crossing preserve proposal/report/receipt boundaries',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'jarvis-now-route-'));
  const server=await startWorkbenchServer({journalPath:join(dir,'events.jsonl'),port:0});
  try{
    const home=await fetch(server.url+'/now-route');
    assert.equal(home.status,200);
    assert.match(await home.text(),/Make a good thing happen/);
    const stateResponse=await fetch(server.url+'/api/now-route/state');
    assert.equal(stateResponse.status,200);
    const state=await stateResponse.json();
    assert.equal(state.mode,'LOCAL_SYNTHETIC_NO_DISPATCH');
    const post=(path,body,headers={})=>fetch(server.url+'/api/now-route/'+path,{
      method:'POST',headers:{'content-type':'application/json','x-jarvis-csrf':state.csrfToken,...headers},
      body:JSON.stringify(body)
    });
    const place={lat:44.077,lon:-93.507};
    const second={lat:44.084,lon:-93.5};
    const donor={description:'I have some extra fish',location:place,expiresMinutes:45,radiusMiles:5};
    const receiver={description:'I need groceries',location:second,
      allowMatching:true,canPickup:true,estimatedTravelMinutes:12,expiresMinutes:120,maxMiles:5};
    const missingCsrf=await fetch(server.url+'/api/now-route/offer',{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(donor)
    });
    assert.equal(missingCsrf.status,403);
    const offsite=await post('offer',donor,{origin:'https://example.org'});
    assert.equal(offsite.status,403);
    const unsafe=await (await post('offer',donor)).json();
    assert.equal(unsafe.state,'HOLD_SAFETY');
    const need=await (await post('need',receiver)).json();
    let current=await (await fetch(server.url+'/api/now-route/state')).json();
    assert.equal(current.suggestions[unsafe.id].length,0);
    const offer=await (await post('offer',{...donor,coldChainAttested:true})).json();
    current=await (await fetch(server.url+'/api/now-route/state')).json();
    assert.equal(current.suggestions[offer.id][0].needId,need.id);
    assert.ok(!JSON.stringify(current).includes('44.077'),'exact coordinates remain server-local');
    const proposed=await (await post('propose',{offerId:offer.id,needId:need.id})).json();
    assert.equal(proposed.state,'OFFERED');
    const accepted=await (await post('respond',{routeId:proposed.id,needId:need.id,accept:true})).json();
    assert.equal(accepted.state,'ACCEPTED');
    assert.equal((await (await post('report',{routeId:proposed.id,offerId:offer.id})).json()).state,'REPORTED');
    current=await (await fetch(server.url+'/api/now-route/state')).json();
    assert.equal(current.offers.find(o=>o.id===offer.id).state,'RESERVED');
    await post('confirm',{routeId:proposed.id,needId:need.id});
    current=await (await fetch(server.url+'/api/now-route/state')).json();
    assert.equal(current.routes[0].state,'CONFIRMED');
    assert.equal(current.offers.find(o=>o.id===offer.id).state,'CLOSED');
  }finally{
    await server.close();
    await rm(dir,{recursive:true,force:true});
  }
});
