import { existsSync, readdirSync, rmSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const generatedDirectoryNames = [
  "node_modules",
  ".nx",
  ".pnpm-store",
  ".next",
  ".cache",
  ".turbo",
  ".vite",
  ".vitest",
  "build",
  "coverage",
  "dist",
]
const workspaceGroupNames = ["apps", "packages"]
const isDryRun = process.argv.includes("--dry-run")

function getWorkspaceDirectories(groupName) {
  const groupDirectory = join(repoRoot, groupName)

  if (!existsSync(groupDirectory)) {
    return []
  }

  return readdirSync(groupDirectory, { withFileTypes: true })
    .filter(function isWorkspaceDirectory(entry) {
      return (
        entry.isDirectory() &&
        existsSync(join(groupDirectory, entry.name, "package.json"))
      )
    })
    .map(function getWorkspaceDirectory(entry) {
      return join(groupDirectory, entry.name)
    })
}

const workspaceDirectories = workspaceGroupNames.flatMap(
  getWorkspaceDirectories,
)
const cleanupRoots = [repoRoot, ...workspaceDirectories]
const cleanupPaths = cleanupRoots.flatMap(
  function getCleanupPaths(cleanupRoot) {
    const generatedDirectories = generatedDirectoryNames.map(
      function getDirectory(directoryName) {
        return join(cleanupRoot, directoryName)
      },
    )
    const incrementalBuildFiles = existsSync(cleanupRoot)
      ? readdirSync(cleanupRoot)
          .filter(function isIncrementalBuildFile(fileName) {
            return (
              fileName.endsWith(".tsbuildinfo") || fileName === ".eslintcache"
            )
          })
          .map(function getIncrementalBuildFile(fileName) {
            return join(cleanupRoot, fileName)
          })
      : []

    return [
      ...generatedDirectories,
      ...incrementalBuildFiles,
      join(cleanupRoot, ".tanstack", "tmp"),
      join(cleanupRoot, ".vercel", "cache"),
      join(cleanupRoot, ".vercel", "output"),
    ]
  },
)
const existingCleanupPaths = cleanupPaths.filter(existsSync)

for (const cleanupPath of existingCleanupPaths) {
  console.log(
    `${isDryRun ? "Would remove" : "Removing"} ${relative(repoRoot, cleanupPath)}`,
  )

  if (!isDryRun) {
    rmSync(cleanupPath, { recursive: true, force: true })
  }
}

if (existingCleanupPaths.length === 0) {
  console.log("Nothing to remove")
}
