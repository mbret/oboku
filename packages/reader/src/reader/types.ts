import { Manifest } from "../types";

export type LoadOptions = {
  /**
   * Specify how you want to fetch resources for each spine item.
   * By default the reader will use an HTTP request with the uri provided in the manifest. We encourage
   * you to keep this behavior as it let the browser to optimize requests. Ideally you would serve your
   * content using a service worker or a backend service and the item uri will hit theses endpoints.
   * 
   * @example
   * - Web app with back end to serve content
   * - Web app with service worker to serve content via http interceptor
   * 
   * If for whatever reason you need a specific behavior for your items you can specify a function.
   * @example
   * - Web app without backend and no service worker
   * - Providing custom font, img, etc with direct import
   */
  fetchResource?: `http` | ((item: Manifest['readingOrder'][number]) => Promise<string>),
  /**
   * Specify how many spine items you want to preload.
   * Useful for pre-paginated where you want the user to have a smooth transition between items.
   * 
   * @important
   * Be careful when using this option with reflowable books since it can potentially add some
   * heavy work on the CPU. One reflowable book with several big chapter may slow down your app
   * significantly.
   */
  numberOfAdjacentSpineItemToPreLoad?: number,
}

export { Manifest }