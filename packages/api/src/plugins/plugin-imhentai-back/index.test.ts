import {
  dataSourceHelpers,
  LinkDocType,
  PLUGIN_IMHENTAI_UNIQUE_RESOURCE_IDENTIFIER,
  PLUGIN_IMHENTAI_TYPE
} from "@oboku/shared"
import { plugin } from "./index"
import { expect, it } from "vitest"

it(`should retrieve metadata`, async () => {
  const link: LinkDocType = {
    _id: ``,
    _rev: ``,
    book: null,
    createdAt: ``,
    data: ``,
    modifiedAt: ``,
    resourceId: dataSourceHelpers.generateResourceId(
      PLUGIN_IMHENTAI_UNIQUE_RESOURCE_IDENTIFIER,
      `774006`
    ),
    rx_model: `link`,
    type: PLUGIN_IMHENTAI_TYPE,
    rxdbMeta: {
      lwt: new Date().getTime()
    }
  }

  console.log(await plugin.getMetadata(link))

  expect(true).toBe(true)
})
