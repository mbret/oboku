/**
 * Every push to master releases: the analyzer falls through to a patch bump
 * for any commit that is not a feature or a breaking change, instead of the
 * default behavior of skipping chore/docs-only pushes.
 */
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
      { preset: "conventionalcommits" },
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
