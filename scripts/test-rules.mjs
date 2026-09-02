import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { prepareRules } from '../shared/setup.mjs';
// 운영 규칙 파일을 덮어쓰지 않고, 에뮬레이터 전용 파일만 만듭니다.
writeFileSync('.firestore.test.rules',prepareRules(process.cwd(),'admin@example.com'));
writeFileSync('.firebase.test.json',JSON.stringify({firestore:{rules:'.firestore.test.rules'},emulators:{firestore:{host:'127.0.0.1',port:8080},ui:{enabled:false},singleProjectMode:true}}));
const testEnv={...process.env,CI:'true',XDG_CONFIG_HOME:resolve('work/firebase-test-config'),FIREBASE_EMULATORS_PATH:process.env.FIREBASE_EMULATORS_PATH || resolve('work/firebase-emulators')};
delete testEnv.GOOGLE_APPLICATION_CREDENTIALS;
delete testEnv.FIREBASE_TOKEN;
const result=spawnSync(process.execPath,['node_modules/firebase-tools/lib/bin/firebase.js','emulators:exec','--config','.firebase.test.json','--only','firestore','--project','demo-school-starter','node node_modules/vitest/vitest.mjs run --config vitest.rules.config.ts'],{stdio:'inherit',env:testEnv});
process.exitCode=result.status??1;
