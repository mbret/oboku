import React, { useState } from 'react';
import { Typography, useTheme, Button, TextField } from '@material-ui/core';
import { Alert } from '@material-ui/lab'
import { useSignin } from './queries';
import { ApolloError } from '@apollo/client';
import { OrDivider } from '../common/OrDivider';
import { useHistory } from 'react-router-dom';
import { ROUTES } from '../constants';

export const LoginScreen = () => {
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signin, { error }] = useSignin()
  const theme = useTheme()
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

  console.log('[LoginScreen]', { error })

  return (
    <div style={{
      flex: 1
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        flexFlow: 'row',
        paddingTop: theme.spacing(10),
        paddingBottom: theme.spacing(10),
      }}>
        <Typography variant="h1" color="textPrimary" style={{
          fontWeight: theme.typography.fontWeightBold,
        }}>O</Typography>
        <Typography variant="h1" color="primary" style={{
          display: 'flex',
          fontWeight: theme.typography.fontWeightBold,
          flexFlow: 'row',
        }}>
          boku
        </Typography>
      </div>
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
              marginTop: theme.spacing(5),
              width: '100%',
            }}
            variant="outlined"
            size="large"
            onClick={onSubmit}
          >
            Login
        </Button>
        </form>
        <OrDivider style={{
          marginTop: theme.spacing(5)
        }} />
        <Button
          style={{
            width: '100%',
          }}
          variant="outlined"
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