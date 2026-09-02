export function checkSetup(root: string, env: Record<string, string | undefined>, mode?: string): string[];
export function makeVercelConfig(env: { VITE_FIREBASE_PROJECT_ID: string }): { rewrites: { source: string; destination: string }[] };
