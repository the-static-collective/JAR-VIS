// CHANGE-REVIEW-001: capture inspectable GitHub compare facts, never feature or field proof.
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
export const OUTPUT='commons/change-candidates-v1.json';
const SHA=/^[a-f0-9]{40}$/;
const TIME=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const STATUSES=new Set(['added','modified','removed','renamed','copied','changed','unchanged']);
const safePath=(s)=>typeof s==='string'&&s.length>0&&s.length<=180&&!/[\x00-\x1f\x7f<>]/.test(s)
  &&!s.startsWith('/')&&!s.split('/').some(x=>x==='..'||x==='.');
const reviewId=(repo,from,to)=>'DIFF-'+createHash('sha256').update(repo+':'+from+':'+to).digest('hex').slice(0,20).toUpperCase();
export const category=(path)=>/(^|\/)(test|tests|__tests__)\/|\.(test|spec)\.[cm]?[jt]sx?$/.test(path)?'TESTS':
  /(^|\/)(docs?|README|CHANGELOG|LICENSE)(\/|\.|$)|\.(md|rst|txt)$/.test(path)?'DOCUMENTATION':
  /(^|\/)\.github\/|(^|\/)(package-lock\.json|package\.json|vercel\.json|wrangler\.jsonc?|tsconfig\.json|Dockerfile|pyproject\.toml)$|\.(ya?ml|toml)$/.test(path)?'CONFIGURATION':
  /\.(js|mjs|cjs|ts|tsx|jsx|py|go|rs|sh|sql|html|css)$/.test(path)?'SOURCE_CODE':'OTHER';
