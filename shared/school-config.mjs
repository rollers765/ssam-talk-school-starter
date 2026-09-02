import defaults from '../config/school.config.json' with { type: 'json' };

export const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function requireValue(ok, field) {
  if (!ok) throw new Error(`학교 설정을 확인해 주세요: ${field}`);
}
function keys(value, allowed, field) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), field);
  requireValue(Object.keys(value).every(k => allowed.includes(k)), field);
}
function text(value, max = 80) {
  return typeof value === 'string' && value.trim().length > 0 && value === value.trim() && value.length <= max && !/[\r\n\0]/.test(value);
}
export function isStudentNumber(value, length = defaults.student.numberLength) {
  return Number.isInteger(length) && length >= 1 && length <= 12 && typeof value === 'string' && new RegExp(`^\\d{${length}}$`).test(value);
}

export function validateSchoolConfig(value) {
  keys(value, ['school', 'student', 'consultation', 'branding'], '최상위 항목');
  keys(value.school, ['name', 'shortName', 'logoPath'], 'school');
  requireValue(text(value.school.name) && text(value.school.shortName, 30), '학교명');
  requireValue(typeof value.school.logoPath === 'string' && /^\/[a-zA-Z0-9/_-]+\.(png|jpe?g|svg|webp)$/.test(value.school.logoPath), '교표 경로');
  keys(value.student, ['numberLabel', 'numberLength', 'numberExample'], 'student');
  requireValue(text(value.student.numberLabel, 20) && isStudentNumber(value.student.numberExample, value.student.numberLength), '학번 길이·예시');
  keys(value.branding, ['appName', 'tagline', 'primaryColor'], 'branding');
  requireValue(text(value.branding.appName, 30) && text(value.branding.tagline), '앱 이름·안내 문구');
  requireValue(/^#[0-9a-fA-F]{6}$/.test(value.branding.primaryColor), '대표 색상');
  keys(value.consultation, ['weeksAvailable', 'topics', 'weeklySchedule'], 'consultation');
  const c = value.consultation;
  requireValue(Number.isInteger(c.weeksAvailable) && c.weeksAvailable >= 1 && c.weeksAvailable <= 12, '예약 주 수(1~12)');
  requireValue(Array.isArray(c.topics) && c.topics.length >= 1 && c.topics.length <= 12 && c.topics.every(t => text(t, 40)) && new Set(c.topics).size === c.topics.length, '상담 주제');
  keys(c.weeklySchedule, weekdays, '요일별 시간표');
  for (const day of weekdays) {
    const slots = c.weeklySchedule[day];
    requireValue(Array.isArray(slots) && slots.length <= 48, day);
    let previousEnd = '';
    for (const slot of [...slots].sort((a, b) => String(a?.start).localeCompare(String(b?.start)))) {
      keys(slot, ['start', 'end', 'label', 'type'], day);
      const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
      requireValue(time.test(slot.start) && time.test(slot.end) && slot.start < slot.end, day + ' 시작·종료 시각');
      requireValue(slot.start >= previousEnd, day + ' 시간 겹침');
      requireValue(text(slot.label, 50) && ['break', 'lunch', 'after'].includes(slot.type), day + ' 시간 이름·유형');
      previousEnd = slot.end;
    }
  }
  requireValue(weekdays.some(day => c.weeklySchedule[day].length > 0), '상담 가능한 시간을 최소 한 개 설정하세요.');
  return value;
}

export const schoolConfig = validateSchoolConfig(defaults);
