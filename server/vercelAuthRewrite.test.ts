import { describe, expect, it } from "vitest";
import { makeVercelConfig } from "../shared/setup.mjs";

type Rewrite = { source: string; destination: string };

describe("Vercel Firebase 인증 프록시", () => {
  it("Firebase 인증 경로를 SPA보다 먼저 같은 출처로 전달한다", () => {
    const config = makeVercelConfig({ VITE_FIREBASE_PROJECT_ID: "sample-school-2026" }) as { rewrites: Rewrite[] };

    const authRewriteIndex = config.rewrites.findIndex(
      (rewrite) => rewrite.source === "/__/auth/:path*",
    );
    const spaRewriteIndex = config.rewrites.findIndex(
      (rewrite) => rewrite.destination === "/index.html",
    );

    expect(config.rewrites[authRewriteIndex]?.source).toBe("/__/auth/:path*");
    expect(config.rewrites[authRewriteIndex]?.destination).toBe(
      "https://sample-school-2026.firebaseapp.com/__/auth/:path*",
    );
    expect(authRewriteIndex).toBeGreaterThanOrEqual(0);
    expect(spaRewriteIndex).toBeGreaterThan(authRewriteIndex);
    expect(config.rewrites[spaRewriteIndex]?.source).toContain("__/auth/");
  });
});