export function validateQueue(v){
 if(!v||v.schema!=='static-collective/change-candidates-v1'||v.authority!=='NONE'
  ||!TIME.test(v.scannedAt)||!Array.isArray(v.candidates)||v.candidates.length>24
  ||!Array.isArray(v.monitoredRepos)||v.monitoredRepos.length!==11)throw Error('QUEUE_SCHEMA');
 const seen=new Set();
 for(const c of v.candidates){
  if(!c||!/^DIFF-[A-F0-9]{20}$/.test(c.id)||seen.has(c.id)||!v.monitoredRepos.includes(c.repo)
   ||c.ref!=='main'||!SHA.test(c.from)||!SHA.test(c.to)||c.from===c.to
   ||!TIME.test(c.observedAt)||!['PENDING_REVIEW','HOLD_COMPARE'].includes(c.state)
   ||c.authority!=='NONE'||c.admission!=='NOT_ADMITTED'
   ||c.compareUrl!=='https://github.com/the-static-collective/'+c.repo+'/compare/'+c.from+'...'+c.to
   ||!Array.isArray(c.files)||c.files.length>12)throw Error('QUEUE_ITEM');
  for(const f of c.files)if(!safePath(f.path)||!STATUSES.has(f.status)
    ||!['TESTS','DOCUMENTATION','CONFIGURATION','SOURCE_CODE','OTHER'].includes(f.category))throw Error('QUEUE_FILE');
  if(c.state==='PENDING_REVIEW'&&(!Number.isSafeInteger(c.totalFiles)||c.totalFiles<0||c.totalFiles>60))throw Error('QUEUE_COUNT');
  if(c.state==='HOLD_COMPARE'&&c.files.length)throw Error('QUEUE_HOLD');
  seen.add(c.id);
 }
 return v;
}
export async function inspectMovement(repo,from,to,observedAt,{fetcher=fetch,token=''}={}){
 if(!/^[A-Za-z0-9.-]{1,60}$/.test(repo)||!SHA.test(from)||!SHA.test(to)||from===to||!TIME.test(observedAt))throw Error('BAD_MOVEMENT');
 const shared={id:reviewId(repo,from,to),repo,ref:'main',from,to,observedAt,
  compareUrl:'https://github.com/the-static-collective/'+repo+'/compare/'+from+'...'+to,
  admission:'NOT_ADMITTED',authority:'NONE',
  nextCheck:'Open the exact GitHub comparison. Check behavior, tests, deployment and independent owner approval separately; do not infer partners or completed work.',
  disclosure:'Candidate from public GitHub compare metadata; filenames are not verified implemented features or field outcomes.'};
 const hold=(reason)=>({...shared,state:'HOLD_COMPARE',reason,files:[],totalFiles:null,categoryCounts:{}});
 try{
  const url='https://api.github.com/repos/the-static-collective/'+repo+'/compare/'+from+'...'+to;
  const headers={accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  if(token)headers.authorization='Bearer '+token;
  const res=await fetcher(url,{headers,redirect:'error',signal:AbortSignal.timeout(8500)});
  if(!res.ok||Number(res.headers.get('content-length'))>110000) return hold('COMPARE_UNAVAILABLE_OR_OVERSIZE');
  const raw=await res.text();
  if(raw.length>110000)return hold('COMPARE_OVERSIZE');
  const obj=JSON.parse(raw);
  if(!['ahead'].includes(obj.status)||obj.base_commit?.sha!==from||obj.merge_base_commit?.sha!==from
   ||obj.commits?.length>100||!Number.isSafeInteger(obj.total_commits)||obj.total_commits<1||obj.total_commits>100)
   return hold('NOT_A_BOUNDED_FAST_FORWARD');
  if(!Array.isArray(obj.files)||!obj.files.length||obj.files.length>60
   ||obj.files.some(f=>!safePath(f.filename)||!STATUSES.has(f.status)
     ||(f.previous_filename!==undefined&&!safePath(f.previous_filename))))
   return hold('FILES_UNAVAILABLE_OR_UNBOUNDED');
  // GitHub Compare's paginated payload can be incomplete. Never present a sample as a complete comparison.
  if(obj.files.length===60||obj.total_commits>100)return hold('COMPARE_BOUNDARY_REACHED');
  const counts={TESTS:0,DOCUMENTATION:0,CONFIGURATION:0,SOURCE_CODE:0,OTHER:0};
  for(const f of obj.files)counts[category(f.filename)]++;
  // Filename-only presentation. Do not import executable code, message bodies or diffs as instructions.
  return {...shared,state:'PENDING_REVIEW',reason:'NONE',totalFiles:obj.files.length,
   categoryCounts:counts,files:obj.files.slice(0,12).map(f=>({path:f.filename,status:f.status,category:category(f.filename)}))};
 }catch{return hold('COMPARE_UNAVAILABLE_OR_INVALID');}
}
export async function generateCandidates({previous=null,current,queue=null,fetcher=fetch,token=''}={}){
 if(!current||current.schema!=='static-collective/source-observations-v1')throw Error('INVALID_OBSERVATION');
 const previousSources=new Map((previous?.sources||[]).map(s=>[s.repo,s]));
 const candidateMap=new Map((queue?.candidates||[]).map(c=>[c.id,c]));
 const discovered=[];
 for(const s of current.sources){
  if(s.status!=='OBSERVED_HEAD')continue;
  const old=previousSources.get(s.repo);
  if(!old||old.status!=='OBSERVED_HEAD'||old.sha===s.sha)continue;
  const id=reviewId(s.repo,old.sha,s.sha);
  if(candidateMap.has(id))continue;
  discovered.push(await inspectMovement(s.repo,old.sha,s.sha,current.scannedAt,{fetcher,token}));
 }
 // The queue is a bounded reverse-chronological review shelf, not a permanent audit log.
 const candidates=[...discovered,...candidateMap.values()].slice(0,24);
 const result={schema:'static-collective/change-candidates-v1',authority:'NONE',
  scannedAt:current.scannedAt,monitoredRepos:current.sources.map(s=>s.repo),
  disclosure:'Automatically generated source-diff CANDIDATES, not reviewed claims, canon, releases, deployments, partnerships or completed acts. No automatic admission is possible.',
  candidates};
 return validateQueue(result);
}
export async function runQueue({previous,current,fetcher=fetch,token=''}){
 let queue=null;try{queue=validateQueue(JSON.parse(await readFile(OUTPUT,'utf8')))}catch{/* first run or corrupt old snapshot: HOLD history */}
 const result=await generateCandidates({previous,current,queue,fetcher,token});
 await writeFile(OUTPUT,JSON.stringify(result,null,2)+'\n','utf8');
 return result;
}
