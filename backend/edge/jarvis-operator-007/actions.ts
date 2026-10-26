// Role scope has already been validated by the gateway.
// No arbitrary tables, messages, or external deliveries are permitted.
const uuid=(v)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
export async function dispatch(db,b,actor,reply){
 let rpc,args;
 switch(b.action){
  case 'view':rpc='jarvis_backend_list_jobs';args={};break;
  case 'enqueue':
   if(typeof b.key!=='string'||!/^fixture:panel-[a-f0-9]{24}$/.test(b.key)||
      typeof b.label!=='string'||b.label.length<4||b.label.length>140||/[<>@\r\n]|https?:\/\//i.test(b.label))
      return reply({ok:false,reason:'FICTIONAL_ONLY'},400);
   rpc='jarvis_backend_enqueue_fixture';args={p_key:b.key,p_label:'Fictional: '+b.label};break;
  case 'admit':
   if(!uuid(b.id))return reply({ok:false,reason:'ID'},400);
   rpc='jarvis_backend_admit_fixture';args={p_id:b.id};break;
  case 'claim':rpc='jarvis_backend_claim_fixture';args={p_worker:actor};break;
  case 'return':
   if(!uuid(b.id)||!Number.isInteger(b.attempt)||b.attempt<1||b.attempt>3||
     !b.result||typeof b.result!=='object'||Array.isArray(b.result)||
     JSON.stringify(b.result).length>1200)return reply({ok:false,reason:'RETURN'},400);
   rpc='jarvis_backend_return_fenced';args={p_id:b.id,p_worker:actor,p_attempt:b.attempt,p_result:b.result};break;
  default:return reply({ok:false,reason:'ACTION'},400);
 }
 try{const {data,error}=await db.rpc(rpc,args);
   return error?reply({ok:false,reason:'STORE'},503):reply({ok:true,data,mode:'SYNTHETIC',effects:0});
 }catch{return reply({ok:false,reason:'UNAVAILABLE'},503);}
}
