// One-command local flow: fresh build, then serve vinext on :3002
// behind fix-server.js on :3000.
//
//   node scripts/serve-all.mjs            (build + serve both)
//   node scripts/serve-all.mjs --skip-build   (serve both, no rebuild)
//
// Works from PowerShell, cmd, Git Bash and sh. Exits non-zero if the
// build fails or either server dies.

import { spawn, spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SKIP_BUILD = process.argv.includes("--skip-build");
const VINEXT_PORT = 3002;
const PROXY_PORT = 3000;

function log(tag, msg) {
  process.stdout.write(`[${tag}] ${msg}\n`);
}

function pipeTo(child, tag) {
  for (const stream of [child.stdout, child.stderr]) {
    if (!stream) continue;
    stream.on("data", (d) => {
      for (const line of String(d).split("\n")) {
        if (line.trim()) log(tag, line);
      }
    });
  }
}

// Best-effort: free a TCP port before binding.
function freePort(port) {
  try {
    if (process.platform === "win32") {
      spawnSync(
        "powershell",
        [
          "-NoProfile",
          "-Command",
          `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`,
        ],
        { stdio: "ignore" }
      );
    } else {
      spawnSync("sh", ["-c", `lsof -ti tcp:${port} | xargs -r kill`], {
        stdio: "ignore",
      });
    }
  } catch {
    // Non-fatal: binding will fail loudly if the port is still taken.
  }
}

function runBuild() {
  log("build", "running vinext build...");
  const npm = process.platform === "win32" ? "npx.cmd" : "npx";
  const r = spawnSync(npm, ["vinext", "build"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    log("build", "FAILED — fix the errors above, servers not started.");
    process.exit(r.status ?? 1);
  }
  log("build", "complete.");
}

async function waitFor(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      // Any HTTP response (even 404/500) means the server is up.
      if (res.status) return true;
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  freePort(VINEXT_PORT);
  freePort(PROXY_PORT);

  if (!SKIP_BUILD) runBuild();

  const env = {
    ...process.env,
    PORT: String(VINEXT_PORT),
    WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
  };

  log("vinext", `starting on :${VINEXT_PORT}...`);
  const vinextBin =
    process.platform === "win32" ? "npx.cmd" : "npx";
  const vinext = spawn(vinextBin, ["vinext", "start"], {
    cwd: ROOT,
    env,
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });
  pipeTo(vinext, "vinext");

  const up = await waitFor(`http://127.0.0.1:${VINEXT_PORT}/`, 90000);
  if (!up) {
    log("vinext", `did not respond on :${VINEXT_PORT} within 90s — aborting.`);
    vinext.kill();
    process.exit(1);
  }
  log("vinext", `up on :${VINEXT_PORT}.`);

  log("proxy", `starting fix-server on :${PROXY_PORT}...`);
  const proxy = spawn(process.execPath, ["fix-server.js"], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  pipeTo(proxy, "proxy");

  const shutdown = (code) => {
    vinext.kill();
    proxy.kill();
    process.exit(code);
  };
  vinext.on("exit", (code) => {
    log("vinext", `exited (${code}) — shutting down.`);
    shutdown(code ?? 1);
  });
  proxy.on("exit", (code) => {
    log("proxy", `exited (${code}) — shutting down.`);
    shutdown(code ?? 1);
  });
  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));

  log("serve", `ready → app: http://127.0.0.1:${PROXY_PORT} (via vinext :${VINEXT_PORT})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
