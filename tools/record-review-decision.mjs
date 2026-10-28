// REVIEW-DECISION-001: GitHub-authenticated source review journal; no field admission.
// Only original issue_comment CREATED events by repository WRITE/ADMIN reviewers can append.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export const FILE='commons/review-decisions-v1.json';
export const DISPOSITIONS=Object.freeze(['HOLD','NEEDS_EVIDENCE','SOURCE_CHANGE_REVIEWED','DISMISS']);
const SHA=/^[a-f0-9]{40}$/;
const TIME=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const REVIEW=/^DIFF-[A-F0-9]{20}$/;
const EVIDENCE='SOURCE_REVIEW_ONLY_NOT_DEPLOYMENT_OR_FIELD_PROOF';
const PREFIX='JARVIS_CHANGE_REVIEW_V1\n',SUFFIX='\nEND_JARVIS_CHANGE_REVIEW_V1';
const repoRoot='https://github.com/the-static-collective/JAR-VIS';
const username=v=>typeof v==='string'&&/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(v);
export function parseReviewIssue(body){
 if(typeof body!=='string'||body.length>1100||!body.startsWith(PREFIX)||!body.endsWith(SUFFIX))throw Error('INVALID_REVIEW_ISSUE');
 const str=body.slice(PREFIX.length,-SUFFIX.length);
 if(str.includes('\n'))throw Error('MULTILINE_ISSUE');
 let v;try{v=JSON.parse(str)}catch{throw Error('INVALID_ISSUE_JSON')}
 if(!v||Object.keys(v).sort().join(',')!=='candidateId,from,repo,to'
  ||!REVIEW.test(v.candidateId)||!SHA.test(v.from)||!SHA.test(v.to)
  ||v.from===v.to||!(/^[A-Za-z0-9.-]{2,60}$/.test(v.repo)))throw Error('INVALID_ISSUE_FIELDS');
 return v;
}
export function validateLedger(v){
 if(!v||v.schema!=='static-collective/review-decisions-v1'||v.authority!=='GITHUB_WRITE_REVIEWERS'
   ||!Array.isArray(v.records)||v.records.length>400)throw Error('INVALID_REVIEW_LEDGER');
 const seen=new Set();
 for(const r of v.records){
  if(!r||!/^COMMENT-[1-9][0-9]{0,17}$/.test(r.id)||seen.has(r.id)
    ||!REVIEW.test(r.candidateId)||!SHA.test(r.from)||!SHA.test(r.to)
    ||!DISPOSITIONS.includes(r.disposition)||!username(r.reviewer)
    ||!['write','admin'].includes(r.reviewerPermission)
    ||!Number.isSafeInteger(r.commentId)||r.commentId<1
    ||!Number.isSafeInteger(r.issueNumber)||r.issueNumber<1
    ||!TIME.test(r.reviewedAt)||!(/^[a-f0-9]{64}$/.test(r.issueBodySha256))
    ||r.claim!==EVIDENCE||r.authority!=='GITHUB_WRITE_REVIEWERS'
    ||r.issueUrl!==repoRoot+'/issues/'+r.issueNumber
    ||r.commentUrl!==r.issueUrl+'#issuecomment-'+r.commentId)throw Error('INVALID_REVIEW_RECORD');
  seen.add(r.id);
 }
 return v;
}
export function decide({event,queue,permission,ledger}){
 if(!event||event.action!=='created'||event.repository?.full_name!=='the-static-collective/JAR-VIS'
   ||!event.comment||!event.issue||event.issue.pull_request)throw Error('NOT_REVIEW_ISSUE_COMMENT');
 const reviewer=event.comment.user?.login;
 if(!username(reviewer)||event.sender?.login!==reviewer
   ||!['write','admin'].includes(permission))throw Error('NOT_AUTHORIZED');
 const command=String(event.comment.body||'').trim();
 const m=command.match(/^\/jarvis-review (HOLD|NEEDS_EVIDENCE|SOURCE_CHANGE_REVIEWED|DISMISS)$/);
 if(!m)throw Error('NOT_REVIEW_COMMAND');
 const issueNo=event.issue.number,id=event.comment.id;
 if(!Number.isSafeInteger(issueNo)||issueNo<1||!Number.isSafeInteger(id)||id<1
   ||event.issue.html_url!==repoRoot+'/issues/'+issueNo
   ||event.comment.html_url!==event.issue.html_url+'#issuecomment-'+id
   ||!TIME.test(event.comment.created_at)
   ||!String(event.issue.title||'').startsWith('[JARVIS REVIEW] '))throw Error('UNTRUSTED_EVENT');
 const submitted=parseReviewIssue(event.issue.body);
 const candidate=queue?.candidates?.find(c=>c.id===submitted.candidateId);
 if(!candidate||candidate.repo!==submitted.repo||candidate.from!==submitted.from
   ||candidate.to!==submitted.to||candidate.admission!=='NOT_ADMITTED'
   ||!['PENDING_REVIEW','HOLD_COMPARE'].includes(candidate.state))throw Error('CANDIDATE_NOT_CURRENTLY_QUEUED');
 if(candidate.state==='HOLD_COMPARE'&&!['HOLD','NEEDS_EVIDENCE','DISMISS'].includes(m[1]))throw Error('UNINSPECTABLE_COMPARE');
 validateLedger(ledger);
 const rid='COMMENT-'+id;if(ledger.records.some(r=>r.id===rid))return {updated:false,ledger};
 if(ledger.records.length>=400)throw Error('REVIEW_LEDGER_FULL');
 const record={
  id:rid,candidateId:candidate.id,repo:candidate.repo,from:candidate.from,to:candidate.to,
  disposition:m[1],issueNumber:issueNo,issueUrl:event.issue.html_url,
  commentId:id,commentUrl:event.comment.html_url,
  reviewer,reviewerPermission:permission,reviewedAt:event.comment.created_at,
  issueBodySha256:createHash('sha256').update(event.issue.body,'utf8').digest('hex'),
  authority:'GITHUB_WRITE_REVIEWERS',claim:EVIDENCE
 };
 return {updated:true,ledger:validateLedger({...ledger,records:[...ledger.records,record]})};
}
export async function getPermission(login,{fetcher=fetch,token}={}){
 if(!username(login)||!token)throw Error('MISSING_REVIEWER_CREDENTIALS');
 const url='https://api.github.com/repos/the-static-collective/JAR-VIS/collaborators/'+login+'/permission';
 const r=await fetcher(url,{headers:{accept:'application/vnd.github+json',
  authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'},redirect:'error',
  signal:AbortSignal.timeout(7000)});
 if(!r.ok)throw Error('REVIEWER_PERMISSION_UNAVAILABLE');
 const x=await r.json();
 if(!['admin','write'].includes(x.permission)||x.user?.login!==login)throw Error('REVIEWER_LACKS_WRITE_PERMISSION');
 return x.permission;
}
export async function recordFromEvent({event,permission,read=readFile,write=writeFile}={}){
 const queue=JSON.parse(await read('commons/change-candidates-v1.json','utf8'));
 const ledger=validateLedger(JSON.parse(await read(FILE,'utf8')));
 const result=decide({event,queue,permission,ledger});
 if(result.updated)await write(FILE,JSON.stringify(result.ledger,null,2)+'\n','utf8');
 return result;
}
async function main(){
 const filepath=process.env.GITHUB_EVENT_PATH,token=process.env.GITHUB_TOKEN;
 if(!filepath||!token)throw Error('GITHUB_EVENT_OR_TOKEN_MISSING');
 const event=JSON.parse(await readFile(filepath,'utf8'));
 if(!/^\/jarvis-review /.test(String(event.comment?.body||'').trim())){
  process.stdout.write('No reviewer command, no write.\n');return;
 }
 const permission=await getPermission(event.comment?.user?.login,{token});
 const result=await recordFromEvent({event,permission});
 process.stdout.write(result.updated?'Recorded authorized source-review decision.\n':'Identical comment already recorded.\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 main().catch(e=>{process.stderr.write(e.message+'\n');process.exitCode=1});
