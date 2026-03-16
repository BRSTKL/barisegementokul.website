import { spawn } from "node:child_process"

const childProcesses = []

startProcess("api", process.execPath, ["server/index.mjs"], {
  env: {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: "8787",
    SERVE_STATIC: "0",
  },
})

startProcess("vite", process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4173"])

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

function startProcess(label, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  })

  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.stderr.write(`[${label}] exited with code ${code}\n`)
      shutdown(code)
    }
  })

  childProcesses.push(child)
}

function shutdown(exitCode = 0) {
  childProcesses.forEach((child) => {
    if (!child.killed) {
      child.kill()
    }
  })

  process.exit(exitCode)
}
