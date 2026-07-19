import { isDebugEnabled } from "./isDebugEnabled.shared"

// Must run before any @prose-reader module loads: each package's `Report`
// snapshots `globalThis.__PROSE_READER_DEBUG` at import time, so this has to be
// the first import of the service worker entry to enable streamer/archive-reader
// logging.
globalThis.__PROSE_READER_DEBUG = isDebugEnabled()
