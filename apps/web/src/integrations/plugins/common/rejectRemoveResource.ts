import { UnsupportedMethodError } from "../../../errors/errors.shared"

export async function rejectRemoveResource(): Promise<never> {
  throw new UnsupportedMethodError("This data source cannot remove books")
}
