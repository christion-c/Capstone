#!/usr/bin/env node
// This project's real TypeScript compiler (see the "typescript" devDependency,
// currently 7.x, the new Go-based native compiler) is newer than what
// typescript-eslint can parse with today: typescript-eslint hard-fails on
// TS >= 7.0 pending https://github.com/typescript-eslint/typescript-eslint/issues/10940,
// and its own peerDependency range (">=4.8.4 <6.1.0") can't stretch to cover it.
//
// We don't want to downgrade the project's actual compiler just to satisfy a
// linter, so instead this installs a second, TS-eslint-compatible copy of
// typescript *nested inside typescript-eslint's own node_modules*. Node's
// module resolution walks up from the requiring file, so typescript-eslint
// (and its @typescript-eslint/* sub-packages, which npm also nests under the
// same folder) will resolve to this nested copy, while every other part of
// the project (tsc, tsx, ...) keeps resolving the real top-level TypeScript
// install untouched. Delete this file (and its "postinstall" entry in
// package.json) once typescript-eslint ships native TS 7 support.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHIM_TYPESCRIPT_VERSION = "5.9.3";

const backendRoot = path.resolve(fileURLToPath(import.meta.url), "../..");
const typescriptEslintDir = path.join(
  backendRoot,
  "node_modules",
  "typescript-eslint",
);

if (!existsSync(typescriptEslintDir)) {
  // typescript-eslint isn't installed (e.g. a production-only install) -
  // nothing to shim.
  process.exit(0);
}

const nestedTypescriptPkgJson = path.join(
  typescriptEslintDir,
  "node_modules",
  "typescript",
  "package.json",
);

const alreadyShimmed =
  existsSync(nestedTypescriptPkgJson) &&
  JSON.parse(readFileSync(nestedTypescriptPkgJson, "utf8")).version ===
    SHIM_TYPESCRIPT_VERSION;

if (alreadyShimmed) {
  process.exit(0);
}

const result = spawnSync(
  "npm",
  [
    "install",
    `typescript@${SHIM_TYPESCRIPT_VERSION}`,
    "--no-save",
    "--ignore-scripts",
  ],
  {
    cwd: typescriptEslintDir,
    stdio: "inherit",
  },
);

if (result.status !== 0) {
  console.error(
    "setup-lint-typescript-shim: failed to install the typescript-eslint TS shim.",
  );
  process.exit(result.status ?? 1);
}
