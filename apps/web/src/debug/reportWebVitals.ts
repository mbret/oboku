import { logEvent } from "firebase/analytics"
import { type Metric, onCLS, onFID, onLCP } from "web-vitals"
import { analytics } from "./tracking"
import { Logger } from "./logger.shared"

const onReport = (props: Metric) => {
  Logger.log(props)

  const { name, delta, id } = props

  if (!analytics) return

  logEvent(analytics, name, {
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
    transport: "beacon",

    // OPTIONAL: any additional params or debug info here.
    // See: https://web.dev/debug-web-vitals-in-the-field/
    // dimension1: '...',
    // dimension2: '...',
    // ...
  })
}

onCLS(onReport)
onFID(onReport)
onLCP(onReport)
