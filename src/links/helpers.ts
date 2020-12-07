import { useRxMutation } from "../rxdb/hooks";
import { LinkDocType } from "../rxdb/databases";

export const useAddLink = () => {
  return () => {
    console.error('todo')
  }
  // const client = useOfflineApolloClient()
  // const [addLink] = useMutation(MutationAddLinkDocument)

  // return useCallback((resourceId: string, type: LinkType, bookId: string) => {
  //   const link = linkOfflineResolvers.Mutation.addLink({ bookId, resourceId, type }, { client })

  //   addLink({ variables: { ...link, bookId } })
  // }, [addLink, client])
}

export const useEditLink = () =>
  useRxMutation<Partial<LinkDocType> & Required<Pick<LinkDocType, '_id'>>>(
    (db, { variables: { _id, ...rest } }) =>
      db.link.safeUpdate({ $set: rest }, collection => collection.findOne({ selector: { _id } }))
  )