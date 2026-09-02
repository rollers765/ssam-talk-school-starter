import { createHmac } from "node:crypto";

export function teacherKey(name: string, secret: string) {
  const normalized = name.trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
  return createHmac("sha256", secret).update(`teacher:${normalized}`).digest("hex");
}
