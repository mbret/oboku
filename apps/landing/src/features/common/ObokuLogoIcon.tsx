import type { ComponentProps } from "react"

const coverColor = "#ff7043"
const spineColor = "#bf360c"

export function ObokuLogoIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 90 100" aria-hidden="true" {...props}>
      <rect width="90" height="100" rx="9" fill={coverColor} />
      <path
        d="M9 0H15V100H9A9 9 0 0 1 0 91V9A9 9 0 0 1 9 0Z"
        fill={spineColor}
      />
    </svg>
  )
}
