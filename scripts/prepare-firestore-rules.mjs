import { writeFileSync } from 'node:fs';
import { prepareRules, loadEnv } from '../shared/setup.mjs';
try {
  writeFileSync('firestore.rules',prepareRules(process.cwd(),loadEnv(process.cwd()).VITE_ADMIN_EMAIL),{mode:0o600});
  console.log('관리자 규칙을 생성했습니다. 대상 Firebase 프로젝트를 확인한 뒤 별도로 배포하세요.');
} catch(e){ console.error(e.message); process.exitCode=1; }
