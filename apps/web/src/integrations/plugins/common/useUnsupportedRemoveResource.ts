import { UnsupportedMethodError } from "../../../errors/errors.shared"

export const useUnsupportedRemoveResource = () => {
  return async function rejectRemoveResource() {
    throw new UnsupportedMethodError("This data source cannot remove books")
  }
}
