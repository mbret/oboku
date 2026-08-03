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
