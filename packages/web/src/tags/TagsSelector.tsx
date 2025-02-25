import { FC, useEffect, useState } from "react"
import { SelectProps, useTheme } from "@mui/material"
import Input from "@mui/material/Input"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import FormControl from "@mui/material/FormControl"
import Select from "@mui/material/Select"
import { useTag, useTagIds } from "./helpers"
import { TagChip } from "./TagChip"

export const TagsSelector: FC<{ onChange: (tags: string[]) => void }> = ({
  onChange: onUpChange,
}) => {
  const { data: tags = [] } = useTagIds()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const theme = useTheme()

  const onChange: NonNullable<SelectProps[`onChange`]> = (event) => {
    setSelectedTags(event.target.value as string[])
  }

  const renderValue = (
    selected: string[],
  ): ReturnType<NonNullable<SelectProps[`renderValue`]>> => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
      }}
    >
      {selected.map((value) => (
        <TagChip
          key={value}
          id={value}
          style={{
            margin: theme.spacing(0.5),
          }}
        />
      ))}
    </div>
  )

  useEffect(() => {
    onUpChange(selectedTags)
  }, [selectedTags, onUpChange])

  return (
    <FormControl
      style={{
        marginTop: theme.spacing(4),
        width: `100%`,
      }}
    >
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
  const { data } = useTag(id)

  return <>{data?.name}</>
}
