import { Button, Dialog, DialogActions, DialogTitle } from '@material-ui/core';
import React, { FC } from 'react';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { CollectionSelectionList } from '../collections/CollectionSelectionList';
import { collectionsAsArrayState } from '../collections/states';
import { useAddCollectionToBook, useRemoveCollectionFromBook } from './helpers';
import { bookState } from './states';

export const openManageBookCollectionsDialog = atom<string | undefined>({ key: 'openManageBookCollectionsDialog', default: undefined })

export const ManageBookCollectionsDialog: FC<{}> = () => {
  const [id, setOpenManageBookCollectionsDialog] = useRecoilState(openManageBookCollectionsDialog)
  const open = !!id
  const collections = useRecoilValue(collectionsAsArrayState)
  const book = useRecoilValue(bookState(id || '-1'))
  const [addToBook] = useAddCollectionToBook()
  const [removeFromBook] = useRemoveCollectionFromBook()
  const bookCollection = book?.collections

  const isSelected = (id: string) => !!bookCollection?.find(item => item === id)

  return (
    <Dialog
      onClose={() => setOpenManageBookCollectionsDialog(undefined)}
      open={open}
    >
      <DialogTitle>Collection selection</DialogTitle>
      {collections && <CollectionSelectionList
        collections={collections}
        isSelected={isSelected}
        onItemClick={collectionId => {
          if (isSelected(collectionId)) {
            id && removeFromBook({ _id: id, collectionId })
          } else {
            id && addToBook({ _id: id, collectionId })
          }
        }}
      />}
      <DialogActions>
        <Button onClick={() => setOpenManageBookCollectionsDialog(undefined)} color="primary" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}