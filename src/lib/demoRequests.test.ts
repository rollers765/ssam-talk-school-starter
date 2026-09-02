import { afterEach, expect, it, vi } from 'vitest';
import { schoolConfig } from './schoolConfig';
afterEach(()=>vi.useRealTimers());
it('미리보기 상담도 해당 학교의 학번·주제·미래 시간을 사용한다',async()=>{
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-07T08:00:00'));
  const config=structuredClone(schoolConfig);
  config.student.numberExample='001234';
  config.consultation.topics=['진학 이야기'];
  config.consultation.weeklySchedule.monday=[{start:'09:30',end:'09:45',label:'상담',type:'break'}];
  const { demoRequests } = await import('./demoRequests');
  const requests=demoRequests({name:'가상학생',role:'student'},config);
  expect(requests[0]).toMatchObject({studentNumber:'001234',topic:'진학 이야기',date:'2026-09-07',start:'09:30',end:'09:45',slotId:'demo-teacher__2026-09-07_09:30'});
});
