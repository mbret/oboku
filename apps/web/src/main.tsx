import "./debug"
import "./debug/tracking"
import React from "react"
import { createRoot } from "react-dom/client"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/400.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"
import "./main.css"
import "./common/animations.css"
import { AppWithConfig } from "./App"
import { ErrorBoundary } from "@sentry/react"
import { purgeStagedFiles } from "@oboku/archive-metadata/web"
import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import { activateLocale } from "./i18n/activateLocale"
import { pickSupportedLocale } from "./i18n/supportedLocales"
import { installPrompt$ } from "./common/browser"

void purgeStagedFiles()

// The browser usually offers the install around page load, long before the
// profile screen that shows the offer mounts.
installPrompt$.subscribe()

await activateLocale(pickSupportedLocale(navigator.languages))

const rootElm = document.getElementById("root")

if (rootElm) {
  const root = createRoot(rootElm)

  root.render(
    <React.StrictMode>
      <I18nProvider i18n={i18n}>
        <ErrorBoundary>
          <AppWithConfig />
        </ErrorBoundary>
      </I18nProvider>
    </React.StrictMode>,
  )
}
