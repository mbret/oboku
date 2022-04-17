import { dataSourceHelpers, LinkDocType } from "@oboku/shared/src"
import { plugin } from "."

it(`should`, async () => {
  const link: LinkDocType = {
    _id: ``,
    _rev: ``,
    book: null,
    createdAt: ``,
    data: ``,
    modifiedAt: ``,
    resourceId: dataSourceHelpers.generateResourceId(`nhentai`, `1235`),
    rx_model: `link`,
    type: `NHENTAI`,
  }

  console.log(await plugin.getMetadata(link))
  
  expect(true).toBe(true)
})