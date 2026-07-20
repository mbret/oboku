// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  getTmpDir,
  opfsSupported,
  purgeTmp,
  purgeTmpDir,
  writeTmpFile,
} from "./tmp"

vi.mock("../debug/logger.shared", () => ({
  Logger: { info: vi.fn(), warn: vi.fn() },
}))

class FakeFileHandle {
  contents = new Uint8Array(0)

  async createWritable() {
    return {
      write: async (bytes: ArrayBuffer) => {
        this.contents = new Uint8Array(bytes)
      },
      close: async () => {},
    }
  }

  async getFile() {
    return new Blob([this.contents])
  }
}

class FakeDirectoryHandle {
  readonly dirs = new Map<string, FakeDirectoryHandle>()
  readonly files = new Map<string, FakeFileHandle>()

  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    let dir = this.dirs.get(name)

    if (!dir) {
      if (!options?.create) throw new Error(`NotFound: ${name}`)
      dir = new FakeDirectoryHandle()
      this.dirs.set(name, dir)
    }

    return dir
  }

  async getFileHandle(name: string, options?: { create?: boolean }) {
    let file = this.files.get(name)

    if (!file) {
      if (!options?.create) throw new Error(`NotFound: ${name}`)
      file = new FakeFileHandle()
      this.files.set(name, file)
    }

    return file
  }

  async removeEntry(name: string, _options?: { recursive?: boolean }) {
    if (!this.dirs.delete(name) && !this.files.delete(name)) {
      throw new Error(`NotFound: ${name}`)
    }
  }
}

const enableOpfs = (root: FakeDirectoryHandle) => {
  vi.stubGlobal("navigator", {
    storage: { getDirectory: async () => root },
  })
}

const disableOpfs = () => {
  vi.stubGlobal("navigator", {})
}

const bytesOf = (blob: Blob) =>
  new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })

beforeEach(() => {
  vi.spyOn(crypto, "randomUUID").mockReturnValue(
    "11111111-1111-1111-1111-111111111111",
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("opfsSupported", () => {
  it("is true when navigator.storage.getDirectory exists", () => {
    enableOpfs(new FakeDirectoryHandle())

    expect(opfsSupported()).toBe(true)
  })

  it("is false when navigator.storage is missing", () => {
    disableOpfs()

    expect(opfsSupported()).toBe(false)
  })
})

describe("getTmpDir", () => {
  it("creates the scope directory nested under the tmp root", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)

    const dir = await getTmpDir("scope-a")

    const tmpRoot = root.dirs.get("oboku-tmp")
    expect(tmpRoot).toBeDefined()
    expect(tmpRoot?.dirs.get("scope-a")).toBe(dir)
  })
})

describe("writeTmpFile", () => {
  it("returns an in-memory blob without touching OPFS when unsupported", async () => {
    disableOpfs()
    const bytes = new Uint8Array([1, 2, 3]).buffer

    const blob = await writeTmpFile("scope", bytes)

    expect(await bytesOf(blob)).toEqual(new Uint8Array([1, 2, 3]))
  })

  it("persists the bytes to OPFS and returns the written file", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)
    const bytes = new Uint8Array([4, 5, 6]).buffer

    const blob = await writeTmpFile("scope-b", bytes)

    expect(await bytesOf(blob)).toEqual(new Uint8Array([4, 5, 6]))

    const scopeDir = root.dirs.get("oboku-tmp")?.dirs.get("scope-b")
    expect(
      scopeDir?.files.has("11111111-1111-1111-1111-111111111111.bin"),
    ).toBe(true)
  })

  it("falls back to an in-memory blob when the OPFS write fails", async () => {
    const root = new FakeDirectoryHandle()
    vi.spyOn(root, "getDirectoryHandle").mockRejectedValue(
      new Error("quota exceeded"),
    )
    enableOpfs(root)
    const bytes = new Uint8Array([7, 8, 9]).buffer

    const blob = await writeTmpFile("scope-c", bytes)

    expect(await bytesOf(blob)).toEqual(new Uint8Array([7, 8, 9]))
  })
})

describe("purgeTmpDir", () => {
  it("removes only the given scope from the tmp root", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)
    await writeTmpFile("keep", new Uint8Array([1]).buffer)
    await writeTmpFile("drop", new Uint8Array([2]).buffer)

    await purgeTmpDir("drop")

    const tmpRoot = root.dirs.get("oboku-tmp")
    expect(tmpRoot?.dirs.has("drop")).toBe(false)
    expect(tmpRoot?.dirs.has("keep")).toBe(true)
  })

  it("does nothing when OPFS is unsupported", async () => {
    disableOpfs()

    await expect(purgeTmpDir("whatever")).resolves.toBeUndefined()
  })

  it("swallows errors when the scope does not exist", async () => {
    enableOpfs(new FakeDirectoryHandle())

    await expect(purgeTmpDir("missing")).resolves.toBeUndefined()
  })
})

describe("purgeTmp", () => {
  it("removes the entire tmp root", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)
    await writeTmpFile("scope", new Uint8Array([1]).buffer)

    await purgeTmp()

    expect(root.dirs.has("oboku-tmp")).toBe(false)
  })

  it("does nothing when OPFS is unsupported", async () => {
    disableOpfs()

    await expect(purgeTmp()).resolves.toBeUndefined()
  })

  it("swallows errors when there is nothing to purge", async () => {
    enableOpfs(new FakeDirectoryHandle())

    await expect(purgeTmp()).resolves.toBeUndefined()
  })
})
