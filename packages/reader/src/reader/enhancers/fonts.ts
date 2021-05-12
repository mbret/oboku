import { Enhancer } from "../createReader";

export const fontsEnhancer: Enhancer<{
  setFontScale: (scale: number) => void
}> = (next) => (options) => {
  const { fontScale = 1 } = options
  const reader = next(options)
  let currentFontScale = fontScale

  reader.readingOrderView.registerReadingItemHook(`onLoad`, frame => {
    frame.contentDocument?.body.style.setProperty(`font-size`, `${currentFontScale}em`)
  })

  return {
    ...reader,
    /**
     * @description
     * Scale the font size. 1 means use default publisher/browser font size, 2 means 200%
     * 0.5 50%, etc
     * 
     * @param scale number [0, x > 0]
     */
    setFontScale: (scale: number) => {
      currentFontScale = scale
      reader.readingOrderView.manipulateReadingItem(frame => {
        frame.contentDocument?.body.style.setProperty(`font-size`, `${scale}em`)

        return true
      })
    }
  }
}