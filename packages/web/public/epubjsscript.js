/* eslint-disable no-undef */

const hammertime = new Hammer(document);
hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL })

hammertime.on('panmove panstart panend', function (ev) {
  window.parent.document.dispatchEvent(new CustomEvent('hammer panmove panstart panend', { detail: ev }))
})

hammertime.on('tap', function (ev) {
  window.parent.document.dispatchEvent(new CustomEvent('hammer tap', { detail: ev }))
})