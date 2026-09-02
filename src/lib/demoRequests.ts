import type { ConsultationRequest, UserProfile } from '../types';
import { schoolConfig, type SchoolConfig } from './schoolConfig';
import { buildSlots, getFourWeekDays, isPastSlot, toDateKey } from './schedule';

export function demoRequests(profile: UserProfile, config: SchoolConfig = schoolConfig): ConsultationRequest[] {
  const slot = getFourWeekDays(config)
    .flatMap(day => buildSlots(toDateKey(day), config))
    .find(candidate => !isPastSlot(candidate.date, candidate.start));
  if (!slot) return [];
  return [{
    id: 'demo-1', teacherId: 'demo-teacher', teacherName: '선생님',
    userId: 'demo-student', studentName: profile.name,
    studentNumber: profile.studentNumber || config.student.numberExample,
    topic: config.consultation.topics[0], kind: 'normal',
    date: slot.date, start: slot.start, end: slot.end,
    slotId: `demo-teacher__${slot.id}`, status: 'pending', createdAt: new Date(),
  }];
}
