const { spawn } = require("child_process");
const path = require("path");

const SANDBOX_PATH = path.join(__dirname, "sandbox.py");
const TIMEOUT_MS = 5000;

/**
 * Run Python code in the sandbox.
 * Code is passed via stdin — never via -c or a temp file — so there is no
 * shell injection risk and no argument-length limit.
 *
 * @param {string} code Python source to execute
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
function runSandboxed(code) {
  return new Promise((resolve) => {
    const child = spawn("python", [SANDBOX_PATH], {
      env: {
        PYTHONIOENCODING: "utf-8",
        NO_COLOR: "1",
        PYTHON_COLORS: "0",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => {
      stdout += d;
    });
    child.stderr.on("data", (d) => {
      stderr += d;
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: timedOut ? "Execution timed out (5s limit)\n" : stderr,
        exitCode: timedOut ? 124 : (exitCode ?? 0),
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        stdout: "",
        stderr: `Failed to start Python sandbox: ${err.message}\n`,
        exitCode: 1,
      });
    });

    child.stdin.write(code, "utf8");
    child.stdin.end();
  });
}

module.exports = { runSandboxed };
