import { makeVar, useMutation, useReactiveVar } from '@apollo/client';
import { Button, Dialog, DialogActions, DialogTitle } from '@material-ui/core';
import React, { FC } from 'react';
import { useRecoilValue } from 'recoil';
import { CollectionSelectionList } from '../collections/CollectionSelectionList';
import { collectionsAsArrayState } from '../collections/states';
import { normalizedBooksState } from './states';

export const openManageBookCollectionsDialog = makeVar<string | undefined>(undefined)

export const ManageBookCollectionsDialog: FC<{}> = () => {
  const id = useReactiveVar(openManageBookCollectionsDialog)
  const open = !!id
  const collections = useRecoilValue(collectionsAsArrayState)
  const book = useRecoilValue(normalizedBooksState)[id || '-1']
  const [addToBook] = useMutation(MutationAddCollectionsToBookDocument)
  const [removeFromBook] = useMutation(MutationRemoveCollectionsToBookDocument)
  const bookCollection = book?.collections

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