import { Button, styled, type ButtonProps } from "@mui/material"

const StyledButton = styled(Button)(() => ({
  borderRadius: "50%",
  padding: 8,
  minWidth: 0,
}))

export const ButtonAsIcon = ({ children, ...props }: ButtonProps) => {
  return <StyledButton {...props}>{children}</StyledButton>
}
