// Copy the built plugin into every local vault that has it installed.
// Vaults come from Obsidian's own registry (obsidian.json), so new vaults are picked up automatically.
// Usage: npm run deploy  (builds first)
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PLUGIN_ID = "review-comments";
const FILES = ["main.js", "manifest.json", "styles.css"];

const registry = join(homedir(), "Library/Application Support/obsidian/obsidian.json");
const vaults = Object.values(JSON.parse(readFileSync(registry, "utf8")).vaults ?? {}).map((v) => v.path);

let count = 0;
for (const vault of vaults) {
  const dir = join(vault, ".obsidian/plugins", PLUGIN_ID);
  if (!existsSync(dir)) continue;
  for (const f of FILES) if (existsSync(f)) copyFileSync(f, join(dir, f));
  console.log(`✓ ${vault}`);
  count++;
}
console.log(count ? `Deployed to ${count} vault(s). Reload the plugin (or Obsidian) to apply.` : "No vault has the plugin installed.");
