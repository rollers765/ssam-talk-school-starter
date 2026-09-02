import { defineConfig } from 'vitest/config';
export default defineConfig({test:{include:['tests/firestore.emulator.spec.ts'],maxWorkers:1,testTimeout:15000}});
