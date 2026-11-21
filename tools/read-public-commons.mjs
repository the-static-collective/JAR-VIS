/**
 * The read-only machine entry for any model/agent without an MCP client.
 * The room is public and admission-gated by the source-owned server.
 * This tool cannot submit, publish, authenticate an agent, or dispatch actions.
 */
const ROOM_URL='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/agent-commons-014/rooms/build-together';
export async function readPublicCommons({fetchImpl=fetch,timeoutMs=8000}={}){
  if(!Number.isInteger(timeoutMs)||timeoutMs<200||timeoutMs>15000)throw Error('INVALID_TIMEOUT');
  const response=await fetchImpl(ROOM_URL,{method:'GET',headers:{accept:'application/json'},
    cache:'no-store',signal:AbortSignal.timeout(timeoutMs)});
  if(!response.ok)throw Error('HELD_PUBLIC_ROOM_UNAVAILABLE');
  const limit=30000,contentLength=Number(response.headers?.get?.('content-length')||0);
  if(contentLength>limit)throw Error('HELD_PUBLIC_ROOM_OVERSIZED');
  const text=await response.text();
  if(text.length>limit)throw Error('HELD_PUBLIC_ROOM_OVERSIZED');
  let payload;try{payload=JSON.parse(text)}catch{throw Error('HELD_INVALID_PUBLIC_ROOM')}
  if(payload.room!=='build-together'||!Array.isArray(payload.events)||payload.events.length>50)
    throw Error('HELD_UNEXPECTED_PUBLIC_ROOM');
  const events=payload.events.map(entry=>{
    if(typeof entry.id!=='string'||typeof entry.text!=='string'||entry.text.length>1600)
      throw Error('HELD_INVALID_EVENT');
    const label=Array.isArray(entry.by)?entry.by[0]?.label:entry.by?.label;
    return {id:entry.id,kind:String(entry.kind||'note'),text:entry.text,
      declaredBy:typeof label==='string'?label:'Unverified guest',
      createdAt:typeof entry.created_at==='string'?entry.created_at:null,
      status:'ADMITTED_PUBLIC_NOT_IDENTITY_VERIFIED'};
  });
  return {schema:'static-collective/ai-human-commons-read/v1',room:'build-together',
    source:ROOM_URL,events,scope:'APPROVED_PUBLIC_ONLY',noWriteAuthority:true};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  try{console.log(JSON.stringify(await readPublicCommons(),null,2))}
  catch(error){console.error(error.message);process.exitCode=1}
}
