// BUS-FIELD-SCOUT-002 — public, source-linked possibilities; not donor claims.
// Immutable candidates collected from first-party business websites, 2026-10-31.
import { inhabitBoundary, BUS_CASE } from "./boundary-inhabitation.mjs";
import { createHash } from "node:crypto";
export const FIELD_LEADS = Object.freeze([
  {
    id:"navistar-mankato",name:"North Central International — North Mankato",
    role:"technical-verification", resourceId:"possible-ecm",
    source:"https://www.northcentralintl.com/parts-contacts-and-locations.htm",
    phone:"507-625-2030",contact:"parts department",region:"North Mankato, Minnesota",
    reason:"International/IC Bus commercial dealer network and source-backed parts contact. Ask for official VIN-specific ECM cross-reference and SID903 identification. No donation presumed."
  },
  {
    id:"misgen-ellendale",name:"Misgen Auto Parts",
    role:"possible-salvage",resourceId:"possible-ecm",
    source:"https://www.misgen.com/",phone:"507-684-2100",contact:"info@misgen.com",
    region:"Ellendale, Minnesota",
    reason:"Auto recycler with used-vehicle parts inventory. Ask only for a labeled donor ECM lead; no compatible unit or donated stock is confirmed."
  },
  {
    id:"manders-lakeville",name:"Manders Diesel",
    role:"possible-salvage",resourceId:"possible-ecm",
    source:"https://mandersdiesel.com/contact/",phone:"952-469-1800",contact:"info@mandersdiesel.com",
    region:"Lakeville, Minnesota",
    reason:"Heavy truck salvage and used-parts seller whose inventory includes International trucks. Ask whether a correct labeled part exists or can be located; pricing/donation is unconfirmed."
  },
  {
    id:"streamline-faribault",name:"Streamline Onsite Repair",
    role:"tool-and-expertise",resourceId:"interface-access",
    source:"https://streamlineonsiterepair.com/",phone:"507-210-6499",contact:"phone",
    region:"Faribault, Minnesota",
    reason:"Advertises school-bus/International diesel electrical diagnostics. Ask if they know a compatible J1708/J1939 RP1210 interface, whether safe programming service or a voluntary loan is possible. Neither is offered or confirmed."
  }
]);
const ALLOWED = new Set(["possible-salvage","technical-verification","tool-and-expertise"]);
export function compileFieldScout(problem=BUS_CASE, leads=FIELD_LEADS){
  const plan=inhabitBoundary(problem);
  if(!Array.isArray(leads)||leads.length>20)throw TypeError("LEAD_LIMIT");
  const ids=new Set();
  const entries=leads.map((lead)=>{
    if(!lead||typeof lead!=="object"||ids.has(lead.id)||
      !/^[a-z0-9-]{4,48}$/.test(lead.id??"")||
      !ALLOWED.has(lead.role)||
      !plan.crossings.some(c=>c.id===lead.resourceId)||
      !/^https:\/\/[a-z0-9.-]+\//.test(lead.source??"")||
      !["name","reason","region","contact","phone"].every(k=>typeof lead[k]==="string"&&lead[k].length>2&&lead[k].length<420)
    )throw TypeError("INVALID_SOURCED_FIELD_LEAD");
    ids.add(lead.id);
    const crossing=plan.crossings.find(c=>c.id===lead.resourceId);
    return {
      id:lead.id,name:lead.name,role:lead.role,resourceId:lead.resourceId,
      source:lead.source,phone:lead.phone,contact:lead.contact,region:lead.region,
      reason:lead.reason,
      ask:lead.role==="technical-verification"?
        "Can you check the correct Navistar ECM part-number family and SID903 marking for a 2008 MaxxForce 7 V8, and advise what information is needed privately for a VIN-based lookup?":
        lead.role==="possible-salvage"?
        "Do you know of a labeled Navistar/International 2008 MaxxForce 7 V8 ECM in a retired vehicle? May we check the hardware label before discussing availability, terms or removal?":
        "Could you advise what RP1210 interface and cables genuinely support this Navistar ECM's J1708/J1939 programming sequence, and whether you know of a voluntary short-term loan or accessible service?",
      firstVerification:crossing.nextHumanQuestion,
      status:"UNCONTACTED",
      actualDonor:false,actualLoan:false,confirmedCompatible:false,
      sourceIsInventoryEvidence:false,permissionToSend:false,
      nextAction:"HUMAN_MAY_REVIEW_AND_CONTACT_INDIVIDUALLY"
    };
  }).sort((a,b)=>a.id.localeCompare(b.id));
  const body={schema:"jarvis.bus-field-scout/v1",boundaryPlanId:plan.planId,
    sourceStatus:"PUBLIC_CONTACT_LEADS_UNCONTACTED",
    entries,knownECMsAvailable:0,knownInterfacesLoanable:0,contactsSent:0,
    acceptedOffers:0,repairsCompleted:0,mode:"READ_ONLY_RESEARCH"};
  const hash=createHash("sha256").update(JSON.stringify(body)).digest("hex");
  return {...body,scoutId:"field-scout:"+hash};
}
