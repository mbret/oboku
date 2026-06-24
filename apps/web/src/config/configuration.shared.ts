export const getApiUrl = () =>
  import.meta.env.VITE_API_URL ||
  `${self.location.protocol}//${self.location.hostname}:3000`
