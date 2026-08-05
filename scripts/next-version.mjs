/**
 * Prints the version the current master build should release as. Used by the
 * bump-version job in deploy.yml. Requires full git history (fetch-depth: 0).
 *
 * Usage: node scripts/next-version.mjs
 *
 * Steps:
 * 1. Read the current version from the root package.json.
 * 2. If no `v<current>` tag exists, the version was bumped by hand and not
 *    released yet: print it unchanged.
 * 3. Otherwise look at the commits since that tag and derive the bump from
 *    conventional commit messages: `BREAKING CHANGE` / `type!:` -> major,
 *    `feat:` -> minor, anything else -> patch. Print the bumped version.
 * 4. If there are no commits since the tag there is nothing to release:
 *    print the current version unchanged (the release job will see the
 *    existing release and skip).
 */
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))

const git = (command) =>
  execSync(`git ${command}`, { cwd: repoRoot, encoding: "utf8" }).trim()

const printVersion = (version) => process.stdout.write(`${version}\n`)

const currentVersion = JSON.parse(
  readFileSync(join(repoRoot, "package.json"), "utf8"),
).version

const currentVersionIsUnreleased = git(`tag --list v${currentVersion}`) === ""

if (currentVersionIsUnreleased) {
  printVersion(currentVersion)
  process.exit(0)
}

const commitRange = `v${currentVersion}..HEAD`
const subjects = git(`log --format=%s ${commitRange}`)

if (subjects === "") {
  printVersion(currentVersion)
  process.exit(0)
}

const messages = git(`log --format=%B ${commitRange}`)
const hasBreakingChange =
  /^[a-z]+(\([^)]*\))?!:/m.test(subjects) || /^BREAKING CHANGE/m.test(messages)
const hasFeature = /^feat(\([^)]*\))?:/m.test(subjects)

const [major, minor, patch] = currentVersion.split(".").map(Number)

const nextVersion = hasBreakingChange
  ? `${major + 1}.0.0`
  : hasFeature
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`

printVersion(nextVersion)
