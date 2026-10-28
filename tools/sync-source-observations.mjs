// SOURCE-WATCH-001: public source observations, deliberately NOT project canon.
// Only a named public ref/commit is seen. Never infer deployment, permission or work performed.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export const WATCHED=Object.freeze([
 {repo:'webZ',ref:'main',tags:['abundent','jubilee','porchlight','garden','switchboard','becoming']},
 {repo:'reLATTE',ref:'main',tags:['commuter','postoffice','farm','email','receipt']},
 {repo:'BananaSpork',ref:'main',tags:['homelessness','porchlight','grocery','food']},
 {repo:'Static-live',ref:'main',tags:['music','performance','radio','worship']},
 {repo:'lemonPRESS',ref:'main',tags:['publishing','newspaper','newsletter','books']},
 {repo:'GRAFT',ref:'main',tags:['commons','weaving','research','crossing']},
 {repo:'GHoT',ref:'main',tags:['hardware','compute','energy','solar']},
 {repo:'planZ',ref:'main',tags:['planning','garden','food','project']},
 {repo:'Free-Graph',ref:'main',tags:['relationships','weave','graph']},
 {repo:'CANNON',ref:'main',tags:['evidence','history','provenance']},
 {repo:'LOADOUT',ref:'main',tags:['tools','capability','compute']}
].map(x=>Object.freeze({...x,tags:Object.freeze(x.tags)})));
export const OUTPUT='commons/source-observations-v1.json';
const SHA=/^[0-9a-f]{40}$/,ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
export function validateSnapshot(x){
 if(!x||x.schema!=='static-collective/source-observations-v1'||!ISO.test(x.scannedAt)
    ||!Array.isArray(x.sources)||x.sources.length!==WATCHED.length
    ||!Array.isArray(x.events)||x.events.length>30)throw Error('INVALID_SNAPSHOT');
 const names=new Set();
 for(const s of x.sources){
  if(!WATCHED.some(w=>w.repo===s.repo&&w.ref===s.ref)||names.has(s.repo)
    ||!['OBSERVED_HEAD','HOLD'].includes(s.status)
    ||(s.status==='OBSERVED_HEAD'&&(!SHA.test(s.sha)||!ISO.test(s.commitTime)||!ISO.test(s.checkedAt)))
    ||(s.status==='HOLD'&&s.sha!==null))throw Error('INVALID_SOURCE');
  names.add(s.repo);
 }
 for(const e of x.events)if(!WATCHED.some(w=>w.repo===e.repo)
   ||e.kind!=='REF_MOVED'||!SHA.test(e.from)||!SHA.test(e.to)||e.from===e.to
   ||!ISO.test(e.detectedAt))throw Error('INVALID_EVENT');
 return x;
}
export async function collect({fetcher=fetch,previous=null,now=()=>new Date().toISOString(),token=''}={}){
 const scannedAt=now();if(!ISO.test(scannedAt))throw Error('INVALID_SCAN_DATE');
 const prior=new Map((previous?.sources||[]).map(x=>[x.repo,x]));
 const events=[...(previous?.events||[])].slice(-30);
 const sources=[];
 for(const w of WATCHED){
  const endpoint='https://api.github.com/repos/the-static-collective/'+encodeURIComponent(w.repo)+'/commits/'+w.ref;
  try{
   const headers={accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
   if(token)headers.authorization='Bearer '+token;
   const res=await fetcher(endpoint,{headers,redirect:'error',signal:AbortSignal.timeout(8500)});
   if(!res.ok||Number(res.headers.get('content-length'))>50000)throw Error('SOURCE_UNAVAILABLE');
   const raw=await res.text();if(raw.length>50000)throw Error('SOURCE_OVERSIZE');
   const obj=JSON.parse(raw),sha=obj.sha,commitTime=obj.commit?.committer?.date;
   if(!SHA.test(sha)||!ISO.test(commitTime))throw Error('MALFORMED_COMMIT');
   const old=prior.get(w.repo);
   if(old?.status==='OBSERVED_HEAD'&&old.sha!==sha)events.push({
    kind:'REF_MOVED',repo:w.repo,from:old.sha,to:sha,detectedAt:scannedAt,
    meaning:'Observed public branch pointer changed. No execution, adoption or field outcome is inferred.'
   });
   sources.push({repo:w.repo,ref:w.ref,status:'OBSERVED_HEAD',sha,commitTime,checkedAt:scannedAt,
    commitUrl:'https://github.com/the-static-collective/'+w.repo+'/commit/'+sha,
    tags:w.tags,claim:'PUBLIC_REF_ONLY_NOT_CANON_OR_FIELD_EVIDENCE'});
  }catch{
   sources.push({repo:w.repo,ref:w.ref,status:'HOLD',sha:null,commitTime:null,checkedAt:scannedAt,
    commitUrl:null,tags:w.tags,
    lastKnownSha:SHA.test(prior.get(w.repo)?.sha||'')?prior.get(w.repo).sha:null,
    reason:'FETCH_UNAVAILABLE_OR_INVALID',claim:'NO_CURRENT_SOURCE_OBSERVED'});
  }
 }
 return validateSnapshot({schema:'static-collective/source-observations-v1',
   scannedAt,scope:'EXPLICIT_PUBLIC_REPOSITORIES_ONLY',authority:'NONE',
   disclosure:'A public branch pointer and commit time were observed. Main is not canon. A change is not a feature release, a successful deployment, a partner agreement, a completed task, or verified field evidence. HOLD cannot be treated as unchanged.',
   sources,events:events.slice(-30)});
}
async function main(){
 let previous=null;
 try{previous=validateSnapshot(JSON.parse(await readFile(OUTPUT,'utf8')))}catch{/* first scan or old invalid file: no invented history */}
 const snapshot=await collect({previous,token:process.env.GITHUB_TOKEN||''});
 if(snapshot.sources.every(s=>s.status==='HOLD'))throw Error('ALL_SOURCES_HOLD_NO_PUBLICATION');
 await writeFile(OUTPUT,JSON.stringify(snapshot,null,2)+'\n','utf8');
 process.stdout.write('Source pointer observation: '+snapshot.sources.filter(s=>s.status==='OBSERVED_HEAD').length+
  ' READ, '+snapshot.sources.filter(s=>s.status==='HOLD').length+' HOLD, '+snapshot.events.length+' bounded observed movements.\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{process.stderr.write(e.message+'\n');process.exitCode=1});
