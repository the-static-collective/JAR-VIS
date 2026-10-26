import { createHash } from 'node:crypto';

/** Pure CPU work for a claimed synthetic fixture, safe to run locally or on Modal.
 * This does NOT fetch, lease, approve, persist, email, or admit a real-world claim.
 */
export function measureSyntheticClaim(claim) {
  if (!claim || claim.claimed!==true || claim.synthetic!==true ||
      claim.workKind!=='SYNTHETIC_MEASURE' ||
      typeof claim.label!=='string' || claim.label.length>160 ||
      !/^[0-9a-f-]{36}$/i.test(claim.id||'')) {
    throw new Error('FIXTURE_OR_LEASE_REQUIRED');
  }
  const source=claim.label;
  return {
    schema:'jarvis.synthetic-return/v1',
    requestId:claim.id,
    inputSha256:createHash('sha256').update(source,'utf8').digest('hex'),
    utf8Bytes:Buffer.byteLength(source,'utf8'),
    wordCount:source.trim().split(/\s+/).filter(Boolean).length,
    verifiedRealWorldClaims:false,
    admitted:false,
    externalEffects:[],
    disposition:'HOLD_FOR_HUMAN_REVIEW'
  };
}
