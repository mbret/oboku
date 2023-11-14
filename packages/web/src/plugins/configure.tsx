import { plugin as dropbox } from "./dropbox"
import { plugin as google } from "./google"
import linkPlugin from "./plugin-link"
import { ObokuPlugin } from "@oboku/plugin-front"
import { plugin as imhentai } from "@oboku/plugin-imhentai-front"

const plugins: ObokuPlugin[] = []

plugins.push(dropbox)
plugins.push(google)
plugins.push(linkPlugin)
plugins.push(imhentai)

export { plugins }
