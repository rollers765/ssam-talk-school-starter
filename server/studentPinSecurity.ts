import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const LOCK_AFTER_ATTEMPTS = 5;
const LOCK_DURATION_MS = 10 * 60 * 1000;

export type AttemptState = {
  failedAttempts: number;
  lockedUntil: number | null;
};

export type CredentialAttemptState = AttemptState & {
  salt: string;
  pinHash: string;
};

export function studentKey(studentNumber: string, secret: string) {
  return createHmac("sha256", secret).update(studentNumber).digest("hex");
}

export async function hashPin(pin: string, providedSalt?: string) {
  const salt = providedSalt || randomBytes(16).toString("hex");
  const result = await scryptAsync(pin, salt, 64) as Buffer;
  return { salt, hash: result.toString("hex") };
}

export async function verifyPin(pin: string, salt: string, expectedHash: string) {
  const result = await hashPin(pin, salt);
  const actual = Buffer.from(result.hash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function recordFailedAttempt(state: AttemptState, now: number): AttemptState {
  const failedAttempts = state.failedAttempts + 1;
  return {
    failedAttempts,
    lockedUntil: failedAttempts >= LOCK_AFTER_ATTEMPTS ? now + LOCK_DURATION_MS : null,
  };
}

export async function evaluatePinAttempt(pin: string, state: CredentialAttemptState, now: number) {
  if (Number(state.lockedUntil || 0) > now) {
    return {
      kind: "locked" as const,
      minutes: Math.max(1, Math.ceil((Number(state.lockedUntil) - now) / 60000)),
    };
  }
  if (await verifyPin(pin, state.salt, state.pinHash)) {
    return { kind: "success" as const };
  }
  const next = recordFailedAttempt(state, now);
  return { kind: "failure" as const, next };
}
