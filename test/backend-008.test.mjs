import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizedEmail,validEmail,validCode,validBootstrap,sameOrigin,cookieJar,makeSessionCookies,eraseCookies} from '../backend/edge/jarvis-operator-008/auth-core.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('email-code and one-time operator key validation',()=>{
 assert.equal(normalizedEmail(' Owner@Example.org '),'owner@example.org');
 assert.equal(validEmail('owner@example.org'),true);
 assert.equal(validEmail('test\r\n@bad.org'),false);
 assert.equal(validCode('123456'),true);
 assert.equal(validCode('12345'),false);
 assert.equal(validBootstrap('jv7_'+'a'.repeat(64)),true);
 assert.equal(validBootstrap('jv7_'+'a'.repeat(63)),false);
});
test('sessions use HttpOnly Strict secure cookies with scoped path and clearing',()=>{
 for(const cookie of makeSessionCookies('token','refresh')) {
  assert.match(cookie,/Secure; HttpOnly; SameSite=Strict/);
  assert.match(cookie,/Path=\/functions\/v1\/jarvis-operator-008/);
 }
 for(const cookie of eraseCookies())assert.match(cookie,/Max-Age=0/);
 assert.equal(cookieJar(new Request('https://example.org',{headers:{Cookie:'jv8_a=a; jv8_r=b'}})).jv8_r,'b');
});
test('cross-site POST cannot use owner session',()=>{
 assert.equal(sameOrigin(new Request('https://a.test/operator',{headers:{Origin:'https://evil.test'}})),false);
 assert.equal(sameOrigin(new Request('https://a.test/operator',{headers:{Origin:'https://a.test'}})),true);
});
test('identity table is private and bound to verified auth user',async()=>{
 const sql=await read('backend/migrations/008_operator_email_identity.sql');
 assert.match(sql,/REFERENCES auth\.users\(id\)/);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/REVOKE ALL ON public\.jarvis_backend_operator_identities FROM PUBLIC,anon,authenticated/);
 const auth=await read('backend/edge/jarvis-operator-008/auth-server.ts');
 assert.match(auth,/auth\.getUser|client\.auth\.getUser/);
 assert.match(auth,/email_confirmed_at/);
 assert.match(auth,/jarvis_backend_check_capability/);
 assert.match(auth,/jarvis_backend_operator_identities/);
 assert.match(auth,/shouldCreateUser:!member/);
});
test('UI holds no master key and backend keeps real-world effects out',async()=>{
 const ui=await read('backend/edge/jarvis-operator-008/ui.ts');
 assert.doesNotMatch(ui,/SERVICE_ROLE_KEY|localStorage|sessionStorage/);
 const app=await read('backend/edge/jarvis-operator-008/index.ts');
 assert.match(app,/sameOrigin\(req\)/);
 assert.match(app,/readSession\(req\)/);
 assert.match(app,/SYNTHETIC_ONLY/);
 assert.doesNotMatch(app,/api\.resend\.com|emailRecipients|service_role/);
});
