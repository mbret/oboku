import { plugin as dropbox } from "./dropbox"
import { plugin as google } from "./google"
import { plugin as file } from "./local"
import uri from "./plugin-uri"
import { plugin as imhentai } from "./plugin-imhentai-front"
import { ObokuPlugin } from "./plugin-front"

const plugins: ObokuPlugin[] = []

plugins.push(file)
plugins.push(dropbox)
plugins.push(google)
plugins.push(uri)
plugins.push(imhentai)

export { plugins }
