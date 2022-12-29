import "./debug"
import React from "react"
import { createRoot } from "react-dom/client"
import "fontsource-roboto/300.css"
import "fontsource-roboto/400.css"
import "fontsource-roboto/500.css"
import "fontsource-roboto/700.css"
import "react-responsive-carousel/lib/styles/carousel.min.css"
import "./index.css"
import { App } from "./App"
import reportWebVitals from "./reportWebVitals"
import * as Sentry from "@sentry/react"
import { randomBytes, createHash } from "crypto-browserify"
import ReactGA from "react-ga"

// @ts-ignore
window.crypto.randomBytes = randomBytes
// @ts-ignore
window.crypto.createHash = createHash

ReactGA.initialize("UA-43281094-4")

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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(({ id, name, delta }) => {
  // @see https://github.com/GoogleChrome/web-vitals#send-the-results-to-google-analytics
  ReactGA.event({
    category: `Web Vitals`,
    action: name,
    // The `id` value will be unique to the current page load. When sending
    // multiple values from the same page (e.g. for CLS), Google Analytics can
    // compute a total by grouping on this ID (note: requires `eventLabel` to
    // be a dimension in your report).
    label: id,
    // Google Analytics metrics must be integers, so the value is rounded.
    // For CLS the value is first multiplied by 1000 for greater precision
    // (note: increase the multiplier for greater precision if needed).
    value: Math.round(name === "CLS" ? delta * 1000 : delta),
    // Use a non-interaction event to avoid affecting bounce rate.
    nonInteraction: true,
    // Use `sendBeacon()` if the browser supports it.
    transport: "beacon"

    // OPTIONAL: any additional params or debug info here.
    // See: https://web.dev/debug-web-vitals-in-the-field/
    // dimension1: '...',
    // dimension2: '...',
    // ...
  })
})
