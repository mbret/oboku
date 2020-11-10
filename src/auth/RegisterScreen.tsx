import React, { useState, useEffect } from 'react';
import { makeStyles, createStyles, Typography, useTheme, Button, TextField } from '@material-ui/core';
import { Alert } from '@material-ui/lab'
import * as R from 'ramda';
import { TopBarNavigation } from '../TopBarNavigation';
import { LockRounded, EmailRounded } from '@material-ui/icons';
import { useSignup } from './queries';
import { ApolloError } from '@apollo/client';
import { ERROR_EMAIL_TAKEN } from 'oboku-shared'
import { OrDivider } from '../common/OrDivider';
import { useLocation, useHistory } from 'react-router-dom';
import { ROUTES } from '../constants';
import * as yup from 'yup'

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
})

export const RegisterScreen = () => {
  const classes = useStyles();
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signup, { error }] = useSignup()
  const isValid = useIsValid(email, password)
  const theme = useTheme()
  let hasEmailTakenError = false
  let hasUnknownError = false

  if (error) {
    hasUnknownError = true
  }
  if (error instanceof ApolloError) {
    error.graphQLErrors.forEach(({ extensions }) => {
      if ((extensions as any)?.code === 'BAD_USER_INPUT' && (extensions as any)?.exception.code === ERROR_EMAIL_TAKEN) {
        hasEmailTakenError = true
        hasUnknownError = false
      }
    })
  }

  const onSubmit = () => {
    signup(email, password)
  }

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
          {hasEmailTakenError && (
            <Alert severity="info">This email is already taken</Alert>
          )}
          {hasUnknownError && (
            <Alert severity="info" >Something went wrong. Could you try again?</Alert>
          )}
          <Button
            style={{
              marginTop: theme.spacing(5),
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
          marginTop: theme.spacing(5)
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

const useStyles = makeStyles((theme) =>
  createStyles({
    title: {
      padding: theme.spacing(1),
      paddingTop: theme.spacing(2)
    }
  }),
);

const useIsValid = (email: string, password: string) => {
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    setIsValid(schema.isValidSync({ email, password }))
  }, [email, password])

  return isValid
}