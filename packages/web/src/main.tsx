import "./debug"
import "./debug/tracking"
import React from "react"
import { createRoot } from "react-dom/client"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/400.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"
import "react-responsive-carousel/lib/styles/carousel.min.css"
import "./main.css"
import "./common/animations.css"
import { App } from "./App"
import * as Sentry from "@sentry/react"

const rootElm = document.getElementById("root")

if (rootElm) {
  const root = createRoot(rootElm)

  root.render(
    <React.StrictMode>
      <Sentry.ErrorBoundary>
        <App />
      </Sentry.ErrorBoundary>
    </React.StrictMode>
  )
}
