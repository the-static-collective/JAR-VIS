import {createHash} from "node:crypto";
// BRIDGE-005: strict, PUBLIC-ONLY candidate imported from a user-supplied file.
// The operator's encrypted journal and human notes must NEVER be imported.
export const BRIDGE_SOURCE_COMMIT="27c280d5297e593512d85eb3c83d74904856cfdf";
const SOURCE_URL="https://github.com/the-static-collective/webZ/blob/"+BRIDGE_SOURCE_COMMIT+"/bridge/network/model.mjs";
const DOORS=new Set(["mit-solve","rochester-task-force","rochester-grant","cities-deliver","code-for-america","bloom","igh","dpga","umn-extension","voqal","arts-midwest","unitac","nexus","foss-backstage","ncoa","anderson","state-net","levitt","osm","ocx","mn-housing","open-referral","civic-alliance"]);
const ACTIONS=Object.freeze({
 VERIFY_ELIGIBILITY:"Verify official source, application window and applicant qualifications.",
 ASK_LOCAL_PERMISSION:"Ask one authorized human whether a bounded review is wanted.",
 PREPARE_SYNTHETIC_DEMO:"Prepare a single source-pinned, synthetic, public-safe demonstration.",
 REQUEST_CRITIQUE:"Prepare an unsent request for critique; do not send without permission."
});
const KEYS=["schema","sourceCommit","sourceUrl","snapshot","doorId","target","actionCode","classification","manualExport","externalContact","applicationSubmitted","receiverAdmitted","fieldVerified","authority","candidateId"];
export function parseBridgeFile(buffer){
 if(!Buffer.isBuffer(buffer)&&!(buffer instanceof Uint8Array))throw Error("HOLD_INVALID_INPUT");
 if(buffer.byteLength>3000||buffer.byteLength<80)throw Error("HOLD_PACKET_SIZE");
 try{return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(buffer))}
 catch{throw Error("HOLD_INVALID_JSON")}
}
export function validateBridgeWork(p,target){
 if(!p||typeof p!=="object"||Array.isArray(p)||
 Object.keys(p).sort().join("|")!==KEYS.slice().sort().join("|"))throw Error("HOLD_UNKNOWN_FIELDS");
 if(!DOORS.has(p.doorId)||!Object.hasOwn(ACTIONS,p.actionCode)||!["JARVIS","PLANZ"].includes(p.target)||p.target!==target)throw Error("HOLD_UNKNOWN_ROUTE");
 const body={
 schema:"abundent.bridge-work-card/v1",sourceCommit:BRIDGE_SOURCE_COMMIT,sourceUrl:SOURCE_URL,
 snapshot:"BRIDGE-NETWORK-003/2026-10-28",doorId:p.doorId,target,actionCode:p.actionCode,
 classification:"PUBLIC_ONLY_HOLD_FOR_LOCAL_REVIEW",manualExport:true,
 externalContact:false,applicationSubmitted:false,receiverAdmitted:false,
 fieldVerified:false,authority:"NONE"
 };
 const expected="bridge-work-v1:"+createHash("sha256").update("BRIDGE-005|"+JSON.stringify(body)).digest("hex");
 if(Object.entries(body).some(([k,v])=>p[k]!==v)||p.candidateId!==expected)throw Error("HOLD_CHANGED_OR_AUTHORITY_CLAIM");
 return {candidateId:expected,doorId:p.doorId,actionCode:p.actionCode,actionLabel:ACTIONS[p.actionCode],
 sourceCommit:BRIDGE_SOURCE_COMMIT,sourceUrl:SOURCE_URL,classification:"UNVERIFIED_OPERATOR_DRAFT"};
}
