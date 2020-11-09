export const API_URI = process.env.REACT_APP_API_URL
// export const API_URI = 'https://mbret-oboku-api.glitch.me/'
// export const API_URI = 'https://tough-walrus-50.loca.lt/'

console.log(process.env)


export const ROUTES = {
  HOME: '/',
  BOOK_DETAILS: '/book/:id',
  SERIES_DETAILS: '/series/:id',
  SETTINGS: '/settings',
  LIBRARY_ROOT: '/library',
  LIBRARY_BOOKS: '/library/books',
  LIBRARY_SERIES: '/library/series',
  LIBRARY_TAGS: '/library/tags',
  LOGIN: '/login',
  REGISTER: '/register',
}

// Average ratio (w/h) for books cover. This ratio may be used
// to help designing fixed height carousel or card. This average takes
// into account the deviation
export const COVER_AVERAGE_RATIO = 9 / 14;