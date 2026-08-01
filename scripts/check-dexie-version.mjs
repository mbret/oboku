import { existsSync, readFileSync, realpathSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const webNodeModules = join(repoRoot, "apps", "web", "node_modules")

function readInstalledVersion(packageDir) {
  return JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"))
    .version
}

const webDexie = join(webNodeModules, "dexie")
const rxdb = join(webNodeModules, "rxdb")

if (!existsSync(webDexie) || !existsSync(rxdb)) {
  process.exit(0)
}

const rxdbDir = realpathSync(rxdb)
const webDexieVersion = readInstalledVersion(realpathSync(webDexie))
const rxdbDexieVersion = readInstalledVersion(
  realpathSync(join(rxdbDir, "..", "dexie")),
)

if (webDexieVersion !== rxdbDexieVersion) {
  console.error(
    [
      ``,
      `Duplicate Dexie detected.`,
      ``,
      `  apps/web resolves dexie ${webDexieVersion}`,
      `  rxdb@${readInstalledVersion(rxdbDir)} resolves dexie ${rxdbDexieVersion}`,
      ``,
      `Both get bundled and Dexie throws "Two different versions of Dexie`,
      `loaded in the same app" as soon as the web app boots.`,
      ``,
      `Fix: set "dexie": "${rxdbDexieVersion}" in apps/web/package.json, then re-run pnpm install.`,
      ``,
    ].join("\n"),
  )
  process.exit(1)
}
