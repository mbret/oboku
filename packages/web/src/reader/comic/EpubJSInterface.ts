import { Engine } from "./Engine";

export class EpubJSInterface extends Engine {
  /**
   * @fallback epubjs
   */
  public currentLocation() {
    return this._currentLocation
  }

  /**
   * @fallback epubjs
   */
  public get book() {
    return this
  }

  /**
   * @fallback epubjs
   */
  public get navigation() {
    return {}
  }

  /**
   * @fallback epubjs
   */
  public get loaded() {
    return this
  }

  /**
   * @fallback epubjs
   */
  public getRange() {
    return undefined
  }

  /**
   * @fallback epubjs
   */
  public get reportLocation() {
    return () => { }
  }

  /**
   * @fallback epubjs
   */
  public get hooks() {
    return {
      content: {
        register: () => { },
        deregister: () => { },
        cfiFromPercentage: this.getCfiFromPercentage
      }
    }
  }

  /**
   * @fallback epubjs
   */
  public get locations() {
    return {
      load: () => { },
      generate: () => { },
    }
  }

  /**
   * @fallback epubjs
   */
  public get spine() {
    return {
      get: (page: number) => {
        const file = (this.files$.value || [])[page]
        if (file) {
          return {
            href: file.name
          }
        }
      },
    }
  }

  public destroy() {
    super.destroy()
  }

  public resize() {
    
  }
}