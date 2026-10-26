import {createClient} from 'npm:@supabase/supabase-js@2.78.0';
const root=Deno.env.get('SUPABASE_URL');
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if(!root||!secret)throw Error('CONFIG_HOLD');
export const db=createClient(root,secret,{auth:{persistSession:false,autoRefreshToken:false}});
