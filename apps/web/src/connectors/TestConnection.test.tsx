import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("../secrets/useUnlockMasterKey", function mockMasterKey() {
  return {
    useUnlockMasterKey: function useUnlockMasterKey() {
      return { masterKey: "master-key", unlockMasterKey: vi.fn() }
    },
    useUnlockedMasterKey: function useUnlockedMasterKey() {
      return { data: "master-key" }
    },
  }
})

const SECRETS: Record<string, string> = {
  "koofr-secret": "koofr-app-password",
  "nas-secret": "nas-password",
}

vi.mock("../secrets/useDecryptedSecret", function mockDecryptedSecret() {
  return {
    useDecryptedSecret: function useDecryptedSecret({ id }: { id?: string }) {
      return { data: id ? SECRETS[id] : undefined }
    },
  }
})

import {
  type ConnectionParams,
  TestConnection,
  type TestConnectionFn,
} from "./TestConnection"

type DirectoryConnectionParams = ConnectionParams & { directory?: string }

const KOOFR_CONNECTION = {
  url: "https://app.koofr.net/dav/Koofr",
  username: "reader@example.com",
  passwordAsSecretId: "koofr-secret",
}

const NAS_CONNECTION = {
  url: "https://nas.example.com/dav",
  username: "reader",
  passwordAsSecretId: "nas-secret",
}

describe("TestConnection", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("tests once on mount, then once more when the extra values stop changing", async () => {
    const testConnection = vi.fn<TestConnectionFn<DirectoryConnectionParams>>(
      async function connect() {
        return true
      },
    )
    const renderWithDirectory = (directory: string) => (
      <QueryClientProvider client={queryClient}>
        <TestConnection<DirectoryConnectionParams>
          connectionData={{ ...KOOFR_CONNECTION, directory }}
          connectorType="webdav"
          testConnection={testConnection}
        />
      </QueryClientProvider>
    )
    const queryClient = new QueryClient()
    const { rerender } = render(renderWithDirectory("B"))

    for (const directory of ["Bo", "Boo", "Books"]) {
      rerender(renderWithDirectory(directory))
    }

    await expect.poll(() => testConnection.mock.calls).toHaveLength(2)
    expect(testConnection.mock.lastCall?.[0].directory).toBe("Books")
  })

  it("tests a connector's password only against that connector's URL", async () => {
    const testConnection = vi.fn<TestConnectionFn>(async function connect() {
      return true
    })
    const queryClient = new QueryClient()
    const renderConnection = (connectionData: typeof KOOFR_CONNECTION) => (
      <QueryClientProvider client={queryClient}>
        <TestConnection
          connectionData={connectionData}
          connectorType="webdav"
          testConnection={testConnection}
        />
      </QueryClientProvider>
    )
    const { rerender } = render(renderConnection(KOOFR_CONNECTION))

    rerender(renderConnection(NAS_CONNECTION))

    const passwordsByUrl: Record<string, string> = {
      [KOOFR_CONNECTION.url]: "koofr-app-password",
      [NAS_CONNECTION.url]: "nas-password",
    }
    await expect
      .poll(() => testConnection.mock.lastCall?.[0].url)
      .toBe(NAS_CONNECTION.url)
    for (const [{ url, password }] of testConnection.mock.calls) {
      expect(password).toBe(passwordsByUrl[url])
    }
  })
})
