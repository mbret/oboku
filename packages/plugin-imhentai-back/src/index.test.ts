import { dataSourceHelpers, LinkDocType } from "@oboku/shared"
import { UNIQUE_RESOURCE_IDENTIFIER, TYPE } from "@oboku/plugin-imhentai-shared"
import { plugin } from "./index"

it(`should retrieve metadata`, async () => {
  const link: LinkDocType = {
    _id: ``,
    _rev: ``,
    book: null,
    createdAt: ``,
    data: ``,
    modifiedAt: ``,
    resourceId: dataSourceHelpers.generateResourceId(UNIQUE_RESOURCE_IDENTIFIER, `774006`),
    rx_model: `link`,
    type: TYPE,
    rxdbMeta: {
      lwt: new Date().getTime()
    }
  }

  console.log(await plugin.getMetadata(link))

  expect(true).toBe(true)
})