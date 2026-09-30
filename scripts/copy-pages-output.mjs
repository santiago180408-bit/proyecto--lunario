import { cp, rm, readdir } from "node:fs/promises";
import { join } from "node:path";

await rm("dist", { recursive: true, force: true });
await cp("out", "dist", { recursive: true });

// Windows exports catch-all segment payloads as directories. The Next client
// requests the dotted filename on static hosts; retain both representations.
async function copySegmentAliases(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "_next") continue;
    const child = join(directory, entry.name);
    if (entry.name.startsWith("__next.")) {
      for (const file of await readdir(child)) {
        if (file.endsWith(".txt")) {
          await cp(join(child, file), join(directory, `${entry.name}.${file}`));
        }
      }
    } else {
      await copySegmentAliases(child);
    }
  }
}
await copySegmentAliases("dist");
console.log("Cloudflare Pages assets copied to dist/.");
