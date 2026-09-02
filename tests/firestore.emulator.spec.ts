import { beforeAll, afterAll, describe, it } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

let env: RulesTestEnvironment;
beforeAll(async () => {
  if (!['127.0.0.1:8080','localhost:8080'].includes(process.env.FIRESTORE_EMULATOR_HOST || '')) throw new Error('로컬 에뮬레이터에서만 실행할 수 있습니다.');
  const rules=readFileSync('templates/firestore.rules.template','utf8').replace('__ADMIN_EMAIL__','admin@example.com');
  env=await initializeTestEnvironment({projectId:'demo-school-starter',firestore:{host:'127.0.0.1',port:8080,rules}});
  await env.withSecurityRulesDisabled(async context => {
    const db=context.firestore();
    for (const id of ['student-a','student-b']) {
      await setDoc(doc(db,'users',id),{name:id,studentNumber:id==='student-a'?'10312':'10313',role:'student'});
      await setDoc(doc(db,'studentSessions',id),{version:1});
    }
    for(const id of ['teacher-a','teacher-b','admin']) await setDoc(doc(db,'teachers',id),{name:id,status:'approved'});
    await setDoc(doc(db,'requests','request-a'),{userId:'student-a',teacherId:'teacher-a',studentName:'student-a',studentNumber:'10312',status:'pending'});
    await setDoc(doc(db,'requests','request-admin'),{userId:'student-b',teacherId:'admin',studentName:'student-b',studentNumber:'10313',status:'pending'});
    await setDoc(doc(db,'schedules','schedule-a'),{teacherId:'teacher-a',title:'개인 일정'});
    await setDoc(doc(db,'studentCredentials','credential-a'),{pinHash:'fake-hash'});
  });
},30000);
afterAll(async()=>{if(env) await env.cleanup();});

describe('상담과 일정의 접근 경계',()=>{
  it('학생은 자기 상담만 읽고 다른 학생 상담은 읽지 못한다',async()=>{
    const db=env.authenticatedContext('student-a',{role:'student',sessionVersion:1}).firestore();
    await assertSucceeds(getDoc(doc(db,'requests','request-a')));
    await assertFails(getDoc(doc(db,'requests','request-admin')));
  });
  it('담당 교사만 상담과 개인 일정을 읽는다',async()=>{
    const own=env.authenticatedContext('teacher-a',{role:'teacher'}).firestore();
    const other=env.authenticatedContext('teacher-b',{role:'teacher'}).firestore();
    await assertSucceeds(getDoc(doc(own,'requests','request-a')));
    await assertFails(getDoc(doc(other,'requests','request-a')));
    await assertSucceeds(getDoc(doc(own,'schedules','schedule-a')));
    await assertFails(getDoc(doc(other,'schedules','schedule-a')));
  });
  it('관리자는 등록 목록과 본인 상담만 읽고 다른 교사 상담은 읽지 못한다',async()=>{
    const db=env.authenticatedContext('admin',{email:'admin@example.com'}).firestore();
    await assertSucceeds(getDocs(collection(db,'users')));
    await assertSucceeds(getDoc(doc(db,'requests','request-admin')));
    await assertFails(getDoc(doc(db,'requests','request-a')));
    await assertFails(getDoc(doc(db,'studentCredentials','credential-a')));
  });
  it('PIN 초기화 전 세션과 비로그인 접근은 거부한다',async()=>{
    const stale=env.authenticatedContext('student-a',{role:'student',sessionVersion:0}).firestore();
    await assertFails(getDoc(doc(stale,'requests','request-a')));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'requests','request-a')));
  });
  it('브라우저에서 직접 기록 삭제나 다른 학생 이름으로 신청하지 못한다',async()=>{
    const db=env.authenticatedContext('student-a',{role:'student',sessionVersion:1}).firestore();
    await assertFails(deleteDoc(doc(db,'requests','request-a')));
    await assertFails(setDoc(doc(db,'requests','spoofed'),{userId:'student-a',teacherId:'teacher-a',teacherName:'teacher-a',studentName:'다른학생',studentNumber:'10312',status:'pending'}));
  });
});
