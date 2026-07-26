// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  openOpfsZipTarget,
  opfsSupported,
  purgeStagedFiles,
  stageBytesInOpfs,
} from "./opfsStaging"

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

const findStagingDir = (root: FakeDirectoryHandle) => root.dirs.get("oboku-tmp")

const STAGED_NAME = "11111111-1111-1111-1111-111111111111"

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

describe("stageBytesInOpfs", () => {
  it("returns an in-memory blob without touching OPFS when unsupported", async () => {
    disableOpfs()
    const bytes = new Uint8Array([1, 2, 3]).buffer

    const blob = await stageBytesInOpfs(bytes)

    expect(await bytesOf(blob)).toEqual(new Uint8Array([1, 2, 3]))
  })

  it("spills the bytes to OPFS and returns the written file", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)
    const bytes = new Uint8Array([4, 5, 6]).buffer

    const blob = await stageBytesInOpfs(bytes)

    expect(await bytesOf(blob)).toEqual(new Uint8Array([4, 5, 6]))
    expect(findStagingDir(root)?.files.has(`${STAGED_NAME}.bin`)).toBe(true)
  })

  it("falls back to an in-memory blob when the OPFS write fails", async () => {
    const root = new FakeDirectoryHandle()
    vi.spyOn(root, "getDirectoryHandle").mockRejectedValue(
      new Error("quota exceeded"),
    )
    enableOpfs(root)
    const bytes = new Uint8Array([7, 8, 9]).buffer

    const blob = await stageBytesInOpfs(bytes)

    expect(await bytesOf(blob)).toEqual(new Uint8Array([7, 8, 9]))
  })
})

describe("openOpfsZipTarget", () => {
  it("returns no target when OPFS is unsupported", async () => {
    disableOpfs()

    expect(await openOpfsZipTarget()).toBeNull()
  })

  it("streams into a staged file and drops it on dispose", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)

    const target = await openOpfsZipTarget()

    expect(target).not.toBeNull()
    expect(findStagingDir(root)?.files.has(`${STAGED_NAME}.zip`)).toBe(true)

    await target?.dispose()

    expect(findStagingDir(root)?.files.has(`${STAGED_NAME}.zip`)).toBe(false)
  })
})

describe("purgeStagedFiles", () => {
  it("removes the whole staging directory", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)
    await stageBytesInOpfs(new Uint8Array([1]).buffer)

    await purgeStagedFiles()

    expect(findStagingDir(root)).toBeUndefined()
  })

  it("does nothing when OPFS is unsupported", async () => {
    disableOpfs()

    await expect(purgeStagedFiles()).resolves.toBeUndefined()
  })

  it("swallows errors when there is nothing to purge", async () => {
    enableOpfs(new FakeDirectoryHandle())

    await expect(purgeStagedFiles()).resolves.toBeUndefined()
  })
})
