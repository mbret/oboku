import { createReader } from "@prose-reader/core"
import { gesturesEnhancer } from "@prose-reader/enhancer-gestures"

console.log = () => {}

const searchParams = new URLSearchParams(window.location.search)

const bookFile = searchParams.get("file")

const reader = gesturesEnhancer(createReader)({
  numberOfAdjacentSpineItemToPreLoad: 3,
})

;(async () => {
  const manifestResposne = await fetch(`${window.origin}/streamer/${bookFile}/manifest`)

  const manifest = await manifestResposne.json()

  reader.load({
    manifest,
    containerElement: document.getElementById("reader")!
  })
})()
