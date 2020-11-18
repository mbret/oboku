import { makeVar, useLazyQuery, useMutation, useReactiveVar } from '@apollo/client';
import { Button, Dialog, DialogActions, DialogTitle } from '@material-ui/core';
import React, { FC, useEffect } from 'react';
import { MutationAddCollectionsToBookDocument, MutationRemoveCollectionsToBookDocument, QueryBookDocument } from '../generated/graphql';
import { useQueryGetCollection } from '../collections/queries';
import { CollectionSelectionList } from '../collections/CollectionSelectionList';

export const openManageBookCollectionsDialog = makeVar<string | undefined>(undefined)

export const ManageBookCollectionsDialog: FC<{}> = () => {
  const id = useReactiveVar(openManageBookCollectionsDialog)
  const open = !!id
  const { data: getCollectionData } = useQueryGetCollection()
  const [getBook, { data: getBookData }] = useLazyQuery(QueryBookDocument)
  const [addToBook] = useMutation(MutationAddCollectionsToBookDocument)
  const [removeFromBook] = useMutation(MutationRemoveCollectionsToBookDocument)
  const collections = getCollectionData?.collections
  const bookCollection = getBookData?.book?.collections

  useEffect(() => {
    id && getBook({ variables: { id } })
  }, [id, getBook])

  const isSelected = (id: string) => !!bookCollection?.find(item => item?.id === id)

  return (
    <Dialog
      onClose={() => openManageBookCollectionsDialog(undefined)}
      open={open}
    >
      <DialogTitle>Collection selection</DialogTitle>
      {collections && <CollectionSelectionList
        collections={collections}
        isSelected={isSelected}
        onItemClick={collectionId => {
          if (isSelected(collectionId)) {
            id && removeFromBook({ variables: { id, collections: [collectionId] } })
          } else{
            id && addToBook({ variables: { id, collections: [collectionId] } })
          }
        }}
      />}
      <DialogActions>
        <Button onClick={() => openManageBookCollectionsDialog(undefined)} color="primary" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}