// BOUNDARY-INHABITATION-001 / Source-owned deterministic perspective adapter.
// Makes invitations, not matches. Pure and portable: no IO, identities,
// recipient lookup, mutable roster, contact, firmware or device commands.
import { createHash } from "node:crypto";

export const SCHEMA = "jarvis.boundary-inhabitation/v1";
export const BUS_CASE = Object.freeze({
  schema: "jarvis.boundary-problem/v1",
  label: "A Southern Minnesota bus needs an ECM repair path",
  region: "Southern Minnesota",
  reportedFacts: [
    "Owner reports a failed engine control module on a 2008 International BE200 with a 6.4L MaxxForce 7.",
    "The precise original ECM label and approved replacements are not yet verified.",
    "No programming interface loan, donor transfer or completed repair is established."
  ],
  requestedOutcome: "A safe, technically supported ECM replacement path; a running bus remains unverified.",
  resourceNeeds: [
    {
      id: "possible-ecm",
      label: "A potentially compatible salvage engine control module",
      mode: "permanent-transfer",
      verification: [
        "Record exact donor ECM label/part number and relevant hardware revision.",
        "Verify fitment, controls, calibration, immobilizer and service requirements against the actual bus.",
        "Have a qualified technician determine whether the replacement and firmware plan are safe."
      ],
      potentialHolder: "Someone with an unused Navistar/International module or a retired vehicle",
      reversibleFirstStep: "Ask for non-sensitive photos/transcription of the ECM part label before any removal or shipment.",
      offerSubject: "BUS ECM — POSSIBLE ECM"
    },
    {
      id: "interface-access",
      label: "Temporary access to a suitable RP1210 vehicle interface",
      mode: "temporary-loan",
      verification: [
        "Confirm exact interface model and licensed driver/software compatibility.",
        "Confirm vehicle/bench cable, connector, protocol and stable power requirements.",
        "Agree on loan timing, custody, responsible handling and return before possession changes."
      ],
      potentialHolder: "A mechanic, shop, fleet, or individual with an idle compliant diagnostic interface",
      reversibleFirstStep: "Ask which adapter and cables are actually available; loan is an invitation, not an entitlement.",
      offerSubject: "BUS ECM — RP1210 TOOL LOAN"
    }
  ],
  supportingExpertise: {
    label: "Independent diesel ECM fitment and programming verification",
    status: "NOT_YET_CONFIRMED",
    offerSubject: "BUS ECM — COMPATIBILITY KNOW-HOW"
  },
  publication: "https://abundent.org/paper/001/",
  sourceStatus: "OWNER_REPORTED_NOT_INDEPENDENTLY_VERIFIED"
});

const MODE = new Set(["permanent-transfer", "temporary-loan"]);
const expect = (ok, code) => { if (!ok) throw new TypeError(code); };
const canonical = value => JSON.stringify(value, (_, x) => x && !Array.isArray(x) && typeof x === "object"
  ? Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b,"en"))) : x);
const digest = x => createHash("sha256").update("JARVIS-BOUNDARY-001|"+canonical(x)).digest("hex");
function validate(problem){
  expect(problem && typeof problem==="object" && !Array.isArray(problem) &&
    problem.schema==="jarvis.boundary-problem/v1", "INVALID_PROBLEM");
  expect(typeof problem.requestedOutcome==="string" && problem.requestedOutcome.length > 8,
    "OUTCOME_REQUIRED");
  expect(Array.isArray(problem.resourceNeeds) && problem.resourceNeeds.length>=1 &&
    problem.resourceNeeds.length<=6,"RESOURCE_BUDGET");
  const ids=new Set();
  for(const x of problem.resourceNeeds){
    expect(x && typeof x.id==="string" && /^[a-z0-9-]{2,48}$/.test(x.id) && !ids.has(x.id),
      "UNIQUE_RESOURCE_ID_REQUIRED");ids.add(x.id);
    expect(MODE.has(x.mode),"UNKNOWN_CROSSING_TYPE");
    for(const key of ["label","potentialHolder","reversibleFirstStep"]){
      expect(typeof x[key]==="string" && x[key].length>3 && x[key].length<=380,
        "INVALID_RESOURCE_DETAIL");
    }
    expect(Array.isArray(x.verification)&&x.verification.length>=1&&x.verification.length<=6 &&
      x.verification.every(v=>typeof v==="string"&&v.length>=15&&v.length<=300),
      "VERIFICATION_REQUIRED");
  }
  return problem;
}
export function inhabitBoundary(problem=BUS_CASE) {
  validate(problem);
  const crossings=problem.resourceNeeds.map((r,index)=>{
    const isLoan=r.mode==="temporary-loan";
    return {
      schema:"jarvis.boundary-crossing-proposal/v1",
      ordinal:index+1,
      id:r.id,
      object:r.label,
      transferMode:r.mode,
      viewpoints:[
        {position:"need-holder",question:"Which precise property of "+r.label.toLowerCase()+" is required, and what would count as a genuine solution?"},
        {position:"resource",question:"Where might this resource already exist without currently being useful?"},
        {position:"possible-custodian",question:"Would "+r.potentialHolder.toLowerCase()+" want to discuss "+(isLoan?"lending access":"an optional transfer")+"? What costs, time or risks would matter to them?"},
        {position:"crossing",question:isLoan?
          "Who holds the tool, for how long, under what care and return conditions?":
          "Who owns the part, is it theirs to give, and who assumes removal, shipping and fitment responsibility?"}
      ],
      requiredEvidence:r.verification.slice(),
      nextHumanQuestion:r.reversibleFirstStep,
      nextMessageSubject:r.offerSubject??null,
      knownDonorFound:false,
      compatible:false,
      loanAgreed:false,
      authorization:"NONE",
      permittedEffect:"PROPOSE_ONLY"
    };
  });
  const result={
    schema:SCHEMA,
    problem:problem.label,
    requestedOutcome:problem.requestedOutcome,
    sourceStatus:problem.sourceStatus,
    crossings,
    reversibility:"Questions first; no equipment moves or software writes without separate reviewed agreement.",
    supportingExpertise:problem.supportingExpertise??null,
    publication:problem.publication??null,
    outcomes:{donorsConfirmed:0,toolsLoaned:0,repairComplete:false},
    claims:{autonomousMatching:false,voluntaryOfferRequired:true,partCompatibilityProven:false,publicationApproved:false},
    mode:"DETERMINISTIC_PROPOSAL_ONLY",
    executionAuthorized:false
  };
  return {...result,planId:"boundary-plan:"+digest(result)};
}
