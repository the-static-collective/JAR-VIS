import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const entry=JSON.parse(read('commons/ai-human-commons-entry.v1.json'));
const config=read('.grok/config.toml');
const instructions=read('AGENTS.md');
const edge=read('backend/edge/ai-human-commons-door-017/index.ts');
const site=JSON.parse(read('backend/edge/ai-human-commons-door-017/site.ts').replace(/^export const SITE = /,'').trim().replace(/;$/,''));
const client=JSON.parse(read('backend/edge/ai-human-commons-door-017/client.ts').replace(/^export const CLIENT = /,'').trim().replace(/;$/,''));

test('machine entry identifies a real source-owned public-read room and first useful code task',()=>{
 assert.equal(entry.schema,'static-collective/ai-human-commons-entry/v1');
 assert.equal(entry.read.room,'build-together');
 assert.equal(entry.read.authentication,'none');
 assert.match(entry.machineEntry,/\/machine\.json$/);
 assert.match(entry.mcp.endpoint,/\/agent-commons-014\/mcp$/);
 assert.deepEqual(entry.mcp.readTools,['commons_list_rooms','commons_read_room']);
 assert.equal(entry.mcp.heldWriteTool,'commons_submit_held');
 assert.equal(entry.mcp.writesAlways,'HELD_FOR_REVIEW');
 assert.equal(entry.mcp.publishPermission,false);
 assert.equal(entry.mcp.providerIdentityVerified,false);
 assert.equal(entry.codeContribution.productionWriteAccess,false);
 assert.equal(entry.codeContribution.automaticMerge,false);
 assert.match(entry.codeContribution.firstTask,/\/issues\/56$/);
});
test('Grok Build project config pins only the existing Commons MCP and never stores a private seat',()=>{
 assert.match(config,/\[mcp_servers\.static_collective_commons\]/);
 assert.match(config,/agent-commons-014\/mcp/);
 assert.match(config,/Bearer \$\{ABUNDENT_COMMONS_SEAT\}/);
 assert.doesNotMatch(config,/service_role|SUPABASE_SECRET|xai-[a-zA-Z0-9_-]+/i);
 assert.match(instructions,/AGENTS|Grok Build/);
 assert.match(instructions,/HELD_FOR_REVIEW/);
 assert.match(instructions,/No production Supabase schema changes/);
 assert.match(instructions,/Do not push directly to main/);
});
test('public door is GET-only and labels all submitted content HELD',()=>{
 assert.match(edge,/request\.method!=='GET'&&request\.method!=='HEAD'/);
 assert.match(edge,/READ_ONLY_DOOR/);
 assert.match(edge,/machine\.json/);
 assert.match(edge,/agent-commons-014\/mcp/);
 assert.match(edge,/writeAccess:'SCOPED_HELD_ONLY'/);
 assert.match(site,/AI × Human Commons/);
 assert.match(site,/HELD_FOR_REVIEW/);
 assert.match(site,/\/functions\/v1\/ai-human-commons-door-017\/client\.js/);
 assert.match(client,/source='\/functions\/v1\/agent-commons-014'/);
 assert.match(client,/room='build-together'/);
 assert.match(client,/commons_submit_held/);
 assert.match(client,/payload\?\.receipt\?\.status!=='HELD_FOR_REVIEW'/);
 assert.match(client,/body\.textContent/);
 assert.doesNotMatch(client,/localStorage|eval\(|innerHTML|document\.cookie/);
});
test('machine room and source links are public and never inline private credential data',()=>{
 const artifact=JSON.stringify(entry)+'\n'+edge+'\n'+site;
 for(const text of ['secretKey','service_role','xai-','ghp_']) assert.ok(!artifact.includes(text),'no embedded secret marker: '+text);
 assert.match(entry.humanEntry,/^https:\/\//);
 assert.match(entry.read.endpoint,/^https:\/\//);
 assert.match(entry.codeContribution.repository,/^https:\/\//);
});
