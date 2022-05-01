import { useState } from "react"
import { useInterval } from "react-use"

export const useTime = () => {
  const [time, setTime] = useState(new Date())

  useInterval(() => setTime(new Date()), 1000 * 60)

  return time
}
