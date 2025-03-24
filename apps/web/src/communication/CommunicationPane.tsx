import { httpClient } from "../http/httpClient"
import { Alert, AlertTitle, Box, Link, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import type { ComponentProps } from "react"
import Markdown from "react-markdown"
import { configuration } from "../config/configuration"
type Communication = {
  type: ComponentProps<typeof Alert>["severity"]
  content?: string
  created_at: string
}

const oneDayInMs = 24 * 60 * 60 * 1000

export const CommunicationPane = () => {
  const { data } = useQuery({
    queryKey: ["api", "communication"],
    staleTime: oneDayInMs,
    gcTime: oneDayInMs / 2,
    networkMode: "online",
    queryFn: () =>
      httpClient.fetch<Communication[]>({
        url: `${configuration.API_URL}/communications`,
      }),
  })

  const latestNews = data?.data[0]

  return (
    <>
      {!!latestNews && (
        <Alert severity={latestNews?.type ?? "info"}>
          <AlertTitle>Latest news</AlertTitle>
          <Markdown
            components={{
              a: ({ children, ref, ...props }) => (
                <Link ref={ref as any} target="_blank" {...props}>
                  {children}
                </Link>
              ),
            }}
          >
            {latestNews?.content ?? ""}
          </Markdown>
          <Box mt={1}>
            <Typography variant="caption">
              {new Date(latestNews.created_at).toLocaleString()}
            </Typography>
          </Box>
        </Alert>
      )}
    </>
  )
}
