import { Enhancer } from "../createReader";

export const FONT_WEIGHT = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const
export const FONT_JUSTIFICATION = ['center', 'left', 'right', 'justify'] as const

export const fontsEnhancer: Enhancer<{
  /**
   * @description
   * Scale the font size. 1 means use default publisher/browser font size, 2 means 200%
   * 0.5 50%, etc
   */
  setFontScale: (scale: number) => void,

  /**
   * @description
   * Set the line height of the text. The default value is 1
   */
  setLineHeight: (value: number | `default`) => void,

  /**
   * @description
   * Set font weight of text
   */
  setFontWeight: (value: typeof FONT_WEIGHT[number] | `default`) => void,

  /**
   * @description
   * Set text align justification
   */
  setFontJustification: (value: typeof FONT_JUSTIFICATION[number] | `default`) => void,
}> = (next) => (options) => {
  const { fontScale = 1, lineHeight, fontWeight, fontJustification } = options
  const reader = next(options)
  let currentFontScale = fontScale
  let currentLineHeight = lineHeight
  let currentFontWeight = fontWeight
  let currentJustification = fontJustification

  const getStyle = () => `
    body *:not([class^="mjx-"]) {
      font-size: ${currentFontScale}em !important;
      ${currentLineHeight !== undefined
      ? `line-height: ${currentLineHeight} !important;`
      : ``}
      ${currentFontWeight !== undefined
      ? `font-weight: ${currentFontWeight} !important;`
      : ``}
      ${currentJustification !== undefined
      ? `text-align: ${currentJustification} !important;`
      : ``}
    }
  `

  const applyChangeToReadingItem = (requireLayout: boolean) => {
    reader.manipulateReadingItems(({ removeStyle, addStyle }) => {
      removeStyle('oboku-reader-fonts')
      addStyle('oboku-reader-fonts', getStyle())

      return requireLayout
    })
  }

  reader.registerHook(`readingItem.onLoad`, ({ removeStyle, addStyle }) => {
    removeStyle('oboku-reader-fonts')
    addStyle('oboku-reader-fonts', getStyle())
  })

  return {
    ...reader,
    setFontScale: (scale: number) => {
      currentFontScale = scale
      applyChangeToReadingItem(true)
    },
    setLineHeight: (value: number | `default`) => {
      currentLineHeight = value === `default` ? undefined : value
      applyChangeToReadingItem(true)
    },
    setFontWeight: (value: typeof FONT_WEIGHT[number] | `default`) => {
      currentFontWeight = value === `default` ? undefined : value
      applyChangeToReadingItem(false)
    },
    setFontJustification: (value: typeof FONT_JUSTIFICATION[number] | `default`) => {
      currentJustification = value === `default` ? undefined : value
      applyChangeToReadingItem(false)
    }
  }
}