import React, { useState, useEffect } from 'react';
import { useTheme, Button, TextField } from '@material-ui/core';
import { Alert } from '@material-ui/lab'
import { ERROR_EMAIL_TAKEN, ERROR_INVALID_BETA_CODE } from 'oboku-shared'
import { OrDivider } from '../common/OrDivider';
import { Header } from './Header';
import { useHistory } from 'react-router-dom';
import { ROUTES } from '../constants';
import * as yup from 'yup'
import { useSignUp } from './helpers'
import { ServerError } from '../errors';

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
})

export const RegisterScreen = () => {
  const history = useHistory()
  const [email, setEmail] = useState(process.env.REACT_APP_EMAIL || '')
  const [password, setPassword] = useState(process.env.REACT_APP_PASSWORD || '')
  const [code, setCode] = useState('')
  const isValid = useIsValid(email, password)
  const theme = useTheme()
  const [signUp, { error }] = useSignUp()
  let hasEmailTakenError = false
  let hasBetaCodeError = false
  let hasUnknownError = false

  if (error instanceof ServerError) {
    error.errors.forEach(({ code }) => {
      if (code === ERROR_EMAIL_TAKEN) {
        hasEmailTakenError = true
        hasUnknownError = false
      } else if (code === ERROR_INVALID_BETA_CODE) {
        hasBetaCodeError = true
      }
    })
  } else if (error) {
    hasUnknownError = true
  }

  const onSubmit = async () => {
    signUp(email, password, code)
  }

  return (
    <div style={{
      flex: 1,
      paddingTop: theme.spacing(4),
      paddingBottom: theme.spacing(4),
    }}>
      <Header />
      <div style={{
        paddingLeft: theme.spacing(5),
        paddingRight: theme.spacing(5),
      }}>
        <form style={{}} noValidate autoComplete="off">
          <TextField
            label="Email"
            type="text"
            variant="outlined"
            autoComplete="email"
            style={{
              width: '100%',
              marginBottom: theme.spacing(2),
            }}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            variant="outlined"
            style={{
              width: '100%',
              marginBottom: theme.spacing(2),
            }}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <TextField
            label="Beta code"
            type="text"
            variant="outlined"
            style={{
              width: '100%',
              marginBottom: theme.spacing(2),
            }}
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          {hasEmailTakenError && (
            <Alert severity="info">This email is already taken</Alert>
          )}
          {hasUnknownError && (
            <Alert severity="info" >Something went wrong. Could you try again?</Alert>
          )}
          {hasBetaCodeError && (
            <Alert severity="info" >This beta code is not valid for this email</Alert>
          )}
          <Button
            style={{
              marginTop: theme.spacing(2),
              width: '100%',
            }}
            color="primary"
            variant="outlined"
            size="large"
            disabled={!isValid}
            onClick={onSubmit}
          >
            Register
        </Button>
        </form>
        <OrDivider style={{
          marginTop: theme.spacing(2)
        }} />
        <Button
          style={{
            width: '100%',
          }}
          color="primary"
          variant="outlined"
          size="large"
          onClick={() => {
            history.replace(ROUTES.LOGIN)
          }}
        >
          Login
        </Button>
      </div>
    </div>
  );
}

const useIsValid = (email: string, password: string) => {
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    setIsValid(schema.isValidSync({ email, password }))
  }, [email, password])

  return isValid
}