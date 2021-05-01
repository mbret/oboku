import { getBookFile } from "../../download/useBookFile";
import { PromiseReturnType } from "../../types";

export const isFileRarArchive = (file: NonNullable<PromiseReturnType<typeof getBookFile>>) => {
  const normalizedName = file.name.toLowerCase()

  if (
    normalizedName.endsWith(`.cbr`)
  ) {
    return true
  }

  return false
}