// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { openOpfsStagingScope, purgeStagedFiles } from "./opfsStaging"

class FakeFileHandle {
  contents = new Uint8Array(0)

  constructor(readonly name: string) {}

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
      file = new FakeFileHandle(name)
      this.files.set(name, file)
    }

    return file
  }

  async removeEntry(name: string, _options?: { recursive?: boolean }) {
    if (!this.dirs.delete(name) && !this.files.delete(name)) {
      throw new Error(`NotFound: ${name}`)
    }
  }

  async *keys() {
    yield* [...this.dirs.keys(), ...this.files.keys()]
  }
}

type FakeLockCallback = (lock: { name: string } | null) => unknown

class FakeLockManager {
  readonly heldNames = new Set<string>()

  request(
    name: string,
    optionsOrCallback: { ifAvailable?: boolean } | FakeLockCallback,
    maybeCallback?: FakeLockCallback,
  ) {
    const runWithLock =
      typeof optionsOrCallback === "function"
        ? optionsOrCallback
        : maybeCallback
    const ifAvailable =
      typeof optionsOrCallback === "function"
        ? false
        : Boolean(optionsOrCallback.ifAvailable)

    if (!runWithLock) throw new Error("FakeLockManager: missing callback")

    if (ifAvailable && this.heldNames.has(name)) {
      return Promise.resolve(runWithLock(null))
    }

    this.heldNames.add(name)

    return Promise.resolve(runWithLock({ name })).finally(() => {
      this.heldNames.delete(name)
    })
  }
}

const enableOpfs = (root: FakeDirectoryHandle) => {
  const locks = new FakeLockManager()

  vi.stubGlobal("navigator", {
    storage: { getDirectory: async () => root },
    locks,
  })

  return locks
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

const STAGING_DIR = "prose-reader-archive-staging-v1"

const findStagingDir = (root: FakeDirectoryHandle) => root.dirs.get(STAGING_DIR)

type Uuid = ReturnType<typeof crypto.randomUUID>

const uuidOf = (nth: number): Uuid =>
  `${`${nth}`.padStart(8, "0")}-0000-0000-0000-000000000000`

const FIRST_SCOPE_ID = uuidOf(1)
const FIRST_STAGED_NAME = uuidOf(2)

const seedStagingDir = async (
  root: FakeDirectoryHandle,
  updateIds: string[],
) => {
  const staging = await root.getDirectoryHandle(STAGING_DIR, { create: true })

  for (const updateId of updateIds) {
    await staging.getDirectoryHandle(updateId, { create: true })
  }

  return staging
}

beforeEach(() => {
  let issued = 0

  vi.spyOn(crypto, "randomUUID").mockImplementation(function nextUuid() {
    issued += 1

    return uuidOf(issued)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("openOpfsStagingScope", () => {
  it("rejects rather than degrading when the platform has no OPFS", async () => {
    disableOpfs()

    await expect(openOpfsStagingScope()).rejects.toThrow()
  })

  it("spills the bytes into its own directory and returns the written file", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)

    const scope = await openOpfsStagingScope()
    const blob = await scope.stageBytes(new Uint8Array([4, 5, 6]).buffer)

    expect(await bytesOf(blob)).toEqual(new Uint8Array([4, 5, 6]))
    expect(
      findStagingDir(root)
        ?.dirs.get(FIRST_SCOPE_ID)
        ?.files.has(`${FIRST_STAGED_NAME}.bin`),
    ).toBe(true)
  })

  it("gives concurrent scopes separate directories", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)

    const first = await openOpfsStagingScope()
    const second = await openOpfsStagingScope()

    await first.stageBytes(new Uint8Array([1]).buffer)
    await second.stageBytes(new Uint8Array([2]).buffer)

    expect([...(findStagingDir(root)?.dirs.keys() ?? [])]).toHaveLength(2)
  })

  it("releasing one scope leaves a concurrent scope's files alone", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)

    const first = await openOpfsStagingScope()
    const second = await openOpfsStagingScope()
    const survivor = await second.stageBytes(new Uint8Array([9]).buffer)

    await first.release()

    expect(await bytesOf(survivor)).toEqual(new Uint8Array([9]))
    expect([...(findStagingDir(root)?.dirs.keys() ?? [])]).toHaveLength(1)
  })

  it("streams into a staged file and drops it on the target's dispose", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)

    const scope = await openOpfsStagingScope()
    const target = await scope.openZipTarget()
    const scopeDir = findStagingDir(root)?.dirs.get(FIRST_SCOPE_ID)

    expect(scopeDir?.files.has(`${FIRST_STAGED_NAME}.zip`)).toBe(true)

    await target?.dispose()

    expect(scopeDir?.files.has(`${FIRST_STAGED_NAME}.zip`)).toBe(false)
  })

  it("removes its directory and frees its lock on release", async () => {
    const root = new FakeDirectoryHandle()
    const locks = enableOpfs(root)

    const scope = await openOpfsStagingScope()

    expect(locks.heldNames.has(`${STAGING_DIR}:${FIRST_SCOPE_ID}`)).toBe(true)

    await scope.release()

    expect(findStagingDir(root)?.dirs.has(FIRST_SCOPE_ID)).toBe(false)
    expect(locks.heldNames.size).toBe(0)
  })

  it("reaps orphans left by earlier contexts without being asked", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)
    await seedStagingDir(root, ["dead"])

    const scope = await openOpfsStagingScope()

    await vi.waitFor(() => {
      expect(findStagingDir(root)?.dirs.has("dead")).toBe(false)
    })
    expect(findStagingDir(root)?.dirs.has(FIRST_SCOPE_ID)).toBe(true)

    await scope.release()
  })

  it("frees its lock and propagates when the directory cannot be created", async () => {
    const root = new FakeDirectoryHandle()
    const locks = enableOpfs(root)
    vi.spyOn(root, "getDirectoryHandle").mockRejectedValue(
      new Error("quota exceeded"),
    )

    await expect(openOpfsStagingScope()).rejects.toThrow("quota exceeded")
    expect(locks.heldNames.size).toBe(0)
  })

  it("propagates a failed spill rather than keeping the bytes in memory", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)
    const scope = await openOpfsStagingScope()
    const staging = await root.getDirectoryHandle(STAGING_DIR, { create: true })
    const scopeDir = await staging.getDirectoryHandle(FIRST_SCOPE_ID, {
      create: true,
    })
    vi.spyOn(scopeDir, "getFileHandle").mockRejectedValue(
      new Error("quota exceeded"),
    )

    await expect(scope.stageBytes(new Uint8Array([7]).buffer)).rejects.toThrow(
      "quota exceeded",
    )
  })
})

