import type nano from "nano"

export const bulkDelete = async (
  db: nano.DocumentScope<unknown>,
  ids: ({ _id: string } | string)[],
) => {
  await db.bulk({
    docs: ids.map((idOrObject) => ({
      _id: typeof idOrObject === "string" ? idOrObject : idOrObject._id,
      _deleted: true,
    })),
  })
}
