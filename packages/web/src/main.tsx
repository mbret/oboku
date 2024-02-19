// import "./debug"
// import "./tracking"
import React from "react"
import { createRoot } from "react-dom/client"
// import "fontsource-roboto/300.css"
// import "fontsource-roboto/400.css"
// import "fontsource-roboto/500.css"
// import "fontsource-roboto/700.css"
// import "react-responsive-carousel/lib/styles/carousel.min.css"
// import "./index.css"
import { App } from "./App"
import * as Sentry from "@sentry/react"
// import { randomBytes, createHash } from "crypto-browserify"

// @ts-ignore
// window.crypto.randomBytes = randomBytes
// @ts-ignore
// window.crypto.createHash = createHash

const rootElm = document.getElementById("root")

console.log("sdf")
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
