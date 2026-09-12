import { spawnSync } from "node:child_process";
import path from "node:path";

const incomingArgs = process.argv.slice(2);
const nextArgs = [];

for (let index = 0; index < incomingArgs.length; index += 1) {
  const argument = incomingArgs[index];

  if (argument === "--strictPort") {
    continue;
  }

  if (argument === "--host") {
    nextArgs.push("--hostname");
    continue;
  }

  nextArgs.push(argument);
}

const nextBinary = path.join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

const result = spawnSync(
  process.execPath,
  [nextBinary, "dev", ...nextArgs],
  {
    env: process.env,
    stdio: "inherit",
  },
);

if (result.error) {
  console.error("Gagal menjalankan Next.js development server.", result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
