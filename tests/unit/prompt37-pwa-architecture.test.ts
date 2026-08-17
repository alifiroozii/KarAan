import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Prompt 37 production PWA architecture guards", () => {
  it("ships required installable app icons", () => {
    expect(existsSync(join(process.cwd(), "public/icon-192.png"))).toBe(true);
    expect(existsSync(join(process.cwd(), "public/icon-512.png"))).toBe(true);
    expect(existsSync(join(process.cwd(), "public/apple-touch-icon.png"))).toBe(true);
    expect(existsSync(join(process.cwd(), "public/badge-96.png"))).toBe(true);
  });

  it("uses a root-scoped Persian standalone manifest", () => {
    const manifest = JSON.parse(source("public/manifest.json"));
    expect(manifest.id).toBe("/");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.lang).toBe("fa");
    expect(manifest.dir).toBe("rtl");
    expect(manifest.icons.some((icon: { sizes: string }) => icon.sizes === "192x192")).toBe(true);
    expect(manifest.icons.some((icon: { sizes: string }) => icon.sizes === "512x512")).toBe(true);
  });

  it("never caches API or realtime requests", () => {
    const worker = source("public/sw.js");
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    expect(worker).toContain('url.pathname.startsWith("/socket.io/")');
    expect(worker).toContain('request.mode === "navigate"');
    expect(worker).toContain('fetch(request).catch(() => caches.match("/offline.html"))');
  });

  it("only cache-firsts explicit PWA and immutable Next static assets", () => {
    const worker = source("public/sw.js");
    expect(worker).toContain('url.pathname.startsWith("/_next/static/")');
    expect(worker).toContain("PRECACHE.includes(url.pathname)");
    expect(worker).not.toContain("caches.match(request).then");
  });

  it("supports safe push notification presentation and click routing", () => {
    const worker = source("public/sw.js");
    expect(worker).toContain('self.addEventListener("push"');
    expect(worker).toContain('self.addEventListener("notificationclick"');
    expect(worker).toContain('!rawUrl.startsWith("//")');
    expect(worker).toContain('badge: "/badge-96.png"');
  });

  it("registers the worker only in production without script caching", () => {
    const registration = source("src/components/common/pwa-registration.tsx");
    expect(registration).toContain('process.env.NODE_ENV !== "production"');
    expect(registration).toContain('navigator.serviceWorker.register("/sw.js"');
    expect(registration).toContain('updateViaCache: "none"');
  });

  it("serves service-worker headers that allow safe root updates", () => {
    const config = source("next.config.ts");
    expect(config).toContain('source: "/sw.js"');
    expect(config).toContain('"public, max-age=0, must-revalidate"');
    expect(config).toContain('key: "Service-Worker-Allowed", value: "/"');
  });
});
