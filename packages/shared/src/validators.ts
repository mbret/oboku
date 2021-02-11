import * as yup from 'yup'

export const signinSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
})

export const signupSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
})