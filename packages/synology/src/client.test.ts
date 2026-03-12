import { describe, expect, it } from "vitest"
import {
  buildSynologyDriveListFolderParams,
  browseSynologyDriveItems,
  listAllSynologyDriveFolderItems,
  normalizeSynologyDriveBaseUrl,
  parseSynologyDriveListPagePayload,
} from "./client"

describe("Synology package helpers", () => {
  it("normalizes trailing slashes and strips search params", () => {
    expect(
      normalizeSynologyDriveBaseUrl(
        "https://nas.example.com:5001/drive/?foo=bar#hash",
      ),
    ).toBe("https://nas.example.com:5001/drive")
  })

  it("parses paged list payloads with items and total", () => {
    expect(
      parseSynologyDriveListPagePayload({
        data: {
          items: [{ file_id: "1", is_dir: false, name: "Book.cbz" }],
          total: 1200,
        },
        success: true,
      }),
    ).toEqual({
      items: [{ file_id: "1", is_dir: false, name: "Book.cbz" }],
      total: 1200,
    })
  })

  it("builds list params with custom offset and limit", () => {
    expect(
      buildSynologyDriveListFolderParams({
        limit: 250,
        offset: 500,
        path: "/mydrive/",
        session: {
          auth: {
            baseUrl: "https://nas.example.com",
            password: "secret",
            username: "max",
          },
          sid: "sid",
        },
      }).toString(),
    ).toContain("limit=250")

    expect(
      buildSynologyDriveListFolderParams({
        limit: 250,
        offset: 500,
        path: "/mydrive/",
        session: {
          auth: {
            baseUrl: "https://nas.example.com",
            password: "secret",
            username: "max",
          },
          sid: "sid",
        },
      }).toString(),
    ).toContain("offset=500")
  })

  it("loads every page when a folder has more than one page", async () => {
    const requestedOffsets: string[] = []
    const session = {
      auth: {
        baseUrl: "https://nas.example.com",
        password: "secret",
        username: "max",
      },
      sid: "sid",
    }

    const items = await listAllSynologyDriveFolderItems({
      path: "/mydrive/",
      requestPage: async (params) => {
        requestedOffsets.push(params.get("offset") ?? "")

        if (params.get("offset") === "0") {
          return {
            items: Array.from({ length: 1000 }, (_, index) => ({
              file_id: `${index}`,
              is_dir: false,
              name: `Book-${index}.cbz`,
            })),
            total: 1001,
          }
        }

        return {
          items: [{ file_id: "1000", is_dir: false, name: "Book-1000.cbz" }],
          total: 1001,
        }
      },
      session,
    })

    expect(requestedOffsets).toEqual(["0", "1000"])
    expect(items).toHaveLength(1001)
  })

  it("builds root browse items from team folder availability", async () => {
    const session = {
      auth: {
        baseUrl: "https://nas.example.com",
        password: "secret",
        username: "max",
      },
      sid: "sid",
    }

    await expect(
      browseSynologyDriveItems({
        requestPage: async () => ({
          items: [{ file_id: "1", is_dir: true, name: "Shared" }],
          total: 1,
        }),
        session,
      }),
    ).resolves.toEqual([
      {
        hasChildren: true,
        id: "root:my-drive",
        name: "My Drive",
        type: "folder",
      },
      {
        hasChildren: true,
        id: "root:team-folders",
        name: "Team Folders",
        type: "folder",
      },
    ])
  })
})
