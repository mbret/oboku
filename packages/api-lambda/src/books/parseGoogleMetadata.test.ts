import { findByISBN } from "../google/googleBooksApi"
import { parseGoogleMetadata } from "./parseGoogleMetadata"
import utils from 'util'

it(`asd`, async () => {
  const response = await findByISBN(`9782413023470`)
  // const response = await findByISBN(`978-1-947804-36-4`)

  // console.log(utils.inspect(response, {depth: 6}))

  // console.log(parseGoogleMetadata(response))
})