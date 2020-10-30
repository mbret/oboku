export const API_URI = 'http://localhost:4000'
// export const API_URI = 'https://tough-walrus-50.loca.lt/'

export const ROUTES = {
  HOME: '/',
  BOOK_DETAILS: '/book/:id',
  SERIES_DETAILS: '/series/:id',
  SETTINGS: '/settings',
  LIBRARY_ROOT: '/library',
  LIBRARY_BOOKS: '/library/books',
  LIBRARY_SERIES: '/library/series',
  LIBRARY_TAGS: '/library/tags',
}

// Average ratio (w/h) for books cover. This ratio may be used
// to help designing fixed height carousel or card. This average takes
// into account the deviation
export const COVER_AVERAGE_RATIO = 9 / 14;