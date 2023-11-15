import { object, string } from "yup"

export const signinSchema = object().shape({
  email: string().email().required(),
  password: string().required()
})

export const signupSchema = object().shape({
  email: string().email().required(),
  password: string().required(),
  code: string().required()
})
