// Local-only creativity/ideation export; no external source or private user data.
import {writeFileSync,readFileSync} from 'node:fs';
import {compileThoughtFood,verifyThoughtFood} from '../src/thought-food.mjs';
const [op,path]=process.argv.slice(2);
if(op==='demo'){
 const packet=compileThoughtFood();
 if(path)writeFileSync(path,JSON.stringify(packet,null,2)+'\n',{flag:'wx'});
 else process.stdout.write(JSON.stringify(packet,null,2)+'\n');
}else if(op==='verify'&&path){
 const packet=JSON.parse(readFileSync(path,'utf8'));
 process.stdout.write(JSON.stringify(verifyThoughtFood(packet),null,2)+'\n');
}else{
 process.stderr.write('Usage: node tools/thought-food.mjs demo [NEW_FILE] | verify FILE\n');
 process.exitCode=2;
}
