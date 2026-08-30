import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const forwarded = process.argv.slice(2);
const nextArguments = ["dev"];

for (let index = 0; index < forwarded.length; index += 1) {
  const argument = forwarded[index];

  if (argument === "--host" || argument === "--hostname") {
    nextArguments.push("--hostname", forwarded[index + 1] ?? "0.0.0.0");
    index += 1;
    continue;
  }

  if (argument === "--port") {
    nextArguments.push("--port", forwarded[index + 1] ?? "3000");
    index += 1;
    continue;
  }

  if (argument === "--strictPort") continue;
  nextArguments.push(argument);
}

const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const child = spawn(process.execPath, [nextCli, ...nextArguments], {
  stdio: "inherit",
  env: process.env,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
