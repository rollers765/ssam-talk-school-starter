export interface SchoolSlot { start: string; end: string; label: string; type: 'break' | 'lunch' | 'after'; }
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
export interface SchoolConfig {
  school: { name: string; shortName: string; logoPath: string };
  student: { numberLabel: string; numberLength: number; numberExample: string };
  consultation: { weeksAvailable: number; topics: string[]; weeklySchedule: Record<Weekday, SchoolSlot[]> };
  branding: { appName: string; tagline: string; primaryColor: string };
}
export const weekdays: Weekday[];
export const schoolConfig: SchoolConfig;
export function validateSchoolConfig(value: unknown): SchoolConfig;
export function isStudentNumber(value: unknown, length?: number): value is string;
