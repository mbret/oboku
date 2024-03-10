import React, { FC, memo, ReactNode } from "react"
import { Step, Tour } from "../app-tour"
import TagSvg from "../assets/undraw_schedule_pnbk.svg"
import Step2Cover from "../assets/undraw_Artificial_intelligence_re_enpp.svg"
import { Link, Typography, useTheme } from "@mui/material"
import { isTagsTourPossibleStateSignal } from "./firstTimeExperienceStates"
import { HeroCover } from "./HeroCover"
import { Slide } from "./Slide"
import { Content } from "./Content"
import { FirstTimeExperienceId } from "./constants"
import {
  useHasDoneFirstTimeExperience,
  useValidateFirstTimeExperience
} from "./helpers"
import { useSignalValue } from "reactjrx"

export const AppTourFirstTourTags: React.FC = memo(() => {
  const isTagsTourOpened = useSignalValue(isTagsTourPossibleStateSignal)
  const hasDoneFirstTimeExperience = useHasDoneFirstTimeExperience(
    FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS
  )
  const validateFirstTimeExperience = useValidateFirstTimeExperience(
    FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS
  )
  const show = !hasDoneFirstTimeExperience && isTagsTourOpened
  const theme = useTheme()

  return (
    <Tour
      unskippable
      id={FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS}
      show={show}
      onClose={validateFirstTimeExperience}
    >
      <Step
        id={FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS}
        number={1}
        content={
          <Slide>
            <div
              style={{
                flex: 0.4,
                display: "flex",
                alignItems: "center",
                flexFlow: "column",
                justifyContent: "center",
                backgroundColor: "white",
                width: "100%",
                minHeight: 0
              }}
            >
              <HeroCover src={TagSvg} style={{ margin: theme.spacing(3) }} />
            </div>
            <Content
              style={{
                flex: 0.6
              }}
            >
              <Typography variant="h5" align="left" gutterBottom>
                Tags
              </Typography>
              <Typography align="left">
                Using tags will help you organize, customize and search through
                your content more easily
              </Typography>
            </Content>
          </Slide>
        }
      />
      <Step
        id={FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS}
        number={3}
        content={
          <Slide>
            <div
              style={{
                flex: 0.4,
                display: "flex",
                alignItems: "center",
                flexFlow: "column",
                justifyContent: "center",
                backgroundColor: "white",
                width: "100%",
                minHeight: 0
              }}
            >
              <HeroCover
                src={Step2Cover}
                style={{ margin: theme.spacing(3) }}
              />
            </div>
            <Content
              style={{
                flex: 0.6
              }}
            >
              <Typography variant="h5" align="left" gutterBottom>
                Creating a tag (2)
              </Typography>
              <Typography align="left">
                By using the powerful{" "}
                <Link
                  href="https://docs.oboku.me/wiki/datasources#personalize-your-content-with-directives"
                  target="__blank"
                >
                  directive
                </Link>{" "}
                feature you can let oboku automatically create and manage tags
                for you. This is the most conveniant way if you are using data
                sources to synchronize your content
              </Typography>
            </Content>
          </Slide>
        }
      />
      <Step
        id={FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS}
        number={4}
        content={
          <Slide>
            <Content>
              <Typography variant="h5" align="left" gutterBottom>
                Organize
              </Typography>
              <Typography align="left">
                Once a tag is created you can assign it to your contents by
                clicking on the tag itself or your books action menu. You can
                also use{" "}
                <Link
                  href="https://docs.oboku.me/wiki/datasources#personalize-your-content-with-directives"
                  target="__blank"
                >
                  directive
                </Link>{" "}
                to let oboku assign tags automatically.
              </Typography>
            </Content>
          </Slide>
        }
      />
      <Step
        id={FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS}
        number={5}
        content={
          <Slide>
            <Content>
              <Typography variant="h5" align="left" gutterBottom>
                Customize
              </Typography>
              <Typography align="left">
                In addition to help organize and search through your content,
                each tags can be customized and apply different behavior on your
                content. You can for example protect all the book assigned to a
                specific tag, blur their covers etc... More customization will
                coming in the future
              </Typography>
            </Content>
          </Slide>
        }
      />
      <Step
        id={FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS}
        number={6}
        content={
          <Slide>
            <Content>
              <Typography variant="h5" align="left" gutterBottom>
                More info
              </Typography>
              <Typography align="left">
                To learn more about tags and how to use them please visit the{" "}
                <Link
                  href="https://docs.oboku.me/wiki/tags"
                  target="__blank"
                >
                  doc
                </Link>
              </Typography>
            </Content>
          </Slide>
        }
      />
    </Tour>
  )
})

export const AppTourFirstTourTagsStep2: FC<{ children: ReactNode }> = ({
  children
}) => {
  const theme = useTheme()

  return (
    <Step
      id={FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS}
      number={2}
      style={{
        display: `flex`,
        flex: 1
      }}
      spotlightSize={150}
      content={({ spotlightMeasures, spotlightSize }) => (
        <Slide
          style={{
            justifyContent: "flex-start",
            marginTop:
              (spotlightMeasures?.pageY || 0) +
              (spotlightSize || 0) / 2 +
              theme.spacing(4)
          }}
        >
          <Content
            style={{
              justifyContent: "flex-start"
            }}
          >
            <Typography variant="h5" align="left" gutterBottom>
              Creating a tag
            </Typography>
            <Typography align="left">
              Using this button is the most straightforward way to create a tag
              but it is not the only one...
            </Typography>
          </Content>
        </Slide>
      )}
    >
      {children}
    </Step>
  )
}
