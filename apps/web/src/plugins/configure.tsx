import { plugin as dropbox } from "./dropbox"
import { plugin as google } from "./google"
import { plugin as file } from "./local"
import uri from "./uri"
import type { ObokuPlugin } from "./types"

const plugins: ObokuPlugin[] = []

plugins.push(file)
plugins.push(dropbox)
plugins.push(google)
plugins.push(uri)

export { plugins }
