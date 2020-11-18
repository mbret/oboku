import { Add_CollectionDocument } from "../generated/graphql";
import { generateUniqueID } from "../utils";

export const createNewCollection = (data: { name: string }): typeof Add_CollectionDocument['__variablesType'] => ({
  id: generateUniqueID(),
  ...data,
})