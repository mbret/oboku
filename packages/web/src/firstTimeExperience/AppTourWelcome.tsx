import React, { memo } from "react"
import { Step, Tour } from "../app-tour"
import FteCoverAsset from "../assets/fte-cover.svg"
import { Typography, useTheme } from "@mui/material"
import { Logo } from "../common/Logo"
import { useRecoilValue } from "recoil"
import { authState } from "../auth/authState"
import { useCSS } from "../common/utils"
import { FirstTimeExperienceId } from "./constants"
import {
  useHasDoneFirstTimeExperience,
  useValidateFirstTimeExperience
} from "./helpers"

export const AppTourWelcome: React.FC = memo(() => {
  const hasDoneFirstTimeExperience = useHasDoneFirstTimeExperience(
    FirstTimeExperienceId.APP_TOUR_WELCOME
  )
  const validateFirstTimeExperience = useValidateFirstTimeExperience(
    FirstTimeExperienceId.APP_TOUR_WELCOME
  )
  const { token } = useRecoilValue(authState) || {}
  const show = !hasDoneFirstTimeExperience && !!token
  const styles = useStyles()
  const theme = useTheme()

  return (
    <Tour
      unskippable
      id={FirstTimeExperienceId.APP_TOUR_WELCOME}
      show={show}
      onClose={validateFirstTimeExperience}
    >
      <Step
        id={FirstTimeExperienceId.APP_TOUR_WELCOME}
        number={1}
        content={
          <div style={styles.slide1}>
            <Logo />
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
                src={FteCoverAsset}
                alt="cover"
                style={{
                  width: "80%",
                  objectFit: "contain",
                  paddingBottom: theme.spacing(2)
                }}
              />
              <Typography>
                Welcome and thank you for using the app. oboku is under heavy
                development so bugs are to be expected
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
        // display,
        padding: theme.spacing(2),
        boxSizing: "border-box",
        textAlign: "center",
        // border: '1px solid red',
        color: "#fff",
        display: "flex",
        flex: 1,
        flexFlow: "column",
        justifyContent: "center",
        alignItems: "center"
        // paddingHorizontal: 30,
        // justifyContent: 'center',
        // ...DeviceInfo.isTablet() && {
        //   paddingHorizontal: 180,
        // },
      }
    }),
    [theme]
  )
}
