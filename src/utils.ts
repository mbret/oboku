import { v4 } from 'uuid'
import { getMainDefinition as bloodyBrokenTypedFunction } from "@apollo/client/utilities"
import { OperationTypeNode } from "graphql"

/**
 * @todo see how to use guid / salt / etc. Truly
 * make it collision free between server and clients
 */
export const generateUniqueID = () => {
  return v4()
}

type GetMainDefinitionUnbrokenType = ReturnType<typeof bloodyBrokenTypedFunction> & { operation?: OperationTypeNode }
export const getMainDefinition = (query: Parameters<typeof bloodyBrokenTypedFunction>[0]): GetMainDefinitionUnbrokenType => {
  return bloodyBrokenTypedFunction(query)
}