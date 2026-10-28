import {createHash} from "node:crypto";
const issue=/^https:\/\/github\.com\/the-static-collective\/[\w.-]+\/issues\/[1-9]\d*$/;
const privatePattern=/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d ().-]{8,}\d|\b(?:street address|shelter address|home address|apartment|account number|case number)\b|\b\d{1,5}\s+\w+\s+(?:st|street|ave|avenue|road|rd|drive|dr|lane|ln)\b)/i;
export function makePlanReturn(r,summary,{redacted,at}={}){
 if(!r?.planOrigin||!issue.test(r.planOrigin.issueUrl??"")||! /^[a-f0-9]{64}$/.test(r.planOrigin.sourceSha256??"")||
 !/^ATTENTION-\d{4}-\d{2}-\d{2}-\d{3}$/.test(r.planOrigin.edition??""))
 throw Error("HOLD: source-owned plan origin missing");
 if(r.report?.outcome!=="completed"||r.review?.decision!=="accept-report"||r.capability?.status!=="CANDIDATE_ONLY"||r.capability?.verified!==false)
 throw Error("HOLD: local completed-report/review/candidate gates missing");
 if(redacted!==true)throw Error("Operator redaction attestation required");
 if(typeof summary!=="string"||summary.trim().length<30||summary.length>220)throw Error("Public summary must be 30–220 characters");
 const s=summary.trim().replace(/\s+/g," ");
 if(privatePattern.test(s)||/https?:\/\//.test(s))throw Error("HOLD: potential private details");
 if(typeof at!=="string"||! /^\d{4}-\d{2}-\d{2}T/.test(at))throw Error("Invalid preparation time");
 const basis={planId:r.planOrigin.planId,sourceIssue:r.planOrigin.issueUrl,
  sourceEdition:r.planOrigin.edition,sourceSha256:r.planOrigin.sourceSha256,
  weaveId:r.id,publicMethodCandidate:s};
 return {schema:"planz.return-candidate/v0",candidateId:"planz-return-v0:"+
   createHash("sha256").update("PLANZ-RETURN-001|"+JSON.stringify(basis)).digest("hex"),
  ...basis,preparedAt:at,localReport:"COMPLETED_REPORTED_UNVERIFIED",
  review:"SECOND_ALIAS_REVIEW_ASSERTED_NOT_AUTHENTICATED",
  disposition:"HOLD_FOR_OWNER_REVIEW",fieldVerified:false,sourceOwnerApproved:false,
  recipientConfirmed:false,sentExternally:false,authority:"NONE",
  notice:"Unverified local candidate. No personal notes, aliases or evidence exported."};
}