describe("purgeStagedFiles", () => {
  it("removes directories no update holds", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)
    const staging = await seedStagingDir(root, ["dead-a", "dead-b"])

    await purgeStagedFiles()

    expect([...staging.dirs.keys()]).toEqual([])
  })

  it("leaves a live scope's directory alone", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)
    const live = await openOpfsStagingScope()
    const staged = await live.stageBytes(new Uint8Array([3]).buffer)
    await seedStagingDir(root, ["dead"])

    await purgeStagedFiles()

    expect([...(findStagingDir(root)?.dirs.keys() ?? [])]).toEqual([
      FIRST_SCOPE_ID,
    ])
    expect(await bytesOf(staged)).toEqual(new Uint8Array([3]))
  })

  it("reaps a directory once its scope is released", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)
    const scope = await openOpfsStagingScope()
    await scope.stageBytes(new Uint8Array([3]).buffer)

    await purgeStagedFiles()
    expect(findStagingDir(root)?.dirs.has(FIRST_SCOPE_ID)).toBe(true)

    await scope.release()
    await purgeStagedFiles()

    expect(findStagingDir(root)?.dirs.has(FIRST_SCOPE_ID)).toBe(false)
  })

  it("drops the legacy staging directory outright", async () => {
    const root = new FakeDirectoryHandle()
    enableOpfs(root)
    await root.getDirectoryHandle("oboku-tmp", { create: true })

    await purgeStagedFiles()

    expect(root.dirs.has("oboku-tmp")).toBe(false)
  })

  it("stays best-effort when OPFS is unavailable", async () => {
    disableOpfs()

    await expect(purgeStagedFiles()).resolves.toBeUndefined()
  })

  it("swallows errors when there is nothing to purge", async () => {
    enableOpfs(new FakeDirectoryHandle())

    await expect(purgeStagedFiles()).resolves.toBeUndefined()
  })
})
