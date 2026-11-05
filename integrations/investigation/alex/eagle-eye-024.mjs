// ALEX-024 Eagle Eye: broad, source-attributed public discovery.
// Public GitHub organization catalog + optional Wikipedia and OpenAlex.
// No unrestricted crawling, private connectors, repository writes or authority.
import {createHash} from 'node:crypto';

const ORG='the-static-collective';
const LIMITS=Object.freeze({question:360,pages:3,perPage:100,repos:6,
  tree:5000,filesPerRepo:3,bytesPerFile:36000,maxHits:36,perFileHits:4,
  wikipedia:5,scholarly:5,timeout:8000});
const STOP=new Set('what which whose where when how why does could would should into from have with about those these their there our the and for are can that this was were who you any use using more than then new like gets does not'.split(' '));
const sha=s=>createHash('sha256').update(s).digest('hex');
const gitBlob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const words=s=>[...new Set(String(s).toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2&&!STOP.has(w)))];
const score=(text,tokens)=>tokens.reduce((n,w)=>n+(words(text).includes(w)?1:0),0);
const allowedExt=s=>/\.(?:md|mdx|mjs|js|py|json|txt)$/i.test(s);
function pathAllowed(s){
 if(typeof s!=='string'||s.length>200||s.includes('..')||s.includes('//')||
   !/^[A-Za-z0-9_.\/-]+$/.test(s)||!allowedExt(s))return false;
 if(/(?:^|\/)(?:node_modules|\.git|secrets|credentials|keys|private|config\/production)(?:\/|$)/i.test(s))
  return false;
 return /^(README\.(?:md|mdx)|AGENTS\.md|docs\/|research\/|experiments\/|tools\/|src\/|artifacts\/)/i.test(s);
}
function questionSpec(question){
 if(typeof question!=='string'||question.trim().length<10||
   question.length>LIMITS.question||/[\x00-\x1f]/.test(question))
  throw Error('HOLD_INVALID_PUBLIC_QUESTION');
 const text=question.trim(),terms=words(text);
 if(terms.length<2||terms.length>36)throw Error('HOLD_QUESTION_OUTSIDE_BUDGET');
 return {text,terms};
}
function ensureScope(scopes){
 if(!scopes||typeof scopes!=='object'||Array.isArray(scopes))
  throw Error('HOLD_SOURCE_SCOPE_NOT_SPECIFIED');
 const out={github:scopes.github===true,wikipedia:scopes.wikipedia===true,
  scholarly:scopes.scholarly===true};
 if(!Object.values(out).some(Boolean))throw Error('HOLD_NO_OPTED_IN_PUBLIC_PROVIDER');
 if(Object.entries(scopes).some(([k,v])=>!Object.hasOwn(out,k)||typeof v!=='boolean'))
  throw Error('HOLD_UNRECOGNIZED_PROVIDER');
 return out;
}
async function readJson(url,transport,token=null){
 const u=new URL(url);
 if(u.protocol!=='https:'||
  !['api.github.com','en.wikipedia.org','api.openalex.org'].includes(u.hostname))
  throw Error('HOLD_UNTRUSTED_SOURCE_HOST');
 const headers={'Accept':'application/json','User-Agent':'ALEX-Eagle-Eye-024-public-read'};
 if(u.hostname==='api.github.com'){
  headers.Accept='application/vnd.github+json';
  headers['X-GitHub-Api-Version']='2022-11-28';
  if(token)headers.Authorization='Bearer '+token;
 }
 const response=await transport(u.href,{method:'GET',redirect:'error',headers,
  signal:AbortSignal.timeout(LIMITS.timeout)});
 if(!response?.ok||response.redirected)
  throw Error('HOLD_PUBLIC_PROVIDER_HTTP_'+(response?.status??'UNAVAILABLE'));
 return response.json();
}
async function enumerate(transport,token){
 const result=[];let completed=true,pages=0;
 for(let page=1;page<=LIMITS.pages;page++){
  const entries=await readJson('https://api.github.com/orgs/'+ORG+
   '/repos?type=public&per_page='+LIMITS.perPage+'&page='+page,transport,token);
  if(!Array.isArray(entries)||entries.length>LIMITS.perPage)
   throw Error('HOLD_INVALID_PUBLIC_ORG_INDEX');
  pages++;
  for(const repo of entries){
   // An authenticated connection may see more than its public permissions.
   if(repo?.private===false&&repo.visibility==='public'&&
      repo.owner?.login?.toLowerCase()===ORG&&
      /^the-static-collective\/[A-Za-z0-9_.-]+$/.test(repo.full_name))
    result.push({repository:repo.full_name,description:String(repo.description||'').slice(0,200),
     topics:Array.isArray(repo.topics)?repo.topics.slice(0,12):[],
     archived:repo.archived===true,default_branch:repo.default_branch});
  }
  if(entries.length<LIMITS.perPage){completed=true;break}
  if(page===LIMITS.pages)completed=false;
 }
 return {repos:result,pages,completed,public_repo_count:result.length};
}
async function oneRepo(repo,terms,transport,token){
 const root='https://api.github.com/repos/'+repo.repository;
 if(!/^[A-Za-z0-9._/-]{1,100}$/.test(repo.default_branch||''))
  throw Error('HOLD_BAD_DEFAULT_BRANCH');
 const current=await readJson(root+'/branches/'+encodeURIComponent(repo.default_branch),transport,token);
 const commit=current?.commit?.sha;
 if(!/^[a-f0-9]{40}$/.test(commit||''))throw Error('HOLD_UNPINNED_PUBLIC_COMMIT');
 const c=await readJson(root+'/git/commits/'+commit,transport,token);
 const treeSHA=c?.tree?.sha;
 if(!/^[a-f0-9]{40}$/.test(treeSHA||''))throw Error('HOLD_NO_SOURCE_TREE');
 const tree=await readJson(root+'/git/trees/'+treeSHA+'?recursive=1',transport,token);
 if(tree?.truncated!==false||!Array.isArray(tree.tree)||tree.tree.length>LIMITS.tree)
  throw Error('HOLD_UNTRUSTWORTHY_OR_PARTIAL_GIT_TREE');
 const eligible=tree.tree.filter(x=>x.type==='blob'&&pathAllowed(x.path)&&
  Number.isSafeInteger(x.size)&&x.size<=LIMITS.bytesPerFile&&
  /^[a-f0-9]{40}$/.test(x.sha));
 // A source-inventory stage may inspect a whole public repo tree, but only
 // budgeted files actually get read. Zero hits never means no relevant source.
 const sorted=eligible.map(x=>({...x,
  relevance:score(x.path,terms)*7+(x.path.toLowerCase()==='readme.md'?3:0)+
    (x.path.startsWith('docs/')?1:0)}))
  .sort((a,b)=>b.relevance-a.relevance||a.path.localeCompare(b.path))
  .slice(0,LIMITS.filesPerRepo);
 const documents=[],hits=[];
 for(const candidate of sorted){
  const blob=await readJson(root+'/git/blobs/'+candidate.sha,transport,token);
  if(blob?.encoding!=='base64'||typeof blob.content!=='string'||
    blob.size!==candidate.size||blob.size>LIMITS.bytesPerFile)
   throw Error('HOLD_INVALID_GIT_BLOB_ENCODING_OR_SIZE');
  const bytes=Buffer.from(blob.content.replace(/\s/g,''),'base64');
  if(bytes.length!==candidate.size||gitBlob(bytes)!==candidate.sha)
   throw Error('HOLD_GIT_BLOB_INTEGRITY_FAILURE');
  let text;
  try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes)}
  catch{throw Error('HOLD_NON_TEXT_GIT_BLOB')}
  documents.push({path:candidate.path,git_blob:candidate.sha,
   size:bytes.length,source_commit:commit});
  const lines=text.split('\n'),found=[];
  for(let i=0;i<lines.length;i++){
   // Public repositories can contain unintentionally published secrets.
   // Never echo obvious secrets or personal email addresses in output.
   if(/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i.test(lines[i]))
    continue;
   const termMatches=terms.filter(w=>words(lines[i]).includes(w));
   if(termMatches.length)found.push({line:i+1,terms:termMatches});
  }
  found.sort((a,b)=>b.terms.length-a.terms.length||a.line-b.line);
  for(const foundLine of found.slice(0,LIMITS.perFileHits)){
   hits.push({kind:'github_source',repository:repo.repository,source_commit:commit,
    path:candidate.path,git_blob:candidate.sha,line:foundLine.line,
    terms:foundLine.terms,score:foundLine.terms.length,
    excerpt:lines[foundLine.line-1].slice(0,180),
    url:'https://github.com/'+repo.repository+'/blob/'+commit+'/'+
      candidate.path+'#L'+foundLine.line,
    provenance:'GIT_BLOB_VERIFIED_LEXICAL_LEAD'});
  }
 }
 return {source:{repository:repo.repository,commit,tree_sha:treeSHA,
    documents,eligible_documents:eligible.length,
    selection_truncated:eligible.length>documents.length},
  hits};
}
async function wikiSearch(question,transport){
 const url=new URL('https://en.wikipedia.org/w/api.php');
 url.search=new URLSearchParams({action:'query',list:'search',
  srsearch:question,srlimit:String(LIMITS.wikipedia),
  format:'json',origin:'*'}).toString();
 const json=await readJson(url.href,transport);
 if(!Array.isArray(json?.query?.search))throw Error('HOLD_WIKIPEDIA_SEARCH_SHAPE');
 return json.query.search.slice(0,LIMITS.wikipedia).filter(x=>Number.isSafeInteger(x.pageid)&&x.pageid>0)
  .map(x=>({kind:'encyclopedia_index',title:String(x.title||'').slice(0,160),
    excerpt:String(x.snippet||'').replace(/<[^>]+>/g,' ').replace(/&[^; ]{1,12};/g,' ').slice(0,220),
    url:'https://en.wikipedia.org/?curid='+x.pageid,
    provenance:'WIKIPEDIA_SEARCH_INDEX_NOT_INDEPENDENT_REFERENCE'}));
}
async function scholarSearch(question,transport){
 const url=new URL('https://api.openalex.org/works');
 url.search=new URLSearchParams({search:question,per_page:String(LIMITS.scholarly),
  select:'id,display_name,publication_year,doi'}).toString();
 const json=await readJson(url.href,transport);
 if(!Array.isArray(json?.results))throw Error('HOLD_OPENALEX_SEARCH_SHAPE');
 return json.results.slice(0,LIMITS.scholarly).filter(x=>
  typeof x.id==='string'&&/^https:\/\/openalex\.org\/W[0-9]+$/.test(x.id))
  .map(x=>({kind:'research_index',title:String(x.display_name||'').slice(0,200),
    year:Number.isSafeInteger(x.publication_year)?x.publication_year:null,
    url:x.id,doi:typeof x.doi==='string'&&/^https:\/\/doi\.org\/10\./.test(x.doi)?
     x.doi:null,
    provenance:'OPENALEX_BIBLIOGRAPHIC_LEAD_NOT_ARTICLE_VERIFICATION'}));
}
export async function eagleEye({question,scopes,depth=4},options={}){
 const q=questionSpec(question),s=ensureScope(scopes);
 if(!Number.isSafeInteger(depth)||depth<1||depth>LIMITS.repos)
  throw Error('HOLD_UNBOUNDED_SOURCE_DEPTH');
 const transport=options.transport||globalThis.fetch;
 const token=options.githubToken||null;
 if(typeof transport!=='function'||token!==null&&
  (typeof token!=='string'||token.length>1024))
  throw Error('HOLD_INVALID_EAGLE_EYE_TRANSPORT');
 const failures=[],providers=[],catalog={enumerated:0,pages:0,
  complete:false,selected:0},source_documents=[];
 const hits=[];
 if(s.github){
  providers.push('GITHUB_ORGANIZATION_PUBLIC');
  try{
   const map=await enumerate(transport,token);
   catalog.enumerated=map.public_repo_count;
   catalog.pages=map.pages;catalog.complete=map.completed;
   const ranked=map.repos.filter(x=>!x.archived).map(x=>({...x,
    score:score(x.repository+' '+x.description+' '+x.topics.join(' '),q.terms)}))
    .sort((a,b)=>b.score-a.score||a.repository.localeCompare(b.repository));
   const selected=ranked.slice(0,depth);
   catalog.selected=selected.length;
   catalog.repos_considered=ranked.length;
   catalog.unopened_repos=ranked.length-selected.length;
   for(const entry of selected){
    try{
     const result=await oneRepo(entry,q.terms,transport,token);
     source_documents.push(result.source);
     hits.push(...result.hits);
    }catch(e){
     failures.push({provider:'github',repository:entry.repository,
      status:String(e.message||e).slice(0,130)});
    }
   }
  }catch(e){failures.push({provider:'github',status:String(e.message||e).slice(0,130)})}
 }
 if(s.wikipedia){
  providers.push('WIKIPEDIA_PUBLIC_SEARCH_INDEX');
  try{hits.push(...await wikiSearch(q.text,transport))}
  catch(e){failures.push({provider:'wikipedia',status:String(e.message||e).slice(0,130)})}
 }
 if(s.scholarly){
  providers.push('OPENALEX_PUBLIC_SCHOLARLY_INDEX');
  try{hits.push(...await scholarSearch(q.text,transport))}
  catch(e){failures.push({provider:'scholarly',status:String(e.message||e).slice(0,130)})}
 }
 const sorted=hits.sort((a,b)=>{
  if(a.kind!==b.kind)return a.kind==='github_source'?-1:1;
  return (b.score||0)-(a.score||0)||
    String(a.repository||a.title).localeCompare(String(b.repository||b.title));
 }).slice(0,LIMITS.maxHits);
 const body={
  schema:'alex.eagle-eye-public-packet/v0',
  question:q.text,question_sha256:sha(q.text),scopes:s,
  status:sorted.length?'PUBLIC_RESEARCH_LEADS':'HOLD_NO_VERIFIED_LEADS',
  providers,catalog,source_documents,hits:sorted,failures,
  total_retrieved_leads:hits.length,
  results_truncated:hits.length>sorted.length,
  coverage:'PARTIAL_BOUNDED_PUBLIC_PROVIDER_RESEARCH',
  repository_search_not_web_wide:true,
  human_witness_independence_verified:false,
  citation_authenticity:'GIT_BLOBS_VERIFIED_WHERE_MARKED;INDEX_LEADS_UNVERIFIED',
  field_actions:0,private_sources_accessed:false,
  automatically_published:false,authority:'none'
 };
 return {...body,checksum_sha256:sha(JSON.stringify(body))};
}
export function validatePacket(packet){
 if(!packet||packet.schema!=='alex.eagle-eye-public-packet/v0'||
  packet.authority!=='none'||packet.private_sources_accessed!==false||
  packet.field_actions!==0||packet.coverage!=='PARTIAL_BOUNDED_PUBLIC_PROVIDER_RESEARCH'||
  !Array.isArray(packet.hits)||packet.hits.length>LIMITS.maxHits)
  throw Error('HOLD_INVALID_EAGLE_EYE_PACKET');
 const {checksum_sha256,...body}=packet;
 if(sha(JSON.stringify(body))!==checksum_sha256)
  throw Error('HOLD_TAMPERED_EAGLE_EYE_PACKET');
 return true;
}
export const SOURCE_LIMITS=LIMITS;
