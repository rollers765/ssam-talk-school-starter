import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import schoolConfig from '../config/school.config.example.json' with { type: 'json' };

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'ssam-setup-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ['config','templates','public']) mkdirSync(join(root,dir));
  writeFileSync(join(root,'config/school.config.json'),JSON.stringify(schoolConfig));
  writeFileSync(join(root,'templates/firestore.rules.template'),"email == '__ADMIN_EMAIL__';");
  writeFileSync(join(root,'public/school-logo.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');
  return root;
}
const deployment = {
  VITE_ADMIN_EMAIL: 'owner@sample-school.edu',
  VITE_SITE_URL: 'https://sample-school.vercel.app',
  VITE_FIREBASE_PROJECT_ID: 'sample-school-2026',
  VITE_FIREBASE_API_KEY: 'test-web-key',
  VITE_FIREBASE_STORAGE_BUCKET: 'sample-school-2026.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abcd',
};

test('설정 재실행은 PIN 비밀값과 기존 환경값을 보존한다', async t => {
  const { setupSchool } = await import('../shared/setup.mjs');
  const root = fixture(t);
  const school = structuredClone(schoolConfig);
  school.school.name = '가상 고등학교';
  setupSchool(root, { school, env: deployment });
  const first = parseEnv(readFileSync(join(root,'.env.local'),'utf8'));
  assert.match(first.STUDENT_AUTH_SECRET, /^[a-f0-9]{64}$/);
  setupSchool(root, {});
  const second = parseEnv(readFileSync(join(root,'.env.local'),'utf8'));
  assert.deepEqual(second, first);
  assert.equal(second.VITE_FIREBASE_AUTH_DOMAIN, 'sample-school.vercel.app');
  assert.equal(readFileSync(join(root,'firestore.rules'),'utf8'), "email == 'owner@sample-school.edu';");
  const vercel = JSON.parse(readFileSync(join(root,'vercel.json'),'utf8'));
  assert.equal(vercel.rewrites[0].destination, 'https://sample-school-2026.firebaseapp.com/__/auth/:path*');
});

test('잘못된 입력이나 프로젝트·학번·비밀값 변경은 기존 파일을 덮어쓰지 않는다', async t => {
  const { setupSchool } = await import('../shared/setup.mjs');
  const root = fixture(t);
  const school = structuredClone(schoolConfig);
  school.school.name = '가상 고등학교';
  setupSchool(root,{school,env:deployment});
  const before = readFileSync(join(root,'.env.local'),'utf8');
  for (const env of [
    { VITE_ADMIN_EMAIL: "bad'@example.com" },
    { VITE_FIREBASE_PROJECT_ID: 'another-project' },
    { STUDENT_AUTH_SECRET: 'b'.repeat(64) },
    { VITE_SITE_URL: 'https://sample-school.vercel.app/not-root' },
  ]) assert.throws(() => setupSchool(root,{env}));
  const changed = structuredClone(school);
  changed.student.numberLength = 6;
  changed.student.numberExample = '123456';
  assert.throws(() => setupSchool(root,{school:changed}));
  assert.equal(readFileSync(join(root,'.env.local'),'utf8'), before);
});

test('운영 검사는 누락한 서버 비밀값과 다른 프로젝트의 서비스 계정을 거부한다', async t => {
  const { setupSchool, checkSetup } = await import('../shared/setup.mjs');
  const root=fixture(t);
  const school=structuredClone(schoolConfig); school.school.name='가상 고등학교';
  setupSchool(root,{school,env:deployment});
  const env=parseEnv(readFileSync(join(root,'.env.local'),'utf8'));
  assert.equal(checkSetup(root,env,'build').length,0);
  assert.ok(checkSetup(root,env,'deploy').some(e => e.includes('FIREBASE_SERVICE_ACCOUNT')));
  env.FIREBASE_SERVICE_ACCOUNT=JSON.stringify({project_id:'wrong-project',client_email:'service@wrong-project.iam.gserviceaccount.com',private_key:'fake'});
  assert.ok(checkSetup(root,env,'deploy').length>0);
  env.VITE_FIREBASE_PROJECT_ID='demo-school-starter';
  assert.ok(checkSetup(root,env,'build').length>0);
});
