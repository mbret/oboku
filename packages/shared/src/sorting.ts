export const sortByTitleComparator = (a: string, b: string) => {
  const alist = a.split(/(\d+)/)
  const blist = b.split(/(\d+)/)

  alist.slice(-1) === [``] && alist.pop()
  blist.slice(-1) === [``] && blist.pop()

  for (let i = 0, len = alist.length; i < len; i++) {
    if (alist[i] !== blist[i]) {
      if (alist[i]?.match(/\d/)) {
        return +(alist[i] || ``) - +(blist[i] || ``)
      } else {
        return (alist[i] || ``).localeCompare((blist[i] || ``))
      }
    }
  }

  return 1
}
