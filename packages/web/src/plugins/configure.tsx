import { plugin as dropbox } from "./dropbox"
import { plugin as google } from "./google"
import { plugin as file } from "./local"
import uri from "./plugin-uri"
import { ObokuPlugin } from "./plugin-front"

const plugins: ObokuPlugin[] = []

plugins.push(file)
plugins.push(dropbox)
plugins.push(google)
plugins.push(uri)

export { plugins }
