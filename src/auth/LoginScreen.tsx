import React, { useEffect, useState } from 'react';
import { useTheme, Button, TextField, Link } from '@material-ui/core';
import { Alert } from '@material-ui/lab'
import { OrDivider } from '../common/OrDivider';
import { useHistory } from 'react-router-dom';
import { ROUTES } from '../constants';
import { Header } from './Header';
import * as yup from 'yup'
import { useSignIn } from './helpers';
import { ServerError } from '../errors';

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
})

export const LoginScreen = () => {
  const history = useHistory()
  const [email, setEmail] = useState(process.env.REACT_APP_EMAIL || '')
  const [password, setPassword] = useState(process.env.REACT_APP_PASSWORD || '')
  const [signIn, { error }] = useSignIn()
  const theme = useTheme()
  const isValid = useIsValid(email, password)
  let hasInvalidInput = false
  let hasUnknownError = false

  if (error) {
    hasUnknownError = true
  }
  if (error instanceof ServerError && error.response.status === 400) {
    hasInvalidInput = true
    hasUnknownError = false
  }

  const onSubmit = async () => {
    signIn(email, password)
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
          {hasInvalidInput && (
            <Alert severity="info" >Wrong credentials</Alert>
          )}
          {hasUnknownError && (
            <Alert severity="info" >Something went wrong. Could you try again?</Alert>
          )}
          <Button
            style={{
              marginTop: theme.spacing(2),
              width: '100%',
            }}
            color="primary"
            variant="outlined"
            disabled={!isValid}
            size="large"
            onClick={onSubmit}
          >
            Login
        </Button>
          <div style={{ textAlign: 'center', margin: theme.spacing(2) }}>
            <Link color="textPrimary" href="#" onClick={() => alert('Not implemented yet')}>
              I forgot my password
            </Link>
          </div>
        </form>
        <OrDivider style={{
          marginTop: theme.spacing(2)
        }} />
        <Button
          style={{
            width: '100%',
          }}
          variant="outlined"
          color="primary"
          size="large"
          onClick={() => {
            history.replace(ROUTES.REGISTER)
          }}
        >
          Register
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