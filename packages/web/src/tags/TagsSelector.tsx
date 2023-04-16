import { FC, useEffect, useState } from "react"
import { SelectProps } from "@mui/material"
import Input from "@mui/material/Input"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import FormControl from "@mui/material/FormControl"
import Select from "@mui/material/Select"
import makeStyles from "@mui/styles/makeStyles"
import { useTag, useTagIds } from "./states"
import { TagChip } from "./TagChip"

export const TagsSelector: FC<{ onChange: (tags: string[]) => void }> = ({
  onChange: onUpChange
}) => {
  const classes = useStyles()
  const tags = useTagIds()
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const onChange: NonNullable<SelectProps[`onChange`]> = (event) => {
    setSelectedTags(event.target.value as string[])
  }

  const renderValue = (
    selected: string[]
  ): ReturnType<NonNullable<SelectProps[`renderValue`]>> => (
    <div className={classes.chips}>
      {selected.map((value) => (
        <TagChip key={value} id={value} className={classes.chip} />
      ))}
    </div>
  )

  useEffect(() => {
    onUpChange(selectedTags)
  }, [selectedTags, onUpChange])

  return (
    <FormControl className={classes.formControl}>
      <InputLabel id="tags-selector-multiple-label">Tags</InputLabel>
      <Select
        labelId="tags-selector-multiple-label"
        id="tags-selector-multiple"
        multiple
        value={selectedTags}
        onChange={onChange}
        input={<Input id="select-multiple-chip" />}
        renderValue={renderValue as any}
      >
        {tags.map((id) => (
          <MenuItem key={id} value={id}>
            <TagName id={id} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

const TagName: FC<{ id: string }> = ({ id }) => {
  const { name } = useTag(id) || {}

  return <>{name}</>
}

const useStyles = makeStyles((theme) => ({
  formControl: {
    marginTop: theme.spacing(4),
    width: `100%`
  },
  chips: {
    display: "flex",
    flexWrap: "wrap"
  },
  chip: {
    margin: theme.spacing(0.5)
  },
  noLabel: {
    marginTop: theme.spacing(3)
  }
}))
