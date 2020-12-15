import { IconButton, useTheme } from '@material-ui/core'
import React from 'react'
import FeedbackOutlinedIcon from '@material-ui/icons/FeedbackOutlined';
import * as Sentry from "@sentry/react"
import { authState } from './auth/authState';
import { useRecoilValue } from 'recoil';

export const UserFeedback = () => {
  const theme = useTheme()
  const auth = useRecoilValue(authState)

  const showReportDialog = () => {
    Sentry.captureMessage('User feedback', { extra: { feedback: true, email: auth?.email } })
  }

  return (
    <IconButton style={{
      borderRadius: 50,
      transform: 'translateY(-0%) translateX(-40%)',
      padding: 10,
      paddingRight: 8,
      paddingLeft: 20,
      backgroundColor: theme.palette.primary.main,
      position: 'absolute',
      left: 0,
      bottom: 30,
      zIndex: 1600,
      display: 'flex',
      justifyContent: 'center',
    }}
      onClick={showReportDialog}
    >
      <FeedbackOutlinedIcon
        style={{ color: 'white' }}
        fontSize="default"
      />
    </IconButton>
  )
}