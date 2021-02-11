let _logger: { log: typeof console['log'], error: typeof console['error'] } = console

export const configure = (logger: { log: typeof console['log'], error: typeof console['error'] }) => {
  _logger = logger
}

export const Logger = {
  namespace: (name: string) => ({
    log: (message?: any, ...optionalParams: any[]) => _logger.log(name, message, ...optionalParams),
    error: (...optionalParams: any[]) => _logger.error(...optionalParams),
  }),
  log: (message?: any, ...optionalParams: any[]) => _logger.log(message, ...optionalParams),
  error: (e: any) => _logger.error(e),
}