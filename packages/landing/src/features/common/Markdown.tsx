import styled from "@emotion/styled"
import { Link, Typography } from "@mui/material"
import React, { type ComponentProps } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const HeadingH2 = styled(Typography)`` as typeof Typography

const components: ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children, ...rest }) => (
    <Typography component="h1" variant="h4" sx={{ mb: 2 }} {...(rest as any)}>
      {children}
    </Typography>
  ),
  h2: ({ children, ...rest }) => (
    <HeadingH2
      component="h2"
      variant="h5"
      sx={{
        "p + &": {
          marginTop: 2,
        },
        "ul + &": {
          marginTop: 2,
        },
      }}
      {...(rest as any)}
    >
      {children}
    </HeadingH2>
  ),
  a: ({ children, ...rest }) => <Link {...(rest as any)}>{children}</Link>,
  p: ({ children, ...rest }) => (
    <Typography component="p" {...(rest as any)}>
      {children}
    </Typography>
  ),
}

export const Markdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="markdown"
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}
