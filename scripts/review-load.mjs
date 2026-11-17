import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";

const run = promisify(execFile);
const git = async (...args) =>
  (
    await run("git", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
  ).stdout.trim();
const base = process.argv[2] ?? "main";
const excluded =
  /(^|\/)(node_modules|dist|dist-ssr|playwright-report|test-results|\.desloppify|\.venv)\/|(^|\/)(package-lock\.json|.*\.(?:png|jpe?g|webp|gif|zip|woff2?|mp4))$/;
const rows = (
  await git(
    "diff",
    "--numstat",
    "-w",
    "--ignore-blank-lines",
    "--find-renames",
    base,
    "--",
  )
)
  .split("\n")
  .filter(Boolean)
  .map((row) => {
    const [added, removed, ...path] = row.split("\t");
    return {
      path: path.join("\t"),
      added: Number(added) || 0,
      removed: Number(removed) || 0,
    };
  });
for (const path of (await git("ls-files", "--others", "--exclude-standard"))
  .split("\n")
  .filter(Boolean)) {
  if (excluded.test(path)) continue;
  const source = readFileSync(path, "utf8");
  if (source.includes("\0")) continue;
  rows.push({
    path,
    added: source.split("\n").filter((line) => line.trim()).length,
    removed: 0,
  });
}
const relevant = rows.filter(
  (row) => !excluded.test(row.path) && row.added + row.removed > 0,
);
const added = relevant.reduce((sum, row) => sum + row.added, 0);
const removed = relevant.reduce((sum, row) => sum + row.removed, 0);
console.log(
  `Review load vs ${base}: ${relevant.length} files, +${added} / -${removed}, ${added + removed} lines`,
);
console.log(
  "Whitespace, pure renames, lockfiles, binary assets, and build/report output discounted.",
);
for (const row of relevant.sort(
  (a, b) => b.added + b.removed - a.added - a.removed,
)) {
  console.log(`  +${row.added} / -${row.removed} ${row.path}`);
}
if (added + removed > 800)
  console.log(
    "Reviewer pressure: provide a slice-by-slice review map and verification evidence.",
  );
