/**
 * 401 credentials error
 * [{"domain":"global","reason":"authError","message":"Invalid Credentials","locationType":"header","location":"Authorization"}]
 */
import { type drive_v3 } from "googleapis"
import { READER_ACCEPTED_MIME_TYPES, isFileSupported } from "@oboku/shared"
import type {
  SynchronizeAbleDataSource,
  SynchronizeAbleItem,
} from "src/lib/plugins/types"
import { createThrottler } from "src/lib/utils"
import { createError } from "../helpers"
import { isDefined } from "class-validator"

export const generateResourceId = (driveId: string) => `drive-${driveId}`
export const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`drive-`, ``)

const isFolder = (
  file: NonNullable<drive_v3.Schema$FileList["files"]>[number],
) => file.mimeType === "application/vnd.google-apps.folder"

type TreeNode = drive_v3.Schema$File & { id: string; children: TreeNode[] }

function buildTree(
  items: (drive_v3.Schema$File & { id: string })[],
): TreeNode[] {
  // Create a map for quick lookup of items by id
  const itemMap = new Map<string, TreeNode>()

  // Initialize all items as tree nodes with empty children arrays
  items.forEach((item) => {
    itemMap.set(item.id, {
      ...item,
      children: [],
    })
  })

  const roots: TreeNode[] = []

  // Build the tree structure by connecting parents and children
  items.forEach((item) => {
    const node = itemMap.get(item.id)

    if (!node) return

    if ((item.parents?.length ?? 0) === 0) {
      // This is a root level item
      roots.push(node)
    } else {
      // This has a parent, add it to parent's children
      const parents =
        item.parents
          ?.map((parentId) => itemMap.get(parentId))
          .filter(isDefined) ?? []

      if (parents.length > 0) {
        parents.forEach((parent) => {
          if (parent) {
            parent.children.push(node)
          }
        })
      } else {
        // Parent not found in the list, treat as root
        roots.push(node)
      }
    }
  })

  return roots
}

export const getSynchronizeAbleDataSourceFromFolderId = async ({
  folderId,
  drive,
}: {
  folderId: string
  drive: drive_v3.Drive
}) => {
  const throttle = createThrottler(50)

  const getContentsFromFolder = throttle(
    async (id: string): Promise<SynchronizeAbleDataSource["items"]> => {
      type Res = NonNullable<drive_v3.Schema$FileList["files"]>

      const getNextRes = throttle(
        async (pageToken?: string | undefined): Promise<Res> => {
          const response = await drive.files.list({
            spaces: "drive",
            q: `
          '${id}' in parents and (
            mimeType='application/vnd.google-apps.folder' 
            ${READER_ACCEPTED_MIME_TYPES.map(
              (mimeType) => ` or mimeType='${mimeType}'`,
            ).join("")}
          )
        `,
            includeItemsFromAllDrives: true,
            fields:
              "nextPageToken, files(id, kind, name, mimeType, modifiedTime, parents, trashed)",
            pageToken: pageToken,
            supportsAllDrives: true,
            pageSize: 10,
          })

          const data = response.data.files || []
          const nextPageToken = response.data.nextPageToken || undefined

          if (!nextPageToken) {
            return data
          }

          const nextRes = await getNextRes(nextPageToken)

          return [...data, ...nextRes]
        },
      )

      const files = await getNextRes()
      const supportedFiles = files.filter((file) => {
        return (
          file.trashed !== true && (isFolder(file) || isFileSupported(file))
        )
      })

      return Promise.all(
        supportedFiles.map(
          async (file): Promise<SynchronizeAbleDataSource["items"][number]> => {
            if (isFolder(file)) {
              return {
                type: "folder",
                resourceId: generateResourceId(file.id || ""),
                items: await getContentsFromFolder(file.id || ""),
                name: file.name || "",
                modifiedAt: file.modifiedTime || new Date().toISOString(),
              }
            }

            return {
              type: "file",
              resourceId: generateResourceId(file.id || ""),
              name: file.name || "",
              modifiedAt: file.modifiedTime || new Date().toISOString(),
            }
          },
        ),
      )
    },
  )

  try {
    const [items, rootFolderResponse] = await Promise.all([
      await getContentsFromFolder(folderId),
      await drive.files.get({
        fileId: folderId,
      }),
    ])

    return {
      items,
      name: rootFolderResponse.data.name || "",
    }
  } catch (e) {
    if ((e as any)?.code === 401) {
      throw createError("unauthorized", e as Error)
    }

    const errors = (e as any)?.response?.data?.error?.errors

    if (errors && Array.isArray(errors)) {
      errors.forEach((error: any) => {
        if (error?.reason === "rateLimitExceeded") {
          throw createError("rateLimitExceeded", e as Error)
        }
      })
    }

    throw e
  }
}

export const getSynchronizeAbleDataSourceFromItems = async ({
  items,
  drive,
}: {
  items: readonly string[]
  drive: drive_v3.Drive
}) => {
  const throttle = createThrottler(50)

  const getFileMetadata = throttle(async (fileId: string) => {
    const response = await drive.files.get({
      fileId,
      fields: "id, kind, name, mimeType, modifiedTime, parents, trashed",
      supportsAllDrives: true,
    })

    const file = response.data

    return file as drive_v3.Schema$File & { id: string }
  })

  const files = await Promise.all(items.map(getFileMetadata))
  const tree = buildTree(files)

  console.log(files, tree)

  const asSynchronizeAbleItem = (file: TreeNode): SynchronizeAbleItem => {
    if (isFolder(file)) {
      return {
        type: "folder",
        resourceId: generateResourceId(file.id || ""),
        items: file.children.map(asSynchronizeAbleItem),
        name: file.name || "",
        modifiedAt: file.modifiedTime || new Date().toISOString(),
      }
    }

    return {
      type: "file",
      resourceId: generateResourceId(file.id || ""),
      name: file.name || "",
      modifiedAt: file.modifiedTime || new Date().toISOString(),
    }
  }

  return {
    items: tree.map(asSynchronizeAbleItem),
  }
}
