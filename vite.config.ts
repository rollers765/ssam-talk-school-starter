import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { schoolConfig } from "./shared/school-config.mjs";
import { renderMetadata } from "./shared/metadata.mjs";
import { checkSetup } from "./shared/setup.mjs";
import { fileURLToPath } from "node:url";

export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  return {
  plugins: [react(), {
    name: "school-settings",
    buildStart() {
      if (command === "build") {
        const errors = checkSetup(process.cwd(), env, mode === "demo" ? "demo" : "build");
        if (errors.length) throw new Error(errors.join("\n"));
      }
    },
    transformIndexHtml(html) { return renderMetadata(html, schoolConfig, env.VITE_SITE_URL || ""); },
  }],
  test: {
    // 회귀 검사는 고정 예시를 사용하고 실제 학교 설정은 check:setup에서 별도로 검사합니다.
    alias: [{ find: /^\.\.\/config\/school\.config\.json$/, replacement: fileURLToPath(new URL("./config/school.config.example.json", import.meta.url)) }],
    maxWorkers: 1,
    include: ["src/**/*.test.{ts,tsx}", "server/**/*.test.ts"],
  },
  };
});
