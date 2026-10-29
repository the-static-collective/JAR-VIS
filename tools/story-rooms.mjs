import {readFileSync,writeFileSync} from 'node:fs';
import {composeStoryRooms,verifyStoryRooms} from '../src/story-rooms.mjs';
const [action,path]=process.argv.slice(2);
if(action==='demo'){
 const p=composeStoryRooms();
 if(path)writeFileSync(path,JSON.stringify(p,null,2)+'\n',{flag:'wx'});
 else process.stdout.write(JSON.stringify(p,null,2)+'\n');
}else if(action==='verify'&&path){
 process.stdout.write(JSON.stringify(verifyStoryRooms(JSON.parse(readFileSync(path,'utf8'))),null,2)+'\n');
}else{process.stderr.write('Usage: node tools/story-rooms.mjs demo [NEWFILE] | verify FILE\n');process.exitCode=2;}
