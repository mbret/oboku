import { Enhancer } from "../createReader";

export const firefoxEnhancer: Enhancer<{

}> = (next) => (options) => {
  const reader = next(options)

  // add all normalization

  return reader
}