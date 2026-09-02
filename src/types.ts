import type { Timestamp } from "firebase/firestore";

export type SlotType = "break" | "lunch" | "after";
export type RequestKind = "normal" | "meal" | "friend";
export type RequestStatus = "pending" | "confirmed" | "proposed" | "deferred" | "cancelled" | "completed";

export interface TimeSlot {
  id: string;
  date: string;
  start: string;
  end: string;
  label: string;
  type: SlotType;
  enabled: boolean;
  bookingStatus?: RequestStatus;
  bookingStudentName?: string;
}

export interface ConsultationRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  userId: string;
  studentEmail?: string;
  studentName: string;
  studentNumber: string;
  topic: string;
  kind: RequestKind;
  companionName?: string;
  date?: string;
  start?: string;
  end?: string;
  slotId?: string;
  status: RequestStatus;
  proposedDate?: string;
  proposedStart?: string;
  teacherNote?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  expiresAt?: Timestamp | Date;
}

export interface ScheduleItem {
  id: string;
  teacherId?: string;
  date?: string;
  weekday?: number;
  start: string;
  end: string;
  title: string;
  publicTitle?: string;
  recurring: boolean;
}

export interface UserProfile {
  email?: string;
  name: string;
  department?: string;
  studentNumber?: string;
  role: "student" | "teacher";
}

export interface AdminStudent {
  id: string;
  name: string;
  studentNumber: string;
  registrationNumber?: number;
  registeredAt?: Timestamp | Date;
}

export interface TeacherApplication {
  id: string;
  name: string;
  email?: string;
  department?: string;
  status: "pending" | "approved";
  createdAt?: Timestamp | Date;
  approvedAt?: Timestamp | Date;
}

export interface PublicTeacher {
  id: string;
  name: string;
  status: "approved";
}
