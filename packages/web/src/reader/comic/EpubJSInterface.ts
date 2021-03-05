import { Engine } from "./Engine";
import { Rendition, Contents, Book,  } from "epubjs"
export type RenditionOptions = NonNullable<Parameters<Book['renderTo']>[1]>

type Loaded = Book['loaded']
type Spine = Book['spine']
type Section = Parameters<Rendition['injectIdentifier']>[1]

class RenditionBridge {
  public engine: Engine
  public book: Book
  settings: any;
  themes: any;
  annotations: any;
  epubcfi: any;
  q: any = {
    enqueue: () => { }
  }
  location: any;
  started = new Promise<void>(_ => { })

  constructor(engine: Engine, book: Book, options: RenditionOptions) {
    this.engine = engine
    this.book = book
  }

  public getRendition() {

  }

  /**
   * @fallback epubjs
   */
  public currentLocation(): any {
    return Promise.resolve({
      // this is a weird info that seems to not be valid
      // only used for type compliance but even epubjs does not return that
      index: -1,
      href: '',
      cfi: '',
      displayed: {
        page: -1,
        total: -1
      },
      ...this.engine._currentLocation,
    })
  }

  // public get book(): Book {
  //   return this
  // }

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

  public get hooks(): any {
    return {
      content: {
        register: () => { },
        deregister: () => { },
        cfiFromPercentage: this.engine.getCfiFromPercentage
      },
      render: {
        register: () => { },
        deregister: () => { },
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

  public destroy() {
    this.engine.destroy()
  }

  public adjustImages(contents: Contents) {
    return Promise.resolve()
  }

  public attachTo(element: Element) {
    return Promise.resolve()
  }

  public clear() { }

  public determineLayoutProperties(metadata: object) {
    return Promise.resolve()
  }

  public direction(dir: string) { }

  public display(target?: string | number) {
    return this.engine.display(target)
  }

  public flow(flow: string) { }

  public getContents(): Contents {
    // @todo should be Contents
    return {} as any
  }

  public getRange(cfi: string, ignoreClass?: string): Range {
    return {} as any
  }

  public handleLinks(contents: Contents) { }

  public injectIdentifier(doc: Document, section: Section) { }

  public injectScript(doc: Document, section: Section) { }

  public injectStylesheet(doc: Document, section: Section) { }

  public layout(settings: any) { }

  public located(location: any): any {
    return Promise.resolve({} as any)
  }

  public moveTo(offset: number) { }

  public next() {
    return this.engine.next()
  }

  public onOrientationChange(orientation: string) { }

  public passEvents(contents: Contents) { }

  public prev() {
    return this.engine.prev()
  }

  public reportLocation() {
    return Promise.resolve()
  }

  public requireManager(manager: string | Function | object) { }

  public requireView(view: string | Function | object) { }

  public resize(width: number, height: number) { }

  public setManager(manager: Function) { }

  public spread(spread: string, min?: number) { }

  public start() { }

  public views() {
    return [] as any
  }

  // Event emitters
  public emit(type: any, ...args: any[]) { }

  public off(type: any, listener: any) { 
    return this.engine.off(type, listener)
  }

  public on(type: any, listener: any) {
    return this.engine.on(type, listener)
  }

  public once(type: any, listener: any, ...args: any[]) { }
}

// packages/web/node_modules/epubjs/types/spine.d.ts
class SpineBridge {
  constructor(private engine: Engine) {
    this.engine = engine
  }

  get(target?: string | number) {
    const file = (this.engine.files$.value || [])[target || 0]
    if (file) {
      return {
        href: file.name
      }
    }
  }
}

class BookBridge {
  engine: Engine
  spine: SpineBridge

  constructor(engine: Engine) {
    this.engine = engine
    this.spine = new SpineBridge(engine)
  }

  public get packaging() {
    return this.engine.packaging
  }

  public get displayOptions() {
    return {
      fixedLayout: this.engine.packaging.metadata.layout === 'pre-paginated'
    }
  }

  public get loaded(): Pick<Loaded, 'navigation'> {
    return {
      navigation: Promise.resolve({ toc: [], ...{} as any })
    }
  }
}

export class EpubJSInterface extends Engine {
  public rendition: Rendition
  public book: BookBridge

  constructor() {
    super()
    this.book = new BookBridge(this)
    this.rendition = (new RenditionBridge(this, this.book as any, {})) as unknown as Rendition
  }
}