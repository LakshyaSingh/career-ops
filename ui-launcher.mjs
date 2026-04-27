#!/usr/bin/env node
/**
 * Career-Ops UI launcher.
 *
 * Boots the Next.js dev server inside `ui/`, waits for it to be ready,
 * and opens the user's default browser to the local URL.
 *
 * Run from the career-ops repo root:
 *   npm run ui
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiDir = path.join(__dirname, "ui");

if (!existsSync(path.join(uiDir, "node_modules"))) {
  console.log("📦 First run — installing UI dependencies...");
  const install = spawn("npm", ["install"], {
    cwd: uiDir,
    stdio: "inherit",
  });
  install.on("close", (code) => {
    if (code !== 0) process.exit(code ?? 1);
    startDev();
  });
} else {
  startDev();
}

function startDev() {
  const port = process.env.PORT ?? "3000";
  const url = `http://localhost:${port}`;

  console.log(`\n🚀 Starting Career-Ops UI at ${url}\n`);

  const dev = spawn("npm", ["run", "dev", "--", "--port", port], {
    cwd: uiDir,
    stdio: ["inherit", "pipe", "inherit"],
    env: { ...process.env, PORT: port },
  });

  let opened = false;
  dev.stdout?.on("data", (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);
    // Open the browser the moment Next reports it's ready.
    if (!opened && /Ready|Local:/i.test(text)) {
      opened = true;
      openBrowser(url);
    }
  });

  // Hard fallback in case the "Ready" string changes upstream.
  setTimeout(() => {
    if (!opened) {
      opened = true;
      openBrowser(url);
    }
  }, 8000);

  const shutdown = () => {
    dev.kill("SIGINT");
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function openBrowser(url) {
  const cmd =
    platform() === "darwin"
      ? "open"
      : platform() === "win32"
        ? "cmd"
        : "xdg-open";
  const args = platform() === "win32" ? ["/c", "start", url] : [url];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
  } catch {
    // No browser autopen — user can click the URL above.
  }
}
