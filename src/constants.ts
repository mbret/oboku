export const API_URI = process.env.REACT_APP_API_URL
export const API_SYNC_URL = `${API_URI}/sync`
export const API_SYNC_POLL1_URL = `${process.env.REACT_APP_API_POLL_1_URL}/sync`
export const API_SYNC_POLL_2_URL = `${process.env.REACT_APP_API_POLL_2_URL}/sync`
// export const API_URI = 'https://mbret-oboku-api.glitch.me/'
// export const API_URI = 'https://tough-walrus-50.loca.lt/'

console.log(process.env)


export const ROUTES = {
  HOME: '/',
  BOOK_DETAILS: '/book/:id',
  COLLECTION_DETAILS: '/collection/:id',
  SETTINGS: '/settings',
  DATASOURCES: '/datasources',
  LIBRARY_ROOT: '/library',
  LIBRARY_BOOKS: '/library/books',
  LIBRARY_COLLECTIONS: '/library/collections',
  LIBRARY_TAGS: '/library/tags',
  LOGIN: '/login',
  REGISTER: '/register',
  READER: '/reader/:id',
  FAQ: '/faq',
}