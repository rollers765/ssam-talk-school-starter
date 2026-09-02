import { readFileSync } from 'node:fs';
import { setupSchool } from '../shared/setup.mjs';
try {
  const flag=process.argv.indexOf('--input');
  const input=flag<0?{}:JSON.parse(readFileSync(process.argv[flag+1],'utf8'));
  setupSchool(process.cwd(),input);
  console.log('학교 설정과 관리자 규칙을 준비했습니다. 비밀값은 출력하지 않습니다. SETUP.md의 환경 변수 등록과 규칙 배포를 계속해 주세요.');
} catch (e) { console.error(e instanceof SyntaxError ? '설정 JSON 형식을 확인하세요. 비밀값은 출력하지 않습니다.' : e.message); process.exitCode=1; }
