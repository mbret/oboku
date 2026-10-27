import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { preview } from "vite"

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const webRoot = join(repoRoot, "apps", "web")
const SERVICE_WORKER_PATH = "service-worker.js"
const SETTLE_TIMEOUT_MS = 120_000

/**
 * Runs in the page. Resolves with the state the registered worker settles in:
 * `activated` once it installed, `redundant` when its install failed. Rejects
 * when the script throws while it loads.
 */
async function registerServiceWorker({ scriptUrl, timeoutMs }) {
  const registration = await navigator.serviceWorker.register(scriptUrl)
  const worker =
    registration.installing ?? registration.waiting ?? registration.active
  const isSettled = () =>
    worker.state === "activated" || worker.state === "redundant"

  return new Promise(function waitForSettledState(resolve) {
    if (isSettled()) return resolve(worker.state)

    setTimeout(function stopWaiting() {
      resolve(worker.state)
    }, timeoutMs)
    worker.addEventListener("statechange", function resolveOnceSettled() {
      if (isSettled()) resolve(worker.state)
    })
  })
}

const server = await preview({ root: webRoot, logLevel: "warn" })
const browser = await chromium.launch()

try {
  const origin = server.resolvedUrls?.local[0]

  if (!origin) throw new Error("vite preview did not report its URL.")

  const scriptUrl = new URL(SERVICE_WORKER_PATH, origin).href
  const page = await browser.newPage()

  await page.goto(scriptUrl)

  const state = await page.evaluate(registerServiceWorker, {
    scriptUrl,
    timeoutMs: SETTLE_TIMEOUT_MS,
  })
  const isActivated = state === "activated"

  if (!isActivated) {
    throw new Error(
      `The built service worker ended up "${state}" instead of "activated": its install failed or did not finish.`,
    )
  }

  console.log("The built service worker installed and activated.")
} catch (error) {
  console.error(
    [
      ``,
      `The built service worker failed to register or to install.`,
      ``,
      `  ${error instanceof Error ? error.message : String(error)}`,
      ``,
      `Run pnpm build:web, then pnpm --filter @oboku/web preview, and open the`,
      `service worker under Application in the browser's developer tools to see`,
      `why.`,
      ``,
    ].join("\n"),
  )
  process.exitCode = 1
} finally {
  await browser.close()
  await server.close()
}
