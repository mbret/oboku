import { v4 } from 'uuid'
import { getMainDefinition as bloodyBrokenTypedFunction } from "@apollo/client/utilities"
import { DocumentNode, OperationTypeNode } from "graphql"
import { Operation, TypedDocumentNode } from '@apollo/client'

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

export const isSameOperation = (queryA: DocumentNode, queryB: DocumentNode) => {
  const valueA = getMainDefinition(queryA).name?.value
  return valueA !== undefined && valueA === getMainDefinition(queryB).name?.value
}

export const forOperationAs = <Result, Variables, T extends TypedDocumentNode<Result, Variables>>(
  operation: Operation,
  query: T,
  callback: (args: { variables: T['__variablesType'] }) => void
) => {
  if (isSameOperation(operation.query, query)) {
    callback({ variables: operation.variables as T['__variablesType'] })
  }
}