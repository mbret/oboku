import { generateResourceId, ObokuPlugin, yup } from "@oboku/plugin-front"
import { useState } from 'react'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Typography } from '@mui/material'
import { UNIQUE_RESOURCE_IDENTIFIER } from "@oboku/plugin-imhentai-shared"

const schema = yup.object().shape({
  galleryId: yup.number().required()
})

export const UploadComponent: ObokuPlugin[`UploadComponent`] = ({ onClose, title, TagsSelector, ButtonDialog }) => {
  const [galleryId, setGalleryId] = useState(``)
  const [tags, setTags] = useState<string[]>([])
  const isValid = schema.isValidSync({ galleryId })

  const handleConfirm = () => {
    onClose({
      resourceId: generateResourceId(UNIQUE_RESOURCE_IDENTIFIER, galleryId),
      tags
    })
  }

  const onTagsChange = (tags: string[]) => {
    setTags(tags)
  }

  return (
    <Dialog open fullScreen>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Provide the id of a gallery. Example, for the url <Typography component="span" noWrap display="inline"><b>https://imhentai.xxx/gallery/374305</b></Typography>, the id is <b>374305</b>
        </DialogContentText>
        <TextField
          autoFocus
          label="Gallery id"
          fullWidth
          value={galleryId}
          onChange={e => setGalleryId(e.target.value)}
        />
        <TagsSelector onChange={onTagsChange} />
      </DialogContent>
      <DialogActions>
        <ButtonDialog type="cancel" onClick={() => onClose()} />
        <ButtonDialog type="confirm" disabled={!isValid} onClick={handleConfirm} />
      </DialogActions>
    </Dialog>
  )
}
