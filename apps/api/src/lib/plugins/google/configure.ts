let secrets = {
  client_id: "",
  client_secret: "",
}

export const getSecrets = () => secrets

export const configure = (options: typeof secrets) => {
  secrets = options
}
