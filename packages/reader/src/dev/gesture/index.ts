import * as Hammer from 'hammerjs'
import { Subject } from 'rxjs'
import { Reader } from '../../reader/reader'

export const createGestureHandler = (container: HTMLElement, reader: Reader) => {
  const subject = new Subject<{ event: `tap` }>()
  const hammer = new Hammer(container || document.body)
  // let hammer: HammerManager | undefined

  hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL })
  hammer.get('pinch').set({ enable: true })
  hammer.get('press').set({ time: 500 })

  hammer.on('tap', function (ev) {
    handleSingleTap(ev)
  })

  hammer?.on('panmove panstart panend', onPanMove)

  function onPanMove(ev: HammerInput) {
    // console.log(`onPanMove`, ev.velocityX, ev.isFinal, ev)
    if (ev.isFinal && !reader.isSelecting()) {
      const velocity = ev.velocityX
      if (velocity < -0.5) {
        reader.turnRight()
      }
      if (velocity > 0.5) {
        reader.turnLeft()
      }
    }
  }

  function handleSingleTap({ srcEvent, target }: HammerInput) {
    const width = window.innerWidth
    const height = window.innerHeight
    const pageTurnMargin = 0.15
    const normalizedEvent = reader.normalizeEventPositions(srcEvent)

    console.log('handleSingleTap', srcEvent.target, srcEvent)

    if (reader.getSelection()) return

    if (`x` in normalizedEvent) {
      const { x } = normalizedEvent
      // debugger
      console.log(`handleSingleTap`, x, width, width * pageTurnMargin, width * (1 - pageTurnMargin))

      if (x < width * pageTurnMargin) {
        reader.turnLeft()
      } else if (x > width * (1 - pageTurnMargin)) {
        reader.turnRight()
      } else {
        subject.next({ event: 'tap' })
      }
    }
  }

  return {
    $: subject.asObservable(),
  }
}