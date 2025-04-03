export const config = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    `${window.location.protocol}//${window.location.hostname}:3000`,
}
