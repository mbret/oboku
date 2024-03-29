import React, { memo } from "react"
import { Step, Tour } from "../app-tour"
import FteUploadAsset from "../assets/fte-upload.svg"
import { Link, Typography, useTheme } from "@mui/material"
import { useCSS } from "../common/utils"
import { FirstTimeExperienceId } from "./constants"
import {
  useHasDoneFirstTimeExperience,
  useValidateFirstTimeExperience
} from "./helpers"
import { isUploadBookDrawerOpenedStateSignal } from "../library/states"
import { useSignalValue } from "reactjrx"

export const AppTourFirstAddingBook: React.FC = memo(() => {
  const isUploadBookDrawerOpened = useSignalValue(
    isUploadBookDrawerOpenedStateSignal
  )
  const hasDoneFirstTimeExperience = useHasDoneFirstTimeExperience(
    FirstTimeExperienceId.APP_TOUR_FIRST_ADDING_BOOK
  )
  const validateFirstTimeExperience = useValidateFirstTimeExperience(
    FirstTimeExperienceId.APP_TOUR_FIRST_ADDING_BOOK
  )
  const show = !hasDoneFirstTimeExperience && isUploadBookDrawerOpened
  const styles = useStyles()
  const theme = useTheme()

  return (
    <Tour
      unskippable
      id={FirstTimeExperienceId.APP_TOUR_FIRST_ADDING_BOOK}
      show={show}
      onClose={validateFirstTimeExperience}
    >
      <Step
        id={FirstTimeExperienceId.APP_TOUR_FIRST_ADDING_BOOK}
        number={1}
        content={
          <div style={styles.slide1}>
            <div
              style={{
                display: "flex",
                flexFlow: "column",
                alignItems: "center",
                maxWidth: theme.custom.maxWidthCenteredContent,
                width: "80%",
                paddingTop: theme.spacing(2)
              }}
            >
              <img
                src={FteUploadAsset}
                alt="cover"
                style={{
                  width: "100%",
                  objectFit: "contain",
                  paddingBottom: theme.spacing(2)
                }}
              />
              <Typography>
                Looks like you are about to add content to your library. There
                will be several options to choose from so feel free to read more
                about it on the{" "}
                <Link
                  href="https://docs.oboku.me/wiki/adding-a-book"
                  target="__blank"
                >
                  doc
                </Link>
              </Typography>
            </div>
          </div>
        }
      />
    </Tour>
  )
})

const useStyles = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      slide1: {
        padding: theme.spacing(2),
        boxSizing: "border-box",
        textAlign: "center",
        color: "#fff",
        display: "flex",
        flex: 1,
        flexFlow: "column",
        justifyContent: "center",
        alignItems: "center"
      }
    }),
    [theme]
  )
}
