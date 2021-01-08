type Event = {
  name: string,
  cb: (data: any) => void
}

export abstract class Renderer {
  protected events: Event[] = []

  constructor(protected wrapper: Element, protected container: Element) { }

  abstract render(content: string): void

  public on(eventName: string, cb: (data: any) => void) {
    this.events.push({ name: eventName, cb })
  }

  public off(eventName: string, cb: () => void) {
    this.events = this.events.filter(event => event.cb !== cb)
  }

  public destroy() {
    this.events = []
  }
}

export class ComicRenderer extends Renderer {
  constructor(protected wrapper: Element, protected container: Element) {
    super(wrapper, container)

    this.wrapper.addEventListener('click', clickEvent => {
      clickEvent.stopPropagation()
      this.events.forEach(event => {
        if (event.name === 'click') {
          event.cb(clickEvent)
        }
      })
    })
  }

  render(content: string) {
    this.wrapper.innerHTML = ''
    const img = this.container?.ownerDocument.createElement('img')
    img?.setAttribute('src', `data:image/png;base64,${content}`)
    img && this.wrapper?.appendChild(img)
  }

  destroy() {
    // this.wrapper.removeEventListener('')
  }
}

export class FileRenderer extends Renderer {
  render(content: string) {
    this.wrapper.innerHTML = ''
    const frame = this.container.ownerDocument.createElement('iframe')
    frame.setAttribute('sandbox', 'allow-same-origin')
    frame.setAttribute('frameBorder', '0')
    frame.style.width = '100%'
    frame.style.height = '100%'
    const contentDiv = frame.ownerDocument.createElement('div')
    this.wrapper.appendChild(frame)
    contentDiv.innerText = content
    if (frame.contentWindow) {
      frame.contentWindow?.document.body.appendChild(contentDiv)
    }

    frame.contentDocument?.addEventListener('click', clickEvent => {
      this.events.forEach(event => {
        if (event.name === 'click') {
          event.cb(clickEvent)
        }
      })
    })
  }
}

export const createRenderer = (type: 'comic' | 'file', wrapper: Element, container: Element) => {
  if (type === 'file') return new FileRenderer(wrapper, container)
  return new ComicRenderer(wrapper, container)
}