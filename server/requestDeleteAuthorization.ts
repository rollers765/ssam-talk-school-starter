export type DeleteActor = {
  uid: string;
  email?: string;
  role?: string;
  sessionVersion?: unknown;
};

export type DeleteRequest = {
  userId?: unknown;
  teacherId?: unknown;
  slotId?: unknown;
};

export type DeleteContext = {
  actor: DeleteActor;
  request: DeleteRequest;
  teacherApproved: boolean;
  sessionActive: boolean;
  adminAuthorized?: boolean;
};

export function isValidRequestId(value: unknown): value is string {
  return typeof value === "string"
    && value === value.trim()
    && value.length > 0
    && value.length <= 1500
    && !value.includes("/")
    && !value.includes("\0");
}

export function parseBearerToken(value: unknown) {
  if (typeof value !== "string") return "";
  return value.match(/^Bearer\s+([^\s]+)$/i)?.[1] || "";
}

export function isDeleteRequestBody(value: unknown): value is { requestId: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  return Object.keys(body).length === 1 && isValidRequestId(body.requestId);
}

export function canDeleteBoundSlotLock({
  requestId,
  slotId,
  lock,
}: {
  requestId: string;
  slotId: unknown;
  lock: { requestId?: unknown } | null | undefined;
}) {
  return isValidRequestId(slotId) && lock?.requestId === requestId;
}

export function canDeleteRequest({ actor, request, teacherApproved, sessionActive, adminAuthorized = false }: DeleteContext) {
  if (actor.role === "student") return sessionActive && request.userId === actor.uid;
  const teacherIdentity = actor.role === "teacher" || adminAuthorized;
  return teacherApproved && teacherIdentity && request.teacherId === actor.uid;
}
