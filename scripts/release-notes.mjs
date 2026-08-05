/**
 * Emits the upgrade notes for one release, ready to paste into a GitHub
 * release body. Used by the publish-release job in deploy.yml.
 *
 * Usage: GITHUB_REPOSITORY=owner/repo node scripts/release-notes.mjs <version> <ref>
 *   e.g. GITHUB_REPOSITORY=mbret/oboku node scripts/release-notes.mjs 1.2.0 v1.2.0
 *
 * Steps:
 * 1. Read gitbook/self-hosting/changelog.md and extract the `## <version>`
 *    section (everything up to the next `## ` heading).
 * 2. Rewrite Markdown links that are relative to the changelog file
 *    (e.g. `../../docker-compose.yml`) into absolute
 *    `https://github.com/<repo>/blob/<ref>/...` URLs, since relative targets
 *    do not resolve on a release page. Absolute URLs, `#anchors` and
 *    `mailto:` links are left untouched.
 * 3. Print the result to stdout. If the changelog has no section for this
 *    version, print nothing (the caller then skips `--notes-file`).
 */
import { readFileSync } from "node:fs"
import { dirname, join, normalize } from "node:path"
import { fileURLToPath } from "node:url"

const [version, ref] = process.argv.slice(2)
const repository = process.env.GITHUB_REPOSITORY

if (!version || !ref || !repository) {
  console.error(
    "usage: GITHUB_REPOSITORY=owner/repo node scripts/release-notes.mjs <version> <ref>",
  )
  process.exit(1)
}

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const changelogPath = "gitbook/self-hosting/changelog.md"
const relativeLink = /\]\((?!https?:\/\/|#|mailto:)([^)\s]+)(?:\s+"[^"]*")?\)/g

function readVersionSection(changelog) {
  const lines = changelog.split("\n")
  const heading = lines.indexOf(`## ${version}`)

  if (heading === -1) {
    return ""
  }

  const body = lines.slice(heading + 1)
  const nextHeading = body.findIndex((line) => line.startsWith("## "))

  return (nextHeading === -1 ? body : body.slice(0, nextHeading)).join("\n")
}

function toBlobUrl(target) {
  const [path, anchor] = target.split("#")
  const fromRepoRoot = normalize(join(dirname(changelogPath), path)).replaceAll(
    "\\",
    "/",
  )

  return `https://github.com/${repository}/blob/${ref}/${fromRepoRoot}${anchor ? `#${anchor}` : ""}`
}

function withAbsoluteLinks(markdown) {
  return markdown.replace(
    relativeLink,
    (_, target) => `](${toBlobUrl(target)})`,
  )
}

const section = readVersionSection(
  readFileSync(join(repoRoot, changelogPath), "utf8"),
)

if (section.trim()) {
  process.stdout.write(`${withAbsoluteLinks(section).trim()}\n`)
}
