// BRAIN-006 · Read-only public program memory. No personal story entry, tracking,
// local storage, or external calls. Source links are curated by the local server.
const field=document.getElementById("community-brain");
const select=document.getElementById("brain-focus");
const grid=document.getElementById("brain-cards");
const status=document.getElementById("brain-status");
const refs=document.getElementById("brain-sources");
const el=(tag,text="",className="")=>{
  const node=document.createElement(tag);
  node.textContent=text;
  if(className)node.className=className;
  return node;
};
let current=0;
async function renderBrain(){
  const seq=++current;
  const focus=select.value;
  if(!["start","legal","support","safety","moderate","documents","volunteer"].includes(focus))return;
  status.textContent="Reading public, unfilled capability needs…";
  grid.replaceChildren();
  refs.replaceChildren();
  try{
    const response=await fetch("/api/brain?focus="+encodeURIComponent(focus),{cache:"no-store",credentials:"same-origin"});
    if(!response.ok)throw new Error("Public brain snapshot unavailable");
    const data=await response.json();
    if(seq!==current)return;
    if(data.schema!=="jarvis.community-brain/v1"||data.phase!=="INDEPENDENT_PROTOTYPE_UNSTAFFED"||
       !Array.isArray(data.next)||!Array.isArray(data.sources))throw new Error("Untrusted brain format");
    for(const item of data.next){
      const article=el("article","","brain-card");
      article.append(el("span",item.category+" · "+item.status,"brain-label"),
        el("h3",item.title),
        el("p",item.blocker));
      const trial=el("p","","brain-trial");
      trial.append(el("strong","Small first move: "),document.createTextNode(item.safeFirst));
      article.append(trial);
      const gate=el("p","","brain-gate");
      gate.append(el("strong","Permission gate: "),document.createTextNode(item.authority));
      article.append(gate);
      article.append(el("p","Do not: "+item.prohibited,"brain-boundary"));
      grid.append(article);
    }
    for(const source of data.sources){
      if(!/^https:\/\/(?:github\.com\/the-static-collective\/webZ\/pull\/\d+|(?:www\.)?cadamn\.org\/|legalcorps\.org\/nonprofit-organizations\/|www\.smrls\.org\/legal-services)$/.test(source.url))continue;
      const a=el("a",source.id+" · "+source.kind,"brain-ref");
      a.href=source.url;a.target="_blank";a.rel="noopener noreferrer";a.referrerPolicy="no-referrer";
      refs.append(a);
    }
    status.textContent=data.next.length+" public design need(s) · no one appointed · no live survivor support · no case records.";
  }catch(err){
    if(seq!==current)return;
    status.textContent="Source-scoped public brain unavailable. Do not infer that any role is filled.";
  }
}
select.addEventListener("change",()=>void renderBrain());
if(field)void renderBrain();
