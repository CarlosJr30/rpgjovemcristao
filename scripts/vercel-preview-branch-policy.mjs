#!/usr/bin/env node
// Vercel "Ignored Build Step": exit 0 = skip deployment; exit 1 = build.
// This is branch filtering, NOT a gate on GitHub Actions test completion.
const env = process.env.VERCEL_ENV;
const branch = process.env.VERCEL_GIT_COMMIT_REF || "";
if (env === "production") {
  // Keep existing production-branch behavior unchanged.
  console.log("Production: keep existing Vercel behavior.");
  process.exit(1);
}
if (env !== "preview") {
  console.log("Unknown or non-preview environment: skip.");
  process.exit(0);
}
if (/^preview\/[a-zA-Z0-9._/-]+$/.test(branch) && !branch.split("/").includes("..")) {
  console.log("Preview branch allowed; tests must still be checked separately.");
  process.exit(1);
}
console.log("Non-preview development branch: skip deployment.");
process.exit(0);
