import { plugin as dropbox } from "./dropbox"
import { plugin as google } from "./google"
import linkPlugin from "./plugin-link"
import { plugin as imhentai } from "./plugin-imhentai-front"
import { ObokuPlugin } from "./plugin-front"

const plugins: ObokuPlugin[] = []

plugins.push(dropbox)
plugins.push(google)
plugins.push(linkPlugin)
plugins.push(imhentai)

export { plugins }
