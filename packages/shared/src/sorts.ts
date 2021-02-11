export const sortByTitleComparator = (a: string, b: string) => {
  var alist = a.split(/(\d+)/),
    blist = b.split(/(\d+)/);

  // @ts-ignore
  alist.slice(-1) == '' && alist.pop()
  // @ts-ignore
  blist.slice(-1) == '' && blist.pop()

  for (var i = 0, len = alist.length; i < len; i++) {
    if (alist[i] !== blist[i]) {
      if (alist[i].match(/\d/)) {
        return +alist[i] - +blist[i];
      } else {
        return alist[i].localeCompare(blist[i]);
      }
    }
  }

  return 1;
}