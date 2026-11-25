import { UnsupportedMethodError } from "../../../errors/errors.shared"

export const useUnsupportedRemoveResource = () => {
  return async function rejectRemoveResource() {
    throw new UnsupportedMethodError("This source cannot remove books")
  }
}
