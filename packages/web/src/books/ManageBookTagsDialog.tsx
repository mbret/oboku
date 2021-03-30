import { Button, Dialog, DialogActions, DialogTitle } from '@material-ui/core';
import { FC } from 'react';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { tagsAsArrayState } from '../tags/states';
import { TagsSelectionList } from '../tags/TagsSelectionList';
import { useAddTagToBook, useRemoveTagFromBook } from './helpers';
import { bookState } from './states';

export const openManageBookTagsDialogState = atom<string | undefined>({ key: 'openManageBookTagsDialogState', default: undefined })

export const ManageBookTagsDialog: FC<{}> = () => {
  const [id, setOpenManageBookTagsDialogState] = useRecoilState(openManageBookTagsDialogState)
  const open = !!id
  const tags = useRecoilValue(tagsAsArrayState)
  const book = useRecoilValue(bookState(id || '-1'))
  const addToBook = useAddTagToBook()
  const removeFromBook = useRemoveTagFromBook()
  const bookTags = book?.tags

  const isSelected = (id: string) => !!bookTags?.find(item => item === id)

  return (
    <Dialog
      onClose={() => setOpenManageBookTagsDialogState(undefined)}
      open={open}
      // fullScreen
    >
      <DialogTitle>Book tags</DialogTitle>
      {tags && <TagsSelectionList
        tags={tags}
        isSelected={isSelected}
        onItemClick={tagId => {
          if (isSelected(tagId)) {
            id && removeFromBook({ bookId: id, tagId })
          } else {
            id && addToBook({ _id: id, tagId })
          }
        }}
      />}
      <DialogActions>
        <Button onClick={() => setOpenManageBookTagsDialogState(undefined)} color="primary" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}