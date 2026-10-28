import { renderHook } from "@testing-library/react"
import type { DataSourceDocType } from "@oboku/shared"
import { describe, expect, it, vi } from "vitest"

const { PLUGIN_TYPES, pluginsByType, createRequestPopupDialog } = vi.hoisted(
  function createPluginMocks() {
    const PLUGIN_TYPES = [
      "webdav",
      "dropbox",
      "synology-drive",
      "DRIVE",
      "one-drive",
      "file",
      "URI",
      "server",
    ] as const satisfies ReadonlyArray<DataSourceDocType["type"]>

    return {
      PLUGIN_TYPES,
      pluginsByType: Object.fromEntries(
        PLUGIN_TYPES.map(function createPluginMock(type) {
          return [
            type,
            {
              name: `${type} display name`,
              useSynchronize: vi.fn(function useMockSynchronize() {
                return { mutateAsync: vi.fn() }
              }),
            },
          ]
        }),
      ),
      createRequestPopupDialog: vi.fn(
        function createMockRequestPopupDialog(_options: { name: string }) {
          return async function requestPopup() {
            return true
          }
        },
      ),
    }
  },
)

vi.mock("./configure", function mockPlugins() {
  return { pluginsByType }
})
vi.mock("./useCreateRequestPopupDialog", function mockRequestPopupDialog() {
  return {
    useCreateRequestPopupDialog: function useMockCreateRequestPopupDialog() {
      return createRequestPopupDialog
    },
  }
})

import { usePluginSynchronize } from "./usePluginSynchronize"

describe("usePluginSynchronize", function testUsePluginSynchronize() {
  it("names each provider's popup after its plugin's display name", function namePopupsAfterPlugins() {
    renderHook(usePluginSynchronize)

    for (const type of PLUGIN_TYPES) {
      const plugin = pluginsByType[type]
      const popupCallIndex = createRequestPopupDialog.mock.calls.findIndex(
        ([options]) => options.name === plugin?.name,
      )
      const popupNamedAfterPlugin =
        createRequestPopupDialog.mock.results[popupCallIndex]?.value

      expect(plugin?.useSynchronize).toHaveBeenCalledWith({
        requestPopup: popupNamedAfterPlugin,
      })
    }
  })
})
