import { useState } from "react"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography
} from "@mui/material"
import {
  PLUGIN_IMHENTAI_TYPE,
  PLUGIN_IMHENTAI_UNIQUE_RESOURCE_IDENTIFIER
} from "@oboku/shared"
import { ObokuPlugin } from "../plugin-front"
import { generateResourceId } from "@oboku/shared"
import { number, object } from "yup"

const schema = object().shape({
  galleryId: number().required()
})

export const UploadComponent: ObokuPlugin[`UploadComponent`] = ({
  onClose,
  title,
  TagsSelector,
  ButtonDialog
}) => {
  const [galleryId, setGalleryId] = useState(``)
  const [tags, setTags] = useState<string[]>([])
  const isValid = schema.isValidSync({ galleryId })

  const handleConfirm = () => {
    onClose({
      link: {
        resourceId: generateResourceId(
          PLUGIN_IMHENTAI_UNIQUE_RESOURCE_IDENTIFIER,
          galleryId
        ),
        type: PLUGIN_IMHENTAI_TYPE
      },
      book: {
        // tags
        title: `unknown`
      }
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
          Provide the id of a gallery. Example, for the url{" "}
          <Typography component="span" noWrap display="inline">
            <b>https://imhentai.xxx/gallery/374305</b>
          </Typography>
          , the id is <b>374305</b>
        </DialogContentText>
        <TextField
          autoFocus
          label="Gallery id"
          fullWidth
          value={galleryId}
          onChange={(e) => setGalleryId(e.target.value)}
        />
        <TagsSelector onChange={onTagsChange} />
      </DialogContent>
      <DialogActions>
        <ButtonDialog type="cancel" onClick={() => onClose()} />
        <ButtonDialog
          type="confirm"
          disabled={!isValid}
          onClick={handleConfirm}
        />
      </DialogActions>
    </Dialog>
  )
}
