#!/usr/bin/env node
// Operator-only source-native JAR;VIS: no browser endpoint, no dispatch and no autoforwarding.
import {execFileSync} from "node:child_process";
import {realpathSync,existsSync} from "node:fs";
import {join,resolve} from "node:path";
import {PINS,attendNourishBanana} from "../src/nourish-banana-attention.mjs";
const usage="Usage: node tools/attend-nourish-banana-018.mjs inspect|attend /path/to/pinned/webZ /path/to/pinned/Nourish-Kids /path/to/pinned/BananaSpork";
if(process.argv.length!==6||!["inspect","attend"].includes(process.argv[2]))throw Error(usage);
const [mode,...roots]=process.argv.slice(2);
const expected=[
 ["webZ",PINS.webZ,"https://github.com/the-static-collective/webZ"],
 ["Nourish-Kids",PINS.nourish,"https://github.com/the-static-collective/Nourish-Kids"],
 ["BananaSpork",PINS.bananaSpork,"https://github.com/the-static-collective/BananaSpork"],
];
const checked=expected.map(([name,pin,origin],i)=>{
 const root=realpathSync(resolve(roots[i]));
 const git=(...args)=>execFileSync("git",["-C",root,...args],{encoding:"utf8",maxBuffer:8192}).trim();
 const sha=git("rev-parse","HEAD");
 if(sha!==pin)throw Error("JARVIS_SOURCE_PIN_REFUSED_"+name);
 const remote=git("remote","get-url","origin").replace(/\.git$/,"");
 if(remote!==origin)throw Error("JARVIS_SOURCE_ORIGIN_REFUSED_"+name);
 if(git("status","--porcelain","--untracked-files=normal")!=="")throw Error("JARVIS_SOURCE_DIRTY_REFUSED_"+name);
 return {name,repo:origin,commit:sha,root};
});
if(mode==="inspect"){
 process.stdout.write(JSON.stringify({
  schema:"jarvis/nourish-banana-source-check-v1",
  checked:checked.map(({name,repo,commit})=>({name,repo,commit})),
  nativeCodeExecuted:false,
  status:"HOLD_FOR_OPERATOR_REVIEW",
  realHumanAuthorization:false
 },null,2)+"\n");
 process.exit(0);
}
const webz=checked[0].root,nourish=checked[1].root,banana=checked[2].root;
const executable=join(banana,"node_modules",".bin","tsx");
if(!existsSync(executable))throw Error("JARVIS_HOLD_OWNER_TS_RUNNER_NOT_PROVISIONED");
const stdout=execFileSync(executable,[
 join(webz,"scripts","nourish-banana-native-crossing.mts"),nourish,banana
],{encoding:"utf8",cwd:webz,maxBuffer:256*1024,timeout:25000,env:{...process.env,CI:"true"}});
if(Buffer.byteLength(stdout)>48*1024)throw Error("JARVIS_HOLD_OVERSIZE_PROOF");
const receipt=JSON.parse(stdout);
const card=attendNourishBanana(receipt);
process.stdout.write(JSON.stringify(card,null,2)+"\n");
