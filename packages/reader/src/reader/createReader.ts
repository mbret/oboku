import { fontsEnhancer, FONT_JUSTIFICATION, FONT_WEIGHT } from './enhancers/fonts'
import { linksEnhancer } from './enhancers/links'
import { navigationEnhancer } from './enhancers/navigation'
import { paginationEnhancer } from './enhancers/pagination'
import { Theme, themeEnhancer } from './enhancers/theme'
import { composeEnhancer } from './enhancers/utils'
import { createReader as createInternalReader } from './reader'

type ReaderPublicApi = ReturnType<typeof createInternalReader>

export type Enhancer<Ext = {}> = (next: EnhancerCreator<Ext>) => EnhancerCreator<Ext>

export type EnhancerCreator<Ext = {}> = (
  options: {
    containerElement: HTMLElement,
    fontScale?: number,
    lineHeight?: number,
    fontWeight?: typeof FONT_WEIGHT[number],
    fontJustification?: typeof FONT_JUSTIFICATION[number],
    theme?: Theme,
  },
) => ReaderPublicApi & Ext

function createReader<Ext>(
  options: {
    containerElement: HTMLElement,
  },
  enhancer?: Enhancer<Ext>
): ReaderPublicApi & Ext {
  if (enhancer) return enhancer(createReader)(options) as ReaderPublicApi & Ext

  const reader = createInternalReader(options)

  return reader as ReaderPublicApi & Ext
}

/**
 * Only expose a subset of reader API in order to protect against
 * wrong manipulation.
 */
const exposeReader = <Api extends ReaderPublicApi>(reader: Api) => {
  const {
    context,
    readingOrderView,
    pagination,
    element,
    ...exposedReader
  } = reader

  return exposedReader
}

export const createReaderWithEnhancers = <Ext = {}>(options: {
  containerElement: HTMLElement,
  fontScale?: number,
  lineHeight?: number,
  fontWeight?: typeof FONT_WEIGHT[number],
  fontJustification?: typeof FONT_JUSTIFICATION[number],
  theme?: Theme,
}, enhancer?: Enhancer<Ext>) => {
  const internalEnhancer = composeEnhancer(
    paginationEnhancer,
    navigationEnhancer,
    linksEnhancer,
    fontsEnhancer,
    themeEnhancer,
  )

  if (enhancer) {
    return exposeReader(createReader(options, composeEnhancer(
      enhancer,
      internalEnhancer,
    )))
  } else {
    return exposeReader(createReader(options, internalEnhancer))
  }
}