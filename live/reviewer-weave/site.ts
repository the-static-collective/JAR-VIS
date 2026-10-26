export const SITE = String.raw\`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tomorrow's Work — The Static Collective</title>
<meta name="description" content="Help build the work that tomorrow inherits. Volunteer as an independent-review candidate, steward, or connector.">
<style>
:root{--bg:#f7f3e8;--ink:#173528;--deep:#163d31;--gold:#e3bd66;--sage:#d8e7d2;--line:#c1cfc0;--muted:#52705a;--white:#fffdf5}
*{box-sizing:border-box}body{margin:0;font:16px/1.52 system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:var(--bg)}
a{color:#245f47}button,input,textarea,select{font:inherit}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #b76935;outline-offset:3px}
.wrap{width:min(1100px,calc(100% - 36px));margin:auto}
header{background:var(--deep);color:#f7f8e5;padding:20px 0 50px;position:relative;overflow:hidden}
header:after{content:"";position:absolute;right:-145px;top:-190px;width:490px;height:490px;border:2px solid #ffffff26;border-radius:50%;box-shadow:0 0 0 80px #ffffff09,0 0 0 160px #ffffff07;pointer-events:none}
nav{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;position:relative;z-index:1}nav a{color:#edf5df;text-decoration:none;font-size:.85rem;font-weight:700}nav b{letter-spacing:.12em}
header h1{font:clamp(3rem,8vw,6.5rem)/.99 Georgia,serif;letter-spacing:-.064em;margin:72px 0 14px;position:relative;z-index:1;max-width:850px}
header h1 em{color:#cee7bd;font-style:normal}.lead{font-size:1.2rem;max-width:730px;color:#e1efda;position:relative;z-index:1}
.ribbon{display:flex;flex-wrap:wrap;gap:8px;margin-top:25px}.ribbon span{display:inline-block;border:1px solid #a7d0ab;padding:7px 11px;border-radius:22px;font-size:.82rem;font-weight:750}
main section{padding:42px 0}.kicker{text-transform:uppercase;font-size:.74rem;letter-spacing:.14em;font-weight:900;color:#a65b2e}
h2{font:clamp(2rem,5vw,3.1rem)/1.09 Georgia,serif;letter-spacing:-.035em;margin:10px 0 16px}
.rail{padding:17px 21px;background:#ffefc8;border-left:5px solid #ac6236;margin-top:-24px;position:relative}
section.intro{padding:24px 0}.sub{font-size:1.05rem;max-width:760px;color:#405e4d}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.card{border:2px solid var(--line);background:var(--white);padding:20px;border-radius:7px;min-height:215px;display:flex;flex-direction:column}
.card:hover{border-color:#638f6a}.card.selected{border-color:#2a6143;box-shadow:inset 0 0 0 1px #2a6143;background:#ecf3e6}
.card small{font-size:.74rem;font-weight:900;color:#a65b2e;letter-spacing:.1em}
.card h3{font:1.47rem Georgia,serif;margin:7px 0}.card p{font-size:.88rem;color:#48604d;flex:1}
.card button{align-self:flex-start;border:1px solid var(--deep);background:var(--deep);color:#fff;padding:8px 12px;border-radius:4px;cursor:pointer;font-weight:800}
.card button:hover,.btn:hover{filter:brightness(1.09)}
.status{padding:12px 14px;background:#e4ecda;border:1px solid var(--line);margin-top:15px}
.form-panel{background:white;padding:27px;border:2px solid #9fbaa1;max-width:870px}
label{display:block;font-weight:750;margin:13px 0 5px}input,textarea,select{display:block;width:100%;background:#fffefb;color:var(--ink);padding:11px 12px;border:1px solid #95b09c;border-radius:4px}textarea{min-height:82px;resize:vertical}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.check{display:flex;align-items:flex-start;gap:10px;font-weight:500;max-width:710px}.check input{width:20px;height:20px;flex-shrink:0;margin-top:3px;accent-color:#2f684b}
.btn{background:var(--deep);color:#fff;font-weight:800;padding:12px 17px;border:0;border-radius:4px;cursor:pointer}.btn.alt{background:#edd58e;color:var(--ink)}
aside{font-size:.86rem;color:#4b6452}#receipt{background:#e6f2dd;border-left:5px solid #3c8057;padding:18px;overflow-wrap:anywhere}
#receipt code{display:block;font:13px/1.5 ui-monospace,monospace;overflow-wrap:anywhere;margin:8px 0}
[hidden]{display:none!important}.muted{color:#526d58}.fine{font-size:.78rem}
footer{background:#133629;color:#e5f1de;padding:25px 0;font-size:.8rem}
footer a{color:#e8ce80}
@media(max-width:700px){.grid,.pair{grid-template-columns:1fr}header h1{margin-top:48px}.form-panel{padding:17px}main section{padding:30px 0}}
</style></head>
<body>
<header><div class="wrap"><nav><a href="https://abundent.org/"><b>THE STATIC COLLECTIVE</b> / ABUNDENT ↗</a><a href="https://github.com/the-static-collective/JAR-VIS/issues/16" target="_blank" rel="noopener">Open work plan ↗</a></nav>
<h1>Make tomorrow's<br><em>work better.</em></h1>
<p class="lead">A need becomes an invitation. A steward chooses to help. Somebody independent checks what we learned. The next person inherits a better starting point.</p>
<div class="ribbon"><span>WEAVE</span><span>VOLUNTARY COMMITMENT</span><span>REPORT</span><span>REVIEW</span><span>WE CAN → YOU CAN</span></div>
</div></header>
<main>
<div class="wrap"><p class="rail"><strong>Public experiment, real opt-in.</strong> These are open invitations from the Static Collective—not promises from churches, food shelves, farmers, or other organizations. Nobody listed here has automatically volunteered. An application is not acceptance, verification, assignment, or permission to act.</p></div>
<section class="intro"><div class="wrap"><p class="kicker">01 / Discover the needed reviewer</p><h2>The missing person is part of the task.</h2>
<p class="sub">Sometimes the next useful job is simply finding a trustworthy person who can review the work. That work belongs in the same process as delivery, not in a separate bureaucracy.</p>
<div id="seats" class="grid" aria-live="polite"></div><p id="loadStatus" class="status" role="status">Loading reviewed public invitations…</p></div></section>
<section style="background:#e6ecde" id="participate"><div class="wrap"><p class="kicker">02 / Volunteer by choice</p><h2>Choose a small piece of care.</h2>
<div class="form-panel">
<p id="chosen" class="status">Choose an invitation above to begin.</p>
<form id="joinForm" hidden>
<label for="alias">Name or working alias <span class="fine">(never public automatically)</span></label><input id="alias" name="alias" maxlength="70" minlength="2" autocomplete="nickname" required>
<div class="pair"><div><label for="capability">Where can you help?</label><select id="capability" name="capability"><option value="process">Process / decisions</option><option value="evidence">Evidence / careful records</option><option value="logistics">Logistics / safety of delivery</option><option value="privacy">Privacy / safeguarding</option><option value="community">Connection / outreach</option><option value="safety">Safety / risk review</option></select></div>
<div><label for="availability">What commitment is comfortable?</label><select name="availability"><option value="one_time">One bounded review</option><option value="flexible">Flexible / ask first</option><option value="weekly">Potentially weekly</option></select></div></div>
<div class="pair"><div><label for="region">General region only</label><input name="region" maxlength="80" minlength="3" placeholder="Southern Minnesota or remote" required></div>
<div><label for="independence">Any connection to the work or people?</label><select name="independence"><option value="unsure">Not sure — let's discuss</option><option value="no_known_conflict">No known conflict (self-report)</option><option value="possible_conflict">There may be a conflict</option></select></div></div>
<label for="explanation">What would help us place you? <span class="fine">(optional, no personal stories)</span></label>
<textarea id="explanation" name="explanation" maxlength="280" placeholder="For example: I can review a short checklist and give concrete corrections."></textarea>
<label for="email">Email for an invitation <span class="fine">(optional; private, never listed)</span></label><input id="email" name="email" type="email" maxlength="200" autocomplete="email" placeholder="Only if you want us to be able to reply">
<label class="check"><input name="contactConsent" type="checkbox"> If I include email, I agree to be contacted about this application. No newsletter signup.</label>
<label class="check"><input name="reviewConsent" type="checkbox" required> I voluntarily submit this for private human review. I understand it remains pending and is not a commitment or verified qualification.</label>
<div style="display:none"><label>Website (leave empty)<input name="website" tabindex="-1" autocomplete="off"></label></div>
<p class="fine">Please do not include addresses, survivor histories, legal evidence, private third-party names, health details or sensitive records. We do not publish applicants, and no one is automatically assigned a job.</p>
<button type="submit" class="btn">Offer to help →</button><p id="feedback" role="status"></p>
</form><div id="receipt" hidden aria-live="polite"></div>
</div></div></section>
<section id="withdraw"><div class="wrap"><p class="kicker">03 / The door also opens out</p><h2>Change your mind freely.</h2>
<p class="sub">If you saved your receipt ID and withdrawal key, you can withdraw your application. The application alias, contact and voluntary explanation are cleared; a minimal audit record remains.</p>
<form id="withdrawForm" style="max-width:580px"><label>Receipt ID<input name="id" required placeholder="UUID from receipt"></label><label>Withdrawal key<input name="withdrawKey" required placeholder="Private code from receipt"></label><button class="btn alt" type="submit">Withdraw my application</button><p id="withdrawFeedback" role="status"></p></form>
</div></section>
</main><footer><div class="wrap">Integrity &gt; Continuity. Review is not automatically proof. <a href="https://github.com/the-static-collective/JAR-VIS/issues/16">See the public build record ↗</a></div></footer>
<script>
"use strict";
const $=(id)=>document.getElementById(id);let selected=null,openSeats=[];
function message(id,s){$(id).textContent=s;}
function cell(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
function choose(seat){
 selected=seat;$("joinForm").hidden=false;$("receipt").hidden=true;
 message("chosen","Volunteering for: "+seat.title+" · "+seat.role.toUpperCase()+". Application remains private and pending.");
 $("participate").scrollIntoView({behavior:"smooth",block:"start"});
}
async function load(){
 try{
 const res=await fetch("?format=seats",{cache:"no-store"});if(!res.ok)throw Error("Network error");
 const j=await res.json();if(j.schema!=="jarvis/public-reviewer-seats/v1")throw Error("Unexpected data");
 openSeats=j.seats||[];$("seats").replaceChildren();
 for(const s of openSeats){
  const card=cell("article","");card.className="card";
  card.append(cell("small",s.role.toUpperCase()+" / "+s.reviewer_expertise.toUpperCase()+" / "+s.region),cell("h3",s.title),cell("p",s.purpose));
  const btn=cell("button","I might help →");btn.type="button";btn.addEventListener("click",()=>choose(s));card.append(btn);$("seats").append(card);
 }
 message("loadStatus",openSeats.length+" open roles · all candidates screened individually · no verified reviewers yet.");
 }catch(e){message("loadStatus","The live role board is temporarily unavailable. Please use the GitHub work plan above.");}
}
async function post(data){
 const res=await fetch(location.pathname,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
 const j=await res.json();if(!res.ok)throw Error(j.error||"Could not save");return j;
}
$("joinForm").addEventListener("submit",async(e)=>{
 e.preventDefault();if(!selected)return;
 const data=Object.fromEntries(new FormData(e.currentTarget).entries());
 const payload={action:"join",seatId:selected.id,role:selected.role,
 alias:data.alias,capability:data.capability,region:data.region,availability:data.availability,
 independence:data.independence,explanation:data.explanation||"",email:data.email||"",
 contactConsent:data.contactConsent==="on",reviewConsent:data.reviewConsent==="on",website:data.website||""};
 try{message("feedback","Submitting privately…");const j=await post(payload);
  $("receipt").hidden=false;$("receipt").replaceChildren(
   cell("strong","Recorded privately. Still PENDING."),
   cell("p","Receipt ID (save it):"),cell("code",j.receipt.id),
   cell("p","Private withdrawal key (save now; shown once):"),cell("code",j.withdrawKey),
   cell("p","There is no automatic acceptance, public listing, or contact guarantee."));
  e.currentTarget.reset();e.currentTarget.hidden=true;message("feedback","Saved. Keep the withdrawal code.");
 }catch(err){message("feedback","Not saved: "+err.message);}
});
$("withdrawForm").addEventListener("submit",async(e)=>{
 e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget).entries());
 try{const j=await post({action:"withdraw",id:data.id,withdrawKey:data.withdrawKey});
 message("withdrawFeedback",j.note||"Withdrawn.");e.currentTarget.reset();}
 catch(err){message("withdrawFeedback","Could not withdraw: "+err.message);}
});
load();
</script></body></html>\`;