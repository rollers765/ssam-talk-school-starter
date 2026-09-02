import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import { randomBytes, createPrivateKey } from 'node:crypto';
import { validateSchoolConfig } from './school-config.mjs';

const publicKeys = ['VITE_ADMIN_EMAIL','VITE_SITE_URL','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_API_KEY','VITE_FIREBASE_STORAGE_BUCKET','VITE_FIREBASE_MESSAGING_SENDER_ID','VITE_FIREBASE_APP_ID','VITE_FIREBASE_AUTH_DOMAIN'];
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const placeholder = /(?:__|your[-_ ]|example\.|demo-|ssam-talk-danagari|web-two-alpha|senedu\.kr)/i;

export function readLocalEnv(root) {
  const file = join(root,'.env.local');
  return existsSync(file) ? parseEnv(readFileSync(file,'utf8')) : {};
}
export function loadEnv(root) { return { ...readLocalEnv(root), ...process.env }; }
export function readSchool(root) { return validateSchoolConfig(JSON.parse(readFileSync(join(root,'config/school.config.json'),'utf8'))); }
function siteHost(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('VITE_SITE_URL은 경로 없는 HTTPS 운영 주소여야 합니다.');
  return url.host;
}
function validateEnv(env, deploy) {
  const errors = [];
  for (const key of publicKeys) if (!env[key] || typeof env[key] !== 'string' || placeholder.test(env[key]) || /[\r\n\0'"`]/.test(env[key])) errors.push(key + ': 실제 연결값이 필요합니다.');
  if (!emailPattern.test(env.VITE_ADMIN_EMAIL || '')) errors.push('VITE_ADMIN_EMAIL: 이메일 형식을 확인하세요.');
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(env.VITE_FIREBASE_PROJECT_ID || '')) errors.push('VITE_FIREBASE_PROJECT_ID: 프로젝트 ID 형식을 확인하세요.');
  try { if (siteHost(env.VITE_SITE_URL) !== env.VITE_FIREBASE_AUTH_DOMAIN) errors.push('VITE_FIREBASE_AUTH_DOMAIN: 운영 사이트 도메인과 달라요.'); } catch { errors.push('VITE_SITE_URL: HTTPS 운영 주소를 확인하세요.'); }
  if (Object.keys(env).some(k => /^VITE_.*(?:SECRET|PRIVATE|SERVICE_ACCOUNT)/i.test(k))) errors.push('서버 비밀값을 VITE_ 변수에 넣으면 안 됩니다.');
  if (env.VITE_GOOGLE_HOSTED_DOMAIN && (!/^[a-z0-9.-]+$/i.test(env.VITE_GOOGLE_HOSTED_DOMAIN) || !env.VITE_ADMIN_EMAIL?.endsWith('@' + env.VITE_GOOGLE_HOSTED_DOMAIN))) errors.push('VITE_GOOGLE_HOSTED_DOMAIN: 관리자 이메일 도메인과 일치해야 합니다.');
  if (deploy) {
    if (!/^[a-f0-9]{64}$/i.test(env.STUDENT_AUTH_SECRET || '')) errors.push('STUDENT_AUTH_SECRET: 64자리 보안값이 필요합니다.');
    try {
      const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
      if (sa.type !== 'service_account' || sa.project_id !== env.VITE_FIREBASE_PROJECT_ID || !emailPattern.test(sa.client_email) || !sa.private_key) throw new Error();
      createPrivateKey(sa.private_key);
    } catch { errors.push('FIREBASE_SERVICE_ACCOUNT: 같은 Firebase 프로젝트의 유효한 서비스 계정이 필요합니다.'); }
  }
  return errors;
}

export function makeVercelConfig(env) {
  return { framework: 'vite', buildCommand: 'npm run build', outputDirectory: 'dist', rewrites: [
    { source: '/__/auth/:path*', destination: `https://${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/:path*` },
    { source: '/((?!api/|__/auth/).*)', destination: '/index.html' },
  ] };
}
export function prepareRules(root, email) {
  if (!emailPattern.test(email || '')) throw new Error('관리자 이메일을 확인하세요.');
  const template = readFileSync(join(root,'templates/firestore.rules.template'),'utf8');
  if (template.split('__ADMIN_EMAIL__').length !== 2) throw new Error('규칙 템플릿의 관리자 항목이 올바르지 않습니다.');
  return template.replace('__ADMIN_EMAIL__', email.toLowerCase());
}

export function checkSetup(root, env, mode = 'build') {
  const errors=[];
  try {
    const school = readSchool(root);
    if (!existsSync(join(root,'public',school.school.logoPath.slice(1)))) errors.push('school.logoPath: 교표 파일을 찾을 수 없습니다.');
    if (mode !== 'demo' && (school.school.name === '우리 고등학교' || placeholder.test(school.school.name))) errors.push('school.name: 실제 학교명을 입력하세요.');
  } catch (e) { errors.push(e instanceof SyntaxError ? '공개 학교 설정 JSON 형식을 확인하세요.' : e.message); }
  if (mode === 'demo') return errors;
  errors.push(...validateEnv(env,mode === 'deploy'));
  if (!errors.length) {
    try {
      const actual=JSON.parse(readFileSync(join(root,'vercel.json'),'utf8'));
      if (JSON.stringify(actual.rewrites) !== JSON.stringify(makeVercelConfig(env).rewrites)) errors.push('vercel.json: 학교 설정 도구를 다시 실행하세요.');
    } catch { errors.push('vercel.json: 학교 설정 도구를 실행하세요.'); }
    if (mode === 'deploy') {
      try { if (readFileSync(join(root,'firestore.rules'),'utf8') !== prepareRules(root,env.VITE_ADMIN_EMAIL)) errors.push('firestore.rules: 관리자 규칙을 다시 생성하세요.'); }
      catch { errors.push('firestore.rules: 관리자 규칙을 생성하세요.'); }
    }
  }
  return errors;
}

export function setupSchool(root, input = {}) {
  const school = validateSchoolConfig(input.school || readSchool(root));
  if (!existsSync(join(root,'public',school.school.logoPath.slice(1)))) throw new Error('교표 파일을 먼저 public에 준비하세요.');
  const previous = readLocalEnv(root);
  const incoming = input.env || {};
  if (typeof incoming !== 'object' || Array.isArray(incoming)) throw new Error('env는 항목과 값의 객체여야 합니다.');
  const env = { ...previous, ...incoming };
  for (const key of Object.keys(env)) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key) || typeof env[key] !== 'string' || /[\r\n\0']/.test(env[key])) throw new Error('환경 변수의 형식이 올바르지 않습니다: ' + key);
  }
  for (const key of ['VITE_FIREBASE_PROJECT_ID','STUDENT_AUTH_SECRET']) if (previous[key] && env[key] !== previous[key]) throw new Error(key + ': 기존 계정 보호를 위해 자동 변경하지 않습니다.');
  const statePath=join(root,'.setup-state.json');
  if (existsSync(statePath)) {
    const state=JSON.parse(readFileSync(statePath,'utf8'));
    if (state.numberLength !== school.student.numberLength) throw new Error('운영 설정 후 학번 길이 변경은 별도 계정 이전 검토가 필요합니다.');
  }
  env.VITE_ADMIN_EMAIL = (env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
  env.VITE_SITE_URL = (env.VITE_SITE_URL || '').replace(/\/$/,'');
  env.VITE_FIREBASE_AUTH_DOMAIN = siteHost(env.VITE_SITE_URL);
  const errors=validateEnv(env,false);
  if (errors.length) throw new Error(errors.join('\n'));
  if (!env.STUDENT_AUTH_SECRET) env.STUDENT_AUTH_SECRET=randomBytes(32).toString('hex');
  if (!/^[a-f0-9]{64}$/i.test(env.STUDENT_AUTH_SECRET)) throw new Error('기존 STUDENT_AUTH_SECRET 형식을 확인하세요. 자동으로 덮어쓰지 않습니다.');
  const rules=prepareRules(root,env.VITE_ADMIN_EMAIL);
  const writes = {
    'config/school.config.json': JSON.stringify(school,null,2)+'\n',
    '.env.local': Object.entries(env).map(([k,v])=>`${k}='${v}'`).join('\n')+'\n',
    'firestore.rules': rules,
    'vercel.json': JSON.stringify(makeVercelConfig(env),null,2)+'\n',
    '.setup-state.json': JSON.stringify({numberLength:school.student.numberLength,projectId:env.VITE_FIREBASE_PROJECT_ID})+'\n',
  };
  // 쓰기 오류가 발생해도 기존 설정으로 되돌립니다. 비밀값은 출력하지 않습니다.
  const old=Object.fromEntries(Object.keys(writes).map(file=>[file,existsSync(join(root,file))?readFileSync(join(root,file)):null]));
  try { for (const [file,value] of Object.entries(writes)) writeFileSync(join(root,file),value,{mode:0o600}); }
  catch (e) {
    for (const [file,value] of Object.entries(old)) {
      if (value !== null) writeFileSync(join(root,file),value,{mode:0o600});
      else if (existsSync(join(root,file))) unlinkSync(join(root,file));
    }
    throw e;
  }
  return { schoolName:school.school.name, projectId:env.VITE_FIREBASE_PROJECT_ID };
}
