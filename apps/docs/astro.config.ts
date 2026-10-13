import { satteri } from "@astrojs/markdown-satteri"
import starlight from "@astrojs/starlight"
import { defineConfig } from "astro/config"
import mermaid from "astro-mermaid"
import starlightLinksValidator from "starlight-links-validator"
import starlightLlmsTxt from "starlight-llms-txt"

export default defineConfig({
  site: "https://docs.oboku.me",
  trailingSlash: "never",
  markdown: {
    processor: satteri({
      features: {
        // The docs quote values a reader copies, such as env values, so quotes stay straight
        smartPunctuation: false,
        // `{ #id }` keeps the anchor GitBook gave a heading, which published links point to
        headingAttributes: true,
      },
    }),
  },
  integrations: [
    // astro-mermaid has to run before Starlight turns code blocks into Expressive Code
    mermaid({ enableLog: false }),
    starlight({
      title: "oboku",
      favicon: "/favicon.ico",
      head: [
        {
          tag: "link",
          attrs: { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/mbret/oboku",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/mbret/oboku/edit/develop/apps/docs/",
      },
      customCss: ["./src/styles/theme.css"],
      components: {
        PageTitle: "./src/components/PageTitle.astro",
      },
      routeMiddleware: "./src/routeData.ts",
      plugins: [starlightLinksValidator(), starlightLlmsTxt()],
      sidebar: [
        "index",
        "contacts",
        "support",
        "platform-and-tech",
        {
          label: "Cloud",
          items: ["cloud/installation-and-usage"],
        },
        {
          label: "Self Hosting",
          items: [
            "self-hosting/installation",
            {
              label: "Configuration",
              items: [
                { label: "Overview", slug: "self-hosting/configuration" },
                "self-hosting/configuration/environment-variables",
                "self-hosting/configuration/enable-features",
                "self-hosting/configuration/dropbox",
                "self-hosting/configuration/microsoft-and-one-drive",
              ],
            },
            "self-hosting/account-sign-in-sign-up",
            "self-hosting/admin",
            "self-hosting/user-accounts",
            "self-hosting/opds-server",
            "self-hosting/server-sync",
            "self-hosting/changelog",
          ],
        },
        {
          label: "Guides",
          items: [
            "guides/adding-a-book",
            "guides/resources-matching-and-sync",
            "guides/metadata-sources",
            "guides/privacy-and-parental-secure-control",
            "guides/directives",
            "guides/secrets",
            "guides/koreader-sync-server",
            "guides/connectors",
            "guides/collections",
            "guides/tags",
            "guides/books",
            "guides/datasources",
            "guides/reader",
            "guides/storage",
            "guides/supported-contents",
          ],
        },
        {
          label: "Sync Providers",
          items: [
            "sync-providers/webdav",
            "sync-providers/google-drive",
            "sync-providers/dropbox",
            "sync-providers/one-drive",
            "sync-providers/synology-ds-file",
            "sync-providers/synology-drive",
            "sync-providers/server-files-self-host",
            "sync-providers/opds",
          ],
        },
        {
          label: "Development",
          items: [
            "development/local-profile",
            "development/local-database",
            "development/covers-cache",
            "development/authentication",
            "development/preview-environment",
          ],
        },
      ],
    }),
  ],
})
