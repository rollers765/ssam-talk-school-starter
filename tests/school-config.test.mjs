import { test } from 'node:test';
import assert from 'node:assert/strict';

test('학번은 설정한 길이로 검증하며 선행 0과 PIN 규칙을 혼동하지 않는다', async () => {
  const { isStudentNumber } = await import('../shared/school-config.mjs');
  assert.equal(isStudentNumber('001234', 6), true);
  assert.equal(isStudentNumber('00123', 6), false);
  assert.equal(isStudentNumber('abcdef', 6), false);
  assert.equal(isStudentNumber(123456, 6), false);
});

test('다른 학교의 정상 설정을 허용하고 잘못된 설정을 거부한다', async () => {
  const { schoolConfig, validateSchoolConfig } = await import('../shared/school-config.mjs');
  const valid = structuredClone(schoolConfig);
  valid.school.name = '가상학교';
  valid.student.numberLength = 6;
  valid.student.numberExample = '001234';
  valid.consultation.weeklySchedule.monday = [{ start: '09:30', end: '09:45', label: '쉬는 시간', type: 'break' }];
  assert.equal(validateSchoolConfig(valid).school.name, '가상학교');
  for (const mutate of [
    c => { c.student.numberLength = 0; },
    c => { c.student.numberExample = '123'; },
    c => { c.school.logoPath = 'https://external.example/logo.png'; },
    c => { c.branding.primaryColor = 'red;display:none'; },
    c => { c.consultation.weeklySchedule.monday[0].end = '09:00'; },
    c => { c.consultation.weeklySchedule.monday[0].start = '25:00'; },
    c => { c.consultation.weeklySchedule.monday.push({ start: '09:35', end: '09:50', label: '겹침', type: 'break' }); },
    c => { c.adminEmail = 'admin@example.com'; },
    c => { c.school.serviceAccount = 'secret'; },
    c => { for (const day of Object.keys(c.consultation.weeklySchedule)) c.consultation.weeklySchedule[day] = []; },
  ]) {
    const invalid = structuredClone(valid);
    mutate(invalid);
    assert.throws(() => validateSchoolConfig(invalid));
  }
});
