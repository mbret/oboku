import { ComponentProps } from "react"
import { ObokuPlugin } from "@oboku/plugin-front"
import { FC, useState } from "react"
import { useDataSourceHelpers } from "../helpers"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography
} from "@mui/material"
import * as yup from "yup"
import { ButtonDialog } from "../../common/ButtonDialog"
import { TagsSelector } from "../../tags/TagsSelector"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"

const schema = yup.object().shape({
  galleryId: yup.number().required()
})

type Props = ComponentProps<NonNullable<ObokuPlugin[`UploadComponent`]>>

export const UploadComponent: FC<Props> = ({ onClose, title }) => {
  const { generateResourceId } = useDataSourceHelpers(
    UNIQUE_RESOURCE_IDENTIFIER
  )
  const [galleryId, setGalleryId] = useState(``)
  const [tags, setTags] = useState<string[]>([])
  const isValid = schema.isValidSync({ galleryId })

  const handleConfirm = () => {
    onClose({
      resourceId: generateResourceId(galleryId),
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
          Provide the id of a gallery. Example, for the url{" "}
          <Typography component="span" noWrap display="inline">
            <b>https://nhentai.to/g/374305</b>
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
