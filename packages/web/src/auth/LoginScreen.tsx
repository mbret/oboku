import React, { useEffect, useState } from 'react';
import { useTheme, Button, TextField, Link } from '@material-ui/core';
import { Alert } from '@material-ui/lab'
import { OrDivider } from '../common/OrDivider';
import { useHistory } from 'react-router-dom';
import { ROUTES } from '../constants';
import { Header } from './Header';
import { validators } from '@oboku/shared'
import { useSignIn } from './helpers';
import { ServerError } from '../errors';
import { CenteredBox } from '../common/CenteredBox';
import { useTranslation } from 'react-i18next';

export const LoginScreen = () => {
  const history = useHistory()
  const [email, setEmail] = useState(process.env.REACT_APP_EMAIL || '')
  const [password, setPassword] = useState(process.env.REACT_APP_PASSWORD || '')
  const [signIn, { error }] = useSignIn()
  const theme = useTheme()
  const isValid = useIsValid(email, password)
  const { t } = useTranslation()
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
    <CenteredBox style={{
      flexShrink: 0,
      paddingTop: theme.spacing(4),
      paddingBottom: theme.spacing(4),
      overflow: 'scroll',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />
      <form noValidate autoComplete="off" onSubmit={e => e.preventDefault()}>
        <TextField
          label="Email"
          type="email"
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
          type="submit"
          onClick={onSubmit}
        >
          {t(`button.title.login`)}
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
    </CenteredBox>
  );
}

const useIsValid = (email: string, password: string) => {
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    setIsValid(validators.signinSchema.isValidSync({ email, password }))
  }, [email, password])

  return isValid
}