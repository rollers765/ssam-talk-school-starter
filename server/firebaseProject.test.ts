import { describe, it, expect } from 'vitest';
describe('서버 Firebase 프로젝트 일치', () => {
  it('다른 프로젝트의 서비스 계정과 잘못된 JSON을 비밀값 노출 없이 거부한다', async () => {
    const { parseServiceAccount } = await import('./firebaseProject');
    const value={project_id:'sample-school-2026',client_email:'service@example.com',private_key:'fake-key'};
    expect(parseServiceAccount(JSON.stringify(value),'sample-school-2026').projectId).toBe('sample-school-2026');
    expect(()=>parseServiceAccount(JSON.stringify(value),'different-school')).toThrow('프로젝트');
    expect(()=>parseServiceAccount('{DO-NOT-PRINT-SECRET','sample-school-2026')).toThrow('설정');
    try { parseServiceAccount('{DO-NOT-PRINT-SECRET','sample-school-2026'); } catch(e) { expect(String(e)).not.toContain('DO-NOT-PRINT-SECRET'); }
  });
});
