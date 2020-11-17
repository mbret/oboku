import { v4 } from 'uuid'
import { getMainDefinition as bloodyBrokenTypedFunction } from "@apollo/client/utilities"
import { DocumentNode, OperationTypeNode } from "graphql"
import { Operation, TypedDocumentNode } from '@apollo/client'
import { useMeasure } from 'react-use'
import React, { useMemo } from 'react'

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

export const createPolling = <F extends () => Promise<void>>(fn: F, ms: number) => {
  let timeout

  const loop = (fn: F) => {
    timeout = setTimeout(async () => {
      await fn()
      timeout && loop(fn)
    }, ms)
  }

  return [
    () => {
      if (!timeout) {
        loop(fn)
      }
    },
    () => {
      clearTimeout(timeout)
      timeout = undefined
    }
  ]
}

export const useMeasureElement = (element: React.ReactNode) => {
  const [ref, dim] = useMeasure()

  const elementToRender = useMemo(() => (
    <div ref={ref as any} style={{ position: 'absolute', visibility: 'hidden' }}>
      {element}
    </div>
  ), [element, ref])

  console.log('useMeasureElement')
  return [elementToRender, dim] as [typeof elementToRender, typeof dim]
};