import React, { memo } from "react"
import { Step, Tour } from "../app-tour"
import { Box, Button, Typography, useTheme } from "@material-ui/core"
import { TouchAppRounded } from "@material-ui/icons"
import { useCSS } from "../common/utils"
import { FirstTimeExperienceId } from "./constants"
import {
  useValidateFirstTimeExperience,
  useHasDoneFirstTimeExperience
} from "./helpers"
import { HORIZONTAL_TAPPING_RATIO } from "../reader/constants"

export const AppTourReader: React.FC = memo(() => {
  const validateFirstTimeExperience = useValidateFirstTimeExperience(
    FirstTimeExperienceId.APP_TOUR_READER
  )
  const hasDoneFirstTimeExperience = useHasDoneFirstTimeExperience(
    FirstTimeExperienceId.APP_TOUR_READER
  )
  const theme = useTheme()
  const show = !hasDoneFirstTimeExperience
  const styles = useStyles()

  return (
    <Tour
      unskippable
      id={FirstTimeExperienceId.APP_TOUR_READER}
      show={show}
      onClose={validateFirstTimeExperience}
    >
      <Step
        id={FirstTimeExperienceId.APP_TOUR_READER}
        number={1}
        withButtons={false}
        content={({ onClose }) => (
          <div style={styles.slide1}>
            {/* <Box style={{
              borderBottom: '1px dashed white',
              height: verticalTappingZoneHeight,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              flexFlow: 'column',
              justifyContent: 'center',
            }}>
              <Typography>Tap here to show the top menu</Typography>
              <TouchAppRounded />
            </Box> */}
            <div
              style={{
                display: "flex",
                flex: 1
              }}
            >
              <div
                style={{
                  borderRight: "1px dashed white",
                  height: "100%",
                  width: `${HORIZONTAL_TAPPING_RATIO * 100}%`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <TouchAppRounded />
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  flexFlow: "column",
                  padding: theme.spacing(3)
                }}
              >
                <div>
                  <Typography>
                    Navigate through the book by tapping on the side of the
                    screen
                  </Typography>
                </div>
                <Box mt={4}>
                  <TouchAppRounded />{" "}
                  <Typography>
                    Tap in the middle to toggle top and bottom menu
                  </Typography>
                </Box>
                <Box mt={4}>
                  <Button variant="outlined" size="large" onClick={onClose}>
                    Got it
                  </Button>
                </Box>
              </div>
              <div
                style={{
                  borderLeft: "1px dashed white",
                  height: "100%",
                  width: `${HORIZONTAL_TAPPING_RATIO * 100}%`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <TouchAppRounded />
              </div>
            </div>
            {/* <Box style={{
              borderTop: '1px dashed white',
              height: verticalTappingZoneHeight,
              width: '100%',
              display: 'flex',
              flexFlow: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TouchAppRounded />
              <Typography>Tap here to show reading controls menu</Typography>
            </Box> */}
          </div>
        )}
      />
    </Tour>
  )
})

const useStyles = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      slide1: {
        boxSizing: "border-box",
        color: "#fff",
        display: "flex",
        flex: 1,
        flexFlow: "column"
      }
    }),
    [theme]
  )
}
