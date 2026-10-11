"use client"

// In server modules next/link resolves to a server component, which cannot be
// passed to the `component` prop of an MUI component.
export { default as NextLink } from "next/link"
