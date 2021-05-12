import { Enhancer } from "../createReader";

export type Theme = (typeof defaultThemes[number])['name']

const defaultThemes = [
  {
    name: 'bright' as const,
    backgroundColor: 'white',
  },
  {
    name: `sepia` as const,
    backgroundColor: '#eaddc7',
    foregroundColor: 'black',
  },
  {
    name: `night` as const,
    backgroundColor: 'black',
    foregroundColor: 'white',
  },
]

export const themeEnhancer: Enhancer<{
  setTheme: (theme: Theme) => void,
}> = (next) => (options) => {
  const { theme } = options
  const reader = next(options)
  let currentTheme = theme

  const getStyle = () => {
    const foundTheme = defaultThemes.find(entry => entry.name === currentTheme)

    return `
      body {
        ${foundTheme !== undefined
        ? `background-color: ${foundTheme.backgroundColor} !important;`
        : ``}
      }
      ${foundTheme?.foregroundColor
        ? `
          body * {
            color: ${foundTheme.foregroundColor} !important;
          }
        `
        : ``}
    `
  }

  const applyChangeToReadingItem = () => {
    reader.readingOrderView.manipulateReadingItem(({ removeStyle, addStyle }) => {
      removeStyle('oboku-reader-theme')
      addStyle('oboku-reader-theme', getStyle())

      return false
    })
  }

  /**
   * Make sure to apply theme on item load
   */
  reader.readingOrderView.registerReadingItemHook(`onLoad`, ({ removeStyle, addStyle }) => {
    removeStyle('oboku-reader-theme')
    addStyle('oboku-reader-theme', getStyle())
  })

  return {
    ...reader,
    setTheme: (theme: Theme) => {
      currentTheme = theme
      applyChangeToReadingItem()
    },
  }
}