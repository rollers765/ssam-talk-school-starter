import { checkSetup, loadEnv } from '../shared/setup.mjs';
const mode=process.argv.includes('--demo')?'demo':process.argv.includes('--deploy')?'deploy':'build';
const errors=checkSetup(process.cwd(),loadEnv(process.cwd()),mode);
if(errors.length){ console.error(errors.join('\n')); process.exitCode=1; }
else console.log(`학교 설정 검사 통과 (${mode}).`);
