import React, { useEffect, useState } from 'react';
import { Typography, useTheme, Button, TextField, Link } from '@material-ui/core';
import { Alert } from '@material-ui/lab'
import { useSignin } from './queries';
import { ApolloError } from '@apollo/client';
import { OrDivider } from '../common/OrDivider';
import { useHistory } from 'react-router-dom';
import { ROUTES } from '../constants';
import { Header } from './Header';
import * as yup from 'yup'

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
})

export const LoginScreen = () => {
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signin, { error }] = useSignin()
  const theme = useTheme()
  const isValid = useIsValid(email, password)
  let hasInvalidInput = false
  let hasUnknownError = false

  if (error) {
    hasUnknownError = true
  }
  if (error instanceof ApolloError) {
    error.graphQLErrors.forEach(({ extensions }) => {
      if ((extensions as any)?.code === 'BAD_USER_INPUT') {
        hasInvalidInput = true
        hasUnknownError = false
      }
    })
  }

  const onSubmit = () => {
    signin(email, password)
  }

  console.log('[LoginScreen]', { error, isValid })

  return (
    <div style={{
      flex: 1
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
              marginTop: theme.spacing(4),
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
          marginTop: theme.spacing(4)
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