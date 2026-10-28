import { renderHook } from "@testing-library/react"
import type { DataSourceDocType } from "@oboku/shared"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { PLUGIN_TYPES, pluginsByType, createRequestPopupDialog } = vi.hoisted(
  function createPluginMocks() {
    const PLUGIN_TYPES = [
      "webdav",
      "synology-drive",
      "dropbox",
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
              useRefreshMetadata: vi.fn(function useMockRefreshMetadata() {
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

import { usePluginRefreshMetadata } from "./usePluginRefreshMetadata"

describe("usePluginRefreshMetadata", function testUsePluginRefreshMetadata() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks()
  })

  it("forwards the caller's meta to every provider hook", function forwardMeta() {
    const meta = { suppressGlobalErrorToast: true }

    renderHook(function renderWithMeta() {
      return usePluginRefreshMetadata({ meta })
    })

    for (const type of PLUGIN_TYPES) {
      expect(pluginsByType[type]?.useRefreshMetadata).toHaveBeenCalledWith(
        expect.objectContaining({ meta }),
      )
    }
  })

  it("leaves meta unset when the caller wants the global toast", function defaultMeta() {
    renderHook(function renderWithoutOptions() {
      return usePluginRefreshMetadata()
    })

    for (const type of PLUGIN_TYPES) {
      expect(pluginsByType[type]?.useRefreshMetadata).toHaveBeenCalledWith(
        expect.objectContaining({ meta: undefined }),
      )
    }
  })

  it("names each provider's popup after its plugin's display name", function namePopupsAfterPlugins() {
    renderHook(function renderWithoutOptions() {
      return usePluginRefreshMetadata()
    })

    for (const type of PLUGIN_TYPES) {
      const plugin = pluginsByType[type]
      const popupCallIndex = createRequestPopupDialog.mock.calls.findIndex(
        ([options]) => options.name === plugin?.name,
      )
      const popupNamedAfterPlugin =
        createRequestPopupDialog.mock.results[popupCallIndex]?.value

      expect(plugin?.useRefreshMetadata).toHaveBeenCalledWith(
        expect.objectContaining({ requestPopup: popupNamedAfterPlugin }),
      )
    }
  })
})
