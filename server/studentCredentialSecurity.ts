import { verifyPin } from "./studentPinSecurity.js";

export type StudentCredentialRecord = {
  id: string;
  uid: string;
  salt?: string;
  pinHash?: string;
  registrationNumber?: number;
  resetRequired?: boolean;
  lockedUntil?: number | null;
};

export function nextRegistrationNumber(records: Array<Pick<StudentCredentialRecord, "registrationNumber">>) {
  const largest = records.reduce((maximum, record) => {
    const value = Number(record.registrationNumber || 1);
    return Number.isInteger(value) && value > maximum ? value : maximum;
  }, 0);
  return largest + 1;
}

export async function findMatchingCredential(pin: string, records: StudentCredentialRecord[], now: number) {
  for (const credential of records) {
    if (credential.resetRequired || !credential.salt || !credential.pinHash) continue;
    if (!await verifyPin(pin, credential.salt, credential.pinHash)) continue;
    const lockedUntil = Number(credential.lockedUntil || 0);
    if (lockedUntil > now) {
      return { kind: "locked" as const, minutes: Math.max(1, Math.ceil((lockedUntil - now) / 60000)) };
    }
    return { kind: "match" as const, credentialId: credential.id, uid: credential.uid };
  }
  return { kind: "none" as const };
}
