import { Button, TextField, useTheme } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import * as yup from 'yup'
import Alert from '@material-ui/lab/Alert'
import { API_URI } from './constants'

const schema = yup.object().shape({
  email: yup.string().email().required(),
})

export const BetaRegister = () => {
  const theme = useTheme()
  const [email, setEmail] = useState('')
  const isValid = useIsValid(email)
  const [sendEmail, { error, status }] = useSendMail()

  const onRequestAccess = async () => {
    sendEmail(email)
  }

  return (
    <form>
      <TextField
        label="Your email"
        id="beta-email"
        type="text"
        variant="outlined"
        style={{
          minWidth: 300,
          marginBottom: theme.spacing(2),
        }}
        value={email}
        onChange={e => setEmail(e.target.value)}
      /><br />
      <Button
        variant="outlined"
        disabled={!isValid || status === 'fetching'}
        size="large"
        color="primary"
        onClick={onRequestAccess}
        style={{
          minWidth: 300,
        }}
      >{status === 'fetching' ? 'Sending request...' : 'Request access'}</Button>
      {status === 'complete' && (
        <div style={{
          marginTop: theme.spacing(2),
        }}>
          {error
            ? <Alert severity="warning">Looks like an error happened! Would you mind trying again?</Alert>
            : <Alert severity="success">Thank you for your interest! We will soon send you an email with a code to access the app</Alert>}
        </div>
      )}
    </form>
  )
}

const useIsValid = (email: string) => {
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    setIsValid(schema.isValidSync({ email }))
  }, [email])

  return isValid
}

const useSendMail = () => {
  const [error, setEror] = useState(undefined)
  const [status, setStatus] = useState<undefined | 'complete' | 'fetching'>(undefined)

  const cb = async (email: string) => {
    setStatus('fetching')
    setEror(undefined)
    try {
      const response = await fetch(`${API_URI}/requestaccess`, {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      if (response.status !== 200) {
        throw new Error()
      }
    } catch (e) {
      setEror(e)
    } finally {
      setStatus('complete')
    }
  }

  return [cb, { error, status }] as [typeof cb, { error: typeof error, status: typeof status }]
}