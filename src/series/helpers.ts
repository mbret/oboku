import { Add_SeriesDocument } from "../generated/graphql";
import { generateUniqueID } from "../utils";

export const createNewSeries = (data: { name: string }): typeof Add_SeriesDocument['__variablesType'] => ({
  id: generateUniqueID(),
  ...data,
})