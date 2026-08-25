/**
 * Every push to master releases: the analyzer falls through to a patch bump
 * for any commit that is not a feature or a breaking change, instead of the
 * default behavior of skipping chore/docs-only pushes.
 */

/**
 * The conventionalcommits preset hides every type it is not told about, so a
 * type missing from this list is silently dropped from the release notes
 * rather than rendered under a fallback section. The list therefore has to
 * cover the informal spellings that land here alongside the canonical types
 * (`bugfix`, `deps`, `infra` from bots and agents), and must stay
 * exhaustive rather than be trimmed to the types currently in use.
 */
const releaseNoteSections = [
  { type: "feat", section: "Features" },
  { type: "feature", section: "Features" },
  { type: "fix", section: "Bug Fixes" },
  { type: "bugfix", section: "Bug Fixes" },
  { type: "hotfix", section: "Bug Fixes" },
  { type: "security", section: "Security" },
  { type: "perf", section: "Performance Improvements" },
  { type: "performance", section: "Performance Improvements" },
  { type: "revert", section: "Reverts" },
  { type: "refactor", section: "Code Refactoring" },
  { type: "deps", section: "Dependencies" },
  { type: "dep", section: "Dependencies" },
  { type: "dependencies", section: "Dependencies" },
  { type: "chore", section: "Chores" },
  { type: "build", section: "Build System" },
  { type: "ci", section: "Continuous Integration" },
  { type: "infra", section: "Continuous Integration" },
  { type: "docs", section: "Documentation" },
  { type: "doc", section: "Documentation" },
  { type: "style", section: "Styles" },
  { type: "test", section: "Tests" },
  { type: "tests", section: "Tests" },
]

export default {
  branches: ["master"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { breaking: true, release: "major" },
          { type: "feat", release: "minor" },
          { release: "patch" },
        ],
      },
    ],
    [
      // conventional-changelog-conventionalcommits must stay on v9: v10 emits
      // @conventional-changelog/template function partials, while
      // @semantic-release/release-notes-generator@14 still renders through
      // Handlebars (conventional-changelog-writer@8) and silently drops every
      // commit, leaving release notes with only a compare link.
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: { types: releaseNoteSections },
      },
    ],
    ["@semantic-release/npm", { npmPublish: false }],
    [
      "@semantic-release/git",
      {
        assets: ["package.json"],
        // biome-ignore lint/suspicious/noTemplateCurlyInString: semantic-release resolves this Lodash template placeholder, not JS
        message: "chore: release v${nextRelease.version}",
      },
    ],
    "@semantic-release/github",
  ],
}
