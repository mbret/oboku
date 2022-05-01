import { FC, useEffect, useState } from "react"
import { SelectProps } from "@material-ui/core"
import Input from "@material-ui/core/Input"
import InputLabel from "@material-ui/core/InputLabel"
import MenuItem from "@material-ui/core/MenuItem"
import FormControl from "@material-ui/core/FormControl"
import Select from "@material-ui/core/Select"
import { makeStyles } from "@material-ui/core/styles"
import { useRecoilValue } from "recoil"
import { tagIdsState, tagState } from "./states"
import { TagChip } from "./TagChip"

export const TagsSelector: FC<{ onChange: (tags: string[]) => void }> = ({
  onChange: onUpChange
}) => {
  const classes = useStyles()
  const tags = useRecoilValue(tagIdsState)
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
  const { name } = useRecoilValue(tagState(id)) || {}

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
