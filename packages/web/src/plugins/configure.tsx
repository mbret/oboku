import { plugin as dropbox } from "./dropbox"
import { plugin as google } from "./google"
import uri from "./plugin-uri"
import { plugin as imhentai } from "./plugin-imhentai-front"
import { ObokuPlugin } from "./plugin-front"

const plugins: ObokuPlugin[] = []

plugins.push(dropbox)
plugins.push(google)
plugins.push(uri)
plugins.push(imhentai)

export { plugins }
