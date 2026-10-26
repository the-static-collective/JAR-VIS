export const SITE=String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#152e25"><title>JAR;VIS · Stewardship Operator</title>
<meta name="description" content="Private operator workbench for consent-aware reviewer discovery and stewardship.">
<style>
:root{font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;--night:#0e211b;--forest:#1b4031;--panel:#183329;--paper:#f2f1e5;--muted:#d0e0d1;--line:#40634c;--accent:#c6e5a8;--gold:#f2cd87}
*{box-sizing:border-box}body{background:var(--night);color:#f1f6e8;margin:0}button,input,textarea,select{font:inherit}
a{color:var(--accent)}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #e9d98b;outline-offset:3px}
[hidden]{display:none!important}.app{max-width:1600px;min-height:100vh;display:grid;grid-template-columns:275px 1fr;margin:auto}
.side{border-right:1px solid #3b5c46;padding:28px 22px;background:#142e23;display:flex;flex-direction:column;gap:22px}
.logo{display:flex;gap:10px;align-items:center;color:#e4f2df;font-size:1.25rem;font-weight:800;letter-spacing:.05em}
.seal{border:1px solid var(--accent);border-radius:50%;padding:3px 12px;font-size:2rem;color:var(--accent)}
.logo small{display:block;color:#afc7b0;font-weight:600;letter-spacing:.13em;font-size:.6rem}
.side h2,.side .nav-label{font-size:.69rem;letter-spacing:.15em;color:#a8c7a9;text-transform:uppercase;font-weight:850;margin:0 0 10px}
.nav{display:grid;gap:7px}.nav a{display:block;text-decoration:none;padding:11px 13px;border:1px solid #2d523c;border-radius:6px;color:#d8efce;font-size:.89rem}
.nav a:hover{background:#24523b}.side .mini{border-left:2px solid #93b993;padding-left:12px;font-size:.81rem;color:#b8ceb8}
.side footer{margin-top:auto;font-size:.75rem;color:#97ad99}
.main{min-width:0}header{padding:24px 36px;border-bottom:1px solid #34543f;background:#1b3629;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
header .crumb{font-size:.76rem;letter-spacing:.1em;color:#c0d3bf;font-weight:700}header .chip{font-size:.72rem;padding:6px 10px;border-radius:20px;background:#354d39;color:#e8efc9;font-weight:850}
.content{padding:32px clamp(18px,3vw,48px)}.kicker{text-transform:uppercase;letter-spacing:.16em;font-size:.72rem;color:#a7d4a5;font-weight:800}
h1{font:clamp(2.4rem,4.3vw,4.2rem)/1.09 Georgia,serif;letter-spacing:-.05em;margin:12px 0 18px}h1 em{font-style:normal;color:#c3e2b0}
.intro{max-width:860px;color:#c7dbca;font-size:1.08rem}
.warning{background:#373520;border:1px solid #817a4c;color:#f4e8bf;padding:15px 19px;border-radius:8px;margin:23px 0}
.panel{background:var(--panel);border:1px solid #436249;border-radius:10px;padding:22px;margin:20px 0;box-shadow:0 8px 30px #0002}
.panel h2{font-size:1.3rem;margin:0 0 14px}.auth{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:10px;align-items:end;max-width:820px}
label{display:grid;gap:6px;font-size:.84rem;color:#c7dbc7;font-weight:680}input,select,textarea{width:100%;background:#0d2419;color:#f4fff4;border:1px solid #658568;border-radius:5px;padding:11px 12px}
textarea{min-height:78px;resize:vertical}button{border:0;padding:11px 15px;border-radius:5px;font-weight:800;background:#c8e6b3;color:#10271c;cursor:pointer}
button:hover{filter:brightness(1.09)}button.secondary{background:transparent;border:1px solid #9fc1a1;color:#d4e9d0}
button:disabled{cursor:not-allowed;opacity:.45}
.row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.counter{padding:17px;background:#102b21;border:1px solid #395f45;border-radius:8px;display:grid;gap:4px}
.counter strong{font-size:1.85rem;color:#e7f5ce}.counter span{font-size:.76rem;color:#aac2ab}
.workspace{display:grid;grid-template-columns:minmax(260px,1fr) minmax(300px,1.2fr);gap:16px}
.queue{display:grid;gap:8px;max-height:560px;overflow:auto}
.ticket{text-align:left;background:#122a20;border:1px solid #365c44;color:#e5f2dd;display:grid;gap:4px;padding:13px;border-radius:6px}
.ticket strong{overflow-wrap:anywhere}.ticket small{font-size:.72rem;color:#acd1a7}
.ticket.active{background:#345338;border-color:#d6eba6}
.badge{font-size:.69rem;font-weight:900;color:var(--gold);letter-spacing:.08em}
.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.detail{border:1px solid #3e644a;border-radius:6px;background:#10281f;padding:15px}
.detail dt{font-size:.74rem;color:#a8c4a7}.detail dd{margin:0 0 9px;font-weight:650;overflow-wrap:anywhere}
.info{padding:12px;background:#233f2c;border-left:4px solid var(--accent);margin:16px 0;font-size:.9rem}
.empty{padding:23px;border:1px dashed #55775d;border-radius:6px;color:#d0e3cb}
.check{display:flex;align-items:flex-start;gap:9px;font-size:.83rem;font-weight:500}.check input{width:19px;flex:none;margin:3px 0 0}
select option{background:#19392b}.seats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.seat{background:#122c21;border-radius:7px;padding:15px;border:1px solid #426c50}.seat h3{font-size:1.04rem;margin:4px 0}.seat p{font-size:.88rem;color:#b8d0bd}
.mini-list{display:grid;gap:9px}.mini-list article{background:#10261d;border:1px solid #36563f;padding:11px;border-radius:6px;font-size:.82rem}
#message{position:fixed;bottom:18px;right:18px;background:#e1f1d0;color:#142a1c;padding:13px;border-radius:7px;box-shadow:0 12px 35px #0009;max-width:440px;z-index:30}
.privacy{font-size:.81rem;color:#b9d0bc}
@media(max-width:980px){.app{grid-template-columns:1fr}.side{border-right:none;border-bottom:1px solid #3b5c46;display:block}.side .nav{grid-template-columns:repeat(3,1fr)}.side .mini,.side footer{display:none}.workspace{grid-template-columns:1fr}.cards{grid-template-columns:repeat(2,1fr)}.content{padding:24px 18px}}
@media(max-width:550px){.auth{grid-template-columns:1fr}.side .nav{grid-template-columns:1fr 1fr}.cards,.seats,.two{grid-template-columns:1fr}header{padding:16px}.panel{padding:17px}}
</style></head><body><div class="app">
<aside class="side"><div class="logo"><div class="seal">;</div><div>JAR;VIS<small>THE STEWARDSHIP DESK</small></div></div>
<div><p class="nav-label">Work surfaces</p><nav class="nav">
<a href="#overview">◈ Field overview</a><a href="#queue">◫ Reviewer queue</a><a href="#openings">✳ Open seats</a>
<a href="https://reality.abundent.org/" target="_blank" rel="noopener noreferrer">↗ Reality 2.0</a>
<a href="https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/workboard-preview" target="_blank" rel="noopener noreferrer">↗ Workboard</a>
<a href="https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/work-inherits-reviewers" target="_blank" rel="noopener noreferrer">↗ Volunteer porch</a>
</nav></div>
<div class="mini"><strong>One desk. Separate permissions.</strong><p>This operator key is only admitted through a separate scoped triage grant. No cross-panel publication or fact verification.</p></div>
<footer>THE STATIC COLLECTIVE<br>INTEGRITY &gt; CONTINUITY</footer></aside>
<div class="main"><header><div class="crumb">THE STATIC COLLECTIVE / JAR;VIS / OPERATOR</div><span class="chip">PRIVATE · EXPLICIT GRANT REQUIRED</span></header>
<main class="content" id="overview"><p class="kicker">WORK THAT INHERITS · 003</p><h1>The house takes<br><em>attendance.</em></h1>
<p class="intro">Here is where a missing independent reviewer becomes visible work. Find the volunteers, examine possible conflicts, record a voluntary next step, and leave an inspectable return.</p>
<div class="warning"><strong>Attention is not authority.</strong> This desk does not send invitations, assign reviewers, independently verify identities, publish people, release private material, or establish completed physical work. Operator actions record claims that can be checked later.</div>
<section class="panel" id="authPanel">
<h2>Open the desk</h2><p class="privacy">Use your existing Waseca Reality 2.0 bootstrap operator capability, if you still have it. This portal checks a separately granted reviewer-triage permission. The key stays in memory only, is never saved to browser storage, and is cleared on reload.</p>
<form class="auth" id="authForm"><label>Scoped operator capability<input id="secret" type="password" autocomplete="off" spellcheck="false" placeholder="43-character key" required maxlength="43"></label><button type="submit">Unlock private queue →</button></form>
<p id="authStatus" aria-live="polite">Locked · No private data loaded.</p></section>
<section id="privateDesk" hidden>
<div class="row"><p id="grantLabel" class="privacy" style="flex:1"></p><button id="refresh" type="button" class="secondary">Refresh now</button><button id="lock" type="button" class="secondary">Lock desk</button></div>
<div id="metrics" class="cards" aria-label="Live reviewer coordination counters"></div>
<div class="workspace" id="queue">
<section class="panel"><p class="kicker">01 · ATTENTION QUEUE</p><h2>People offering help</h2>
<label>Filter<select id="filter"><option value="ALL">All active applications</option><option value="PENDING">New / pending</option><option value="SCREENING">Conflict &amp; fit review</option><option value="INVITED">Invitation recorded</option><option value="ACCEPTED">Acceptance recorded (unverified)</option><option value="DECLINED">Declined</option><option value="CLOSED">Closed</option></select></label>
<div id="tickets" class="queue" aria-live="polite"></div></section>
<section class="panel"><p class="kicker">02 · HUMAN STEWARDSHIP</p><h2>Review selected offer</h2>
<div id="caseSummary" class="empty">Select a private application from the queue.</div>
<form id="triageForm" hidden>
<label>Action<select id="decision" required></select></label>
<label>Rationale (no contact details or private history)<textarea id="reviewNote" minlength="8" maxlength="120" required placeholder="What did you check? Which concern remains?"></textarea></label>
<label class="check"><input type="checkbox" id="conflictProof"> I personally checked possible conflicts for this particular candidate.</label>
<label class="check"><input type="checkbox" id="contactProof"> I actually made the invitation outside this desk with consent. The app did not contact anyone.</label>
<label class="check"><input type="checkbox" id="acceptProof"> The applicant actually agreed to this specific invitation outside the app. This is not independent identity verification.</label>
<div class="row"><button type="submit">Record bounded decision</button></div>
</form></section></div>
<section class="panel" id="openings"><p class="kicker">03 · FIND THE MISSING PERSON</p><h2>Open volunteer and reviewer seats</h2>
<p class="privacy">These public openings are reviewed requests by the Static Collective. They are not claims that an external organization or qualified reviewer has agreed.</p><div id="seats" class="seats"></div></section>
<section class="panel"><p class="kicker">04 · APPEND-ONLY CONTEXT</p><h2>Recent stewardship receipts</h2><div id="audit" class="mini-list"></div>
<p class="privacy">Audit shows action metadata, not underlying evidence. Withdrawn application details are never served through this desk. An accepted application is not a verified review.</p></section>
</section></main></div></div>
<div id="message" hidden role="status"></div>
<script>
"use strict";
const $=id=>document.getElementById(id);
let key="",state=null,currentId=null,timer;
function el(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;}
function msg(t){$("message").textContent=t;$("message").hidden=false;clearTimeout(timer);timer=setTimeout(()=>$("message").hidden=true,7500);}
function lock(){
 key="";state=null;currentId=null;$("secret").value="";$("privateDesk").hidden=true;$("authPanel").hidden=false;
 $("authStatus").textContent="Locked · No private data loaded."; $("caseSummary").replaceChildren(el("p","Select a private application from the queue."));$("triageForm").hidden=true;
}
async function call(body){
 if(!key)throw Error("Desk is locked.");
 const response=await fetch(location.pathname,{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+key},body:JSON.stringify(body),cache:"no-store"});
 let result;try{result=await response.json()}catch{throw Error("Invalid server response");}
 if(!response.ok)throw Error(result.error||"Not authorized");
 return result;
}
async function reload(){
 state=await call({action:"list"});
 if(state.schema!=="jarvis/reviewer-operator-003")throw Error("Unsupported private queue version");
 render();
}
function renderCounters(){
 const c=state.counters;const fields=[["pending","New offers"],["screening","Under review"],["invited","Invitations recorded"],["acceptedUnverified","Acceptances (unverified)"]];
 $("metrics").replaceChildren(...fields.map(([k,t])=>{const card=el("article","","counter");card.append(el("strong",c[k]),el("span",t));return card;}));
}
function displayTicket(r){
 const btn=el("button","","ticket"+(r.id===currentId?" active":""));btn.type="button";
 btn.append(el("span",r.status.replaceAll("_"," "), "badge"),
 el("strong",r.alias+" · "+r.capability),el("small",r.region+" · "+r.availability));
 btn.addEventListener("click",()=>{currentId=r.id;render();});
 return btn;
}
function renderTickets(){
 const chosen=$("filter").value;
 const entries=state.applications.filter(r=>chosen==="ALL"||r.status===chosen);
 $("tickets").replaceChildren(...(entries.length?entries.map(displayTicket):[el("div","No applications in this lane. Finding willing reviewers is itself the next useful work.","empty")]));
}
function detailItem(dl,name,value){dl.append(el("dt",name),el("dd",value??"—"));}
function renderCase(){
 const r=state.applications.find(x=>x.id===currentId);
 $("triageForm").hidden=!r;
 if(!r){$("caseSummary").replaceChildren(el("p","Select a person to see their private, consented application."));return;}
 const dl=el("dl","","detail");
 for(const [label,value] of [
  ["Applicant alias",r.alias],["Private contact",r.contact_consent?r.email||"No email given":"No contact permission"],
  ["Proposed role",r.role],["Skill",r.capability],["General region",r.region],
  ["Availability",r.availability],["Conflict self-disclosure",r.independence],
  ["Operator conflict finding",r.conflict_disposition],["Current stage",r.status],
  ["Applicant's voluntary note",r.explanation||"—"],["Prior operator note",r.triage_note||"—"],
  ["Evidence status","Never independently verified here"]
 ])detailItem(dl,label,value);
 $("caseSummary").replaceChildren(dl);
 const options={
  PENDING:[["start","Begin screening"],["decline","Decline without assignment"]],
  SCREENING:[["conflict_clear","Record no known conflict after checking"],["conflict_hold","Place conflict on HOLD"],["invite","Record invitation actually sent"],["decline","Decline"]],
  INVITED:[["accept","Record applicant's explicit acceptance"],["decline","Decline"]],
  ACCEPTED:[["close","Close candidate coordination"],["decline","Withdraw from consideration"]],
  DECLINED:[["close","Archive declined coordination"]],
  CLOSED:[]
 }[r.status]||[];
 $("decision").replaceChildren(...options.map(([v,t])=>{const x=el("option",t);x.value=v;return x;}));
 $("triageForm").hidden=options.length===0;
 $("reviewNote").value="";$("conflictProof").checked=false;$("contactProof").checked=false;$("acceptProof").checked=false;
}
function renderSeats(){
 $("seats").replaceChildren(...(state.seats.length?state.seats.map(s=>{
  const card=el("article","","seat");
  card.append(el("span",s.status+" · "+s.role+" · "+s.reviewer_expertise,"badge"),el("h3",s.title),el("p",s.purpose),
  el("small",s.region+" · Public: "+(s.publication_approved?"Approved":"No")));
  return card;}):[el("p","No currently configured roles.","empty")]));
}
function renderAudit(){
 $("audit").replaceChildren(...(state.events.length?state.events.map(x=>{
  const c=el("article");c.append(el("strong",x.action),el("div",x.created_at+" · "+x.actor));return c;}):[el("p","No reviewer stewardship transitions recorded yet.","empty")]));
}
function render(){
 renderCounters();renderTickets();renderCase();renderSeats();renderAudit();
 if(state.truncated)msg("Queue has 100 records. Use scoped paging before relying on a complete listing.");
}
$("authForm").addEventListener("submit",async(e)=>{
 e.preventDefault();const s=$("secret").value.trim();if(!/^[A-Za-z0-9_-]{43}$/.test(s)){msg("Expected a 43-character capability.");return;}
 key=s;$("secret").value="";try{
  const me=await call({action:"me"});$("grantLabel").textContent=me.display+" · "+me.scope+" · Expires: "+me.expiresAt;
  await reload();$("privateDesk").hidden=false;$("authPanel").hidden=true;msg("Private scoped operator desk unlocked.");}
 catch(err){lock();msg("Not unlocked: "+err.message);}
});
$("filter").addEventListener("change",()=>renderTickets());
$("refresh").addEventListener("click",async()=>{try{await reload();msg("Private queue refreshed.");}catch(e){msg(e.message);}});
$("lock").addEventListener("click",()=>{lock();msg("Locked. Local capability cleared.");});
$("triageForm").addEventListener("submit",async(e)=>{
 e.preventDefault();const r=state?.applications.find(x=>x.id===currentId);if(!r)return;
 const decision=$("decision").value;if(!decision)return;
 const payload={action:"triage",id:r.id,decision,note:$("reviewNote").value,
  conflictCheckConfirmed:$("conflictProof").checked,humanContactConfirmed:$("contactProof").checked,
  humanConsentConfirmed:$("acceptProof").checked};
 try{const x=await call(payload);await reload();msg(x.reminder||"Bounded decision recorded.");
 }catch(err){msg("Not recorded: "+err.message);}
});
</script></body></html>`;