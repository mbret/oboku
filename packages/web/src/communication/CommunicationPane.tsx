import { useQuery } from "reactjrx"
import { httpClient } from "../http/httpClient"
import { Alert, AlertTitle, Box, Link, Typography } from "@mui/material"
import { ComponentProps } from "react"
import Markdown from "react-markdown"

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
        url: `${import.meta.env.VITE_SUPABASE_API_URL}/communication?limit=1`,
        withAuth: false,
        headers: {
          apiKey: import.meta.env.VITE_SUPABASE_API_KEY ?? ""
        }
      })
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Link ref={ref as any} target="_blank" {...props}>
                  {children}
                </Link>
              )
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
