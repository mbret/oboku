import JSZip from 'jszip'
import { BehaviorSubject, Subject } from 'rxjs'
import { filter, first } from 'rxjs/operators'
import { load } from './Loader'
import { createRenderer, Renderer } from './Renderer'
import './style.css'
import { Report } from '../../report'
import { PromiseReturnType } from '../../types'

type Event = {
  name: string,
  cb: (data: any) => {}
}

type LoadableFiles = NonNullable<PromiseReturnType<typeof load>>['files']

export class Engine {
  protected container: HTMLElement | undefined
  // protected loaded = new Loader()
  protected files$ = new BehaviorSubject<LoadableFiles | undefined>(undefined)
  protected events: Event[] = []
  protected renderer: Renderer | undefined
  #loaded = new BehaviorSubject<PromiseReturnType<typeof load> | undefined>(undefined)
  protected wrapper: HTMLDivElement | undefined
  #actions$ = new Subject<{ name: 'display', data: any }>()
  protected _currentLocation: {
    start: {
      index: number,
      cfi: undefined | string,
      displayed: {
        page: number
      }
    },
    end: {}
  } = {
      start: {
        index: 0,
        cfi: undefined,
        displayed: {
          page: 1
        }
      },
      end: {}
    }

  /**
   * @fallback epubjs
   */
  public displayOptions = {
    fixedLayout: true
  }

  /**
   * @fallback epubjs
   */
  public packaging: {
    spine: {
      length: number,
      items: LoadableFiles,
    },
    metadata: { layout: 'pre-paginated' }
  } = {
      spine: {
        items: [],
        length: 0,
      },
      metadata: {
        layout: 'pre-paginated'
      }
    }

  constructor() {
    this.#actions$
      .subscribe(action => {
        switch (action.name) {
          case 'display': {
            this.onDisplay(action.data)
            break;
          }
        }
      })
  }

  public renderTo = async (container: HTMLElement) => {
    this.container = container
  }

  public async load({ url }: { url: Blob | File }) {
    if (this.container) {
      this.wrapper = this.container.ownerDocument.createElement('div')
      this.wrapper.className = 'comic-reader-wrapper'
      this.container?.appendChild(this.wrapper)

      try {
        const loaded = await load(url)
        this.renderer = createRenderer(loaded.getType(), this.wrapper, this.container)

        this.renderer.on('click', event => this.events.forEach(e => {
          if (e.name === 'click') {
            e.cb(event)
          }
        }))

        this.packaging.spine.items = loaded.files
        this.packaging.spine.length = loaded.files.length

        this.#loaded.next(loaded)
        this.files$.next(loaded.files)
      } catch (e) {
        Report.error(e)
      }
    }

    return this
  }

  protected getFileFromLocation(location: string) {
    return (this.files$.value || []).find(file => file.name === location)
  }

  protected getCfiFromPercentage(value: number) {

  }

  protected async renderFile(file: LoadableFiles[number]) {
    this.#loaded
      .pipe(first())
      .subscribe(async (loaded) => {
        const data = await loaded?.getFile(file.name)
        if (data) {
          this.renderer?.render(data)

          const fileIndex = (this.files$.value || []).indexOf(file)
          this._currentLocation.start.displayed.page = fileIndex + 1
          this._currentLocation.start.index = fileIndex
          this._currentLocation.start.cfi = file.name

          this.trigger('relocated', this._currentLocation)
        }
      })
  }

  public on(eventName: string, cb: () => {}) {
    this.events.push({ name: eventName, cb })
  }

  public off(eventName: string, cb: () => {}) {
    this.events = this.events.filter(event => event.cb !== cb)
  }

  protected trigger(eventName: string, e: any) {
    this.events.forEach(event => {
      if (event.name === eventName) {
        event.cb(e)
      }
    })
  }

  public display(path?: string) {
    this.#actions$.next({ name: 'display', data: { path } })
  }

  protected onDisplay({ path }: { path?: string }) {
    this.files$
      .pipe(filter(value => value !== undefined))
      .pipe(first())
      .subscribe((files = []) => {
        if (this._currentLocation.start.cfi && this._currentLocation.start.cfi === path) return
        const defaultFile = files[0]
        if (path) {
          this.renderFile(this.getFileFromLocation(path) || defaultFile)
        } else {
          this.renderFile(defaultFile)
        }
      })
  }

  public getContents() {

  }

  public next() {
    const index = this._currentLocation.start.displayed.page - 1
    if (index < (this.files$.value || []).length - 1) {
      this.renderFile((this.files$.value || [])[index + 1])
    }
  }

  public prev() {
    const index = this._currentLocation.start.displayed.page - 1
    if (index > 0) {
      this.renderFile((this.files$.value || [])[index - 1])
    }
  }

  public destroy() {
    this.renderer?.destroy()
  }
}