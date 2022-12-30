import { Button, TextField, useTheme } from "@mui/material"
import { useEffect, useState } from "react"
import * as yup from "yup"
import Alert from "@mui/material/Alert"
import { API_URI } from "./constants"
import { useRegister } from "./register/useRegister"

const schema = yup.object().shape({
  email: yup.string().email().required()
})

export const BetaRegister = () => {
  const theme = useTheme()
  const [email, setEmail] = useState("")
  const isValid = useIsValid(email)
  const { mutate: sendEmail, error, status } = useRegister()

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <TextField
        label="Your email"
        id="beta-email"
        type="text"
        variant="outlined"
        disabled={status === "loading"}
        style={{
          minWidth: 300,
          marginBottom: theme.spacing(2)
        }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <Button
        variant="contained"
        disabled={!isValid || status === "loading"}
        size="large"
        color="primary"
        onClick={() => sendEmail({ email })}
        style={{
          minWidth: 300
        }}
      >
        {status === "loading" ? "Sending request..." : "Request access"}
      </Button>
      {(status === "success" || status === "error") && (
        <div
          style={{
            marginTop: theme.spacing(2)
          }}
        >
          {error ? (
            <Alert severity="warning">
              Looks like an error happened! Would you mind trying again?
            </Alert>
          ) : (
            <Alert severity="success">
              Thank you for your interest! We will soon send you an email with a
              code to access the app
            </Alert>
          )}
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
  const [error, setError] = useState(undefined)
  const [status, setStatus] = useState<undefined | "complete" | "fetching">(
    undefined
  )

  const cb = async (email: string) => {
    setStatus("fetching")
    setError(undefined)
    try {
      const response = await fetch(`${API_URI}/requestaccess`, {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      if (response.status !== 200) {
        throw new Error()
      }
    } catch (e) {
      setError(e as any)
    } finally {
      setStatus("complete")
    }
  }

  return [cb, { error, status }] as [
    typeof cb,
    { error: typeof error; status: typeof status }
  ]
}
