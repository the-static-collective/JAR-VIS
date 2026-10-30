// BACKEND-008 pure validation helpers. No credentials are embedded in source.
export const normalizedEmail=v=>typeof v==='string'?v.trim().toLowerCase():'';
export const validEmail=v=>typeof v==='string'&&v.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v)&&!/[\r\n]/.test(v);
export const validCode=v=>typeof v==='string'&&/^[0-9]{6,8}$/.test(v);
export const validBootstrap=v=>typeof v==='string'&&/^jv7_[a-f0-9]{64}$/.test(v);
// Supabase can expose an internal function URL to Deno even when browser is on the public project origin.
// Browser writes must originate from this EXACT first-party Supabase project domain.
export const sameOrigin=req=>req.headers.get('origin')==='https://kbhqacsdvjsstzyplqij.supabase.co';
export const cookieJar=req=>Object.fromEntries((req.headers.get('cookie')||'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>{const i=s.indexOf('=');return i<0?['','']:[s.slice(0,i),s.slice(i+1)];}));
const path='/functions/v1/jarvis-operator-008';
export const makeSessionCookies=(a,r,seconds=3600)=>[
 'jv8_a='+encodeURIComponent(a)+'; Path='+path+'; Secure; HttpOnly; SameSite=Strict; Max-Age='+Math.max(1,Math.min(3600,seconds)),
 'jv8_r='+encodeURIComponent(r)+'; Path='+path+'; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000'
];
export const eraseCookies=()=>[
 'jv8_a=; Path='+path+'; Secure; HttpOnly; SameSite=Strict; Max-Age=0',
 'jv8_r=; Path='+path+'; Secure; HttpOnly; SameSite=Strict; Max-Age=0'
];
