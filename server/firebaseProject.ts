import type { ServiceAccount } from 'firebase-admin/app';

export function parseServiceAccount(raw: string, expectedProject: string | undefined): ServiceAccount {
  let account: Record<string, unknown>;
  try { account = JSON.parse(raw); } catch { throw new Error('Firebase 서비스 계정 설정을 확인하세요.'); }
  if (!account || typeof account !== 'object' || !expectedProject || account.project_id !== expectedProject) throw new Error('Firebase 서비스 계정과 학교 프로젝트가 일치하지 않습니다.');
  if (typeof account.client_email !== 'string' || typeof account.private_key !== 'string') throw new Error('Firebase 서비스 계정 설정을 확인하세요.');
  return { projectId: expectedProject, clientEmail: account.client_email, privateKey: account.private_key };
}
