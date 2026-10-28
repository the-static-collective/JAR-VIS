// A deliberate file-in, HOLD-out crossing. Only loopback same-origin calls.
const $=id=>document.getElementById(id);
$("form").addEventListener("submit",async event=>{
 event.preventDefault();const file=$("file").files?.[0];const out=$("result");
 if(!file||file.size>3000){out.textContent="HOLD_PACKET_SIZE";return}
 try{
  const original=JSON.parse(await file.text());
  const csrfResponse=await fetch("/api/state",{method:"GET",cache:"no-store"});
  if(!csrfResponse.ok)throw Error("Local JAR;VIS session unavailable.");
  const {csrfToken}=await csrfResponse.json();
  const res=await fetch("/api/bridge/triage",{method:"POST",
   headers:{"content-type":"application/json","x-jarvis-csrf":csrfToken},
   body:JSON.stringify(original)});
  const result=await res.json();
  if(!res.ok){out.textContent="HOLD: "+(result.error||"Untrusted packet");return}
  out.textContent=JSON.stringify(result,null,2);
 }catch(err){out.textContent="HOLD: "+err.message}
});
