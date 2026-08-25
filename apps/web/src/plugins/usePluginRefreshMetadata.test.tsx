// @vitest-environment jsdom

import { renderHook } from "@testing-library/react"
import type { DataSourceDocType } from "@oboku/shared"
import { beforeEach, describe, expect, it, vi } from "vitest"

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

const { pluginsByType } = vi.hoisted(function createPluginMocks() {
  const types = [
    "webdav",
    "synology-drive",
    "dropbox",
    "DRIVE",
    "one-drive",
    "file",
    "URI",
    "server",
  ]

  return {
    pluginsByType: Object.fromEntries(
      types.map(function createPluginMock(type) {
        return [
          type,
          {
            useRefreshMetadata: vi.fn(function useMockRefreshMetadata() {
              return { mutateAsync: vi.fn() }
            }),
          },
        ]
      }),
    ),
  }
})

vi.mock("./configure", function mockPlugins() {
  return { pluginsByType }
})
vi.mock("./useCreateRequestPopupDialog", function mockRequestPopupDialog() {
  return {
    useCreateRequestPopupDialog: function useMockCreateRequestPopupDialog() {
      return function createRequestPopup() {
        return async function requestPopup() {
          return true
        }
      }
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
})
