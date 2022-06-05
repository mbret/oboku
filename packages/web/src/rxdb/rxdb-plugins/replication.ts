export const getReplicationProperties = (name: string) => ({
  rx_model: {
    type: "string",
    enum: [name],
    default: name,
    final: true,
    rx_model: true
  }
})