import { FC, useEffect, useState } from "react"
import RcSlider from "rc-slider"
import "rc-slider/assets/index.css"
import { useRecoilValue } from "recoil"
import { currentPageState, manifestState, totalPageState } from "./states"
import { useTheme } from "@mui/material"
import { useReader } from "./ReaderProvider"

export const Scrubber: FC<{}> = () => {
  const currentPage = useRecoilValue(currentPageState)
  const totalPages = useRecoilValue(totalPageState) || 1
  const { readingDirection, renditionLayout } =
    useRecoilValue(manifestState) || {}
  const [value, setValue] = useState(currentPage || 0)
  const theme = useTheme()
  const reader = useReader()
  const max = totalPages <= 1 ? 2 : totalPages - 1
  const step = 1
  const disabled = totalPages === 1

  useEffect(() => {
    setValue(currentPage || 0)
  }, [currentPage])

  return (
    <RcSlider
      value={totalPages === 1 ? 1 : value}
      max={max}
      min={0}
      disabled={disabled}
      onChange={(value) => {
        if (typeof value === `number`) {
          setValue(value)

          // @todo onChange will change directly when moving scrubber, on after change is good however it triggers twice
          if (renditionLayout !== "reflowable") {
            reader?.goToSpineItem(value)
          } else {
            reader?.goToPageOfCurrentChapter(value)
          }
        }
      }}
      reverse={readingDirection === "rtl"}
      step={step}
      railStyle={{
        backgroundColor: theme.palette.grey["800"],
        ...(disabled && {
          // backgroundColor: theme.palette.grey['400'],
          backgroundColor: theme.palette.action.disabled
        }),
        height: 5
      }}
      trackStyle={{
        backgroundColor: theme.palette.grey["100"],
        ...(disabled && {
          // backgroundColor: theme.palette.grey['400'],
          backgroundColor: "transparent"
        }),
        height: 5
      }}
      handleStyle={{
        backgroundColor: theme.palette.primary.light,
        border: `2px solid white`,
        width: 25,
        height: 25,
        marginTop: -10
        // boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.14), 0px 3px 4px rgba(0, 0, 0, 0.12), 0px 1px 5px rgba(0, 0, 0, 0.2)',
      }}
    />
  )
}
