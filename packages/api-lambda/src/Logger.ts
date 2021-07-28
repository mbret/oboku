import util from 'util'

export const UtilLogger = {
  log: (message?: any, ...optionalParams: any[]) => {
    console.log('oboku:log', JSON.stringify(message || ''), ...optionalParams.map(v => JSON.stringify(v)))
  },
  error: (a: any, b?: any, c?: any) => {
    console.error(typeof a !== 'string' ? util.inspect(a) : a, typeof b !== 'string' ? util.inspect(b) : b, util.inspect(c))
  }
}

let _logger: { log: typeof console['log'], error: typeof console['error'] } = UtilLogger

// export const configure = (logger: { log: typeof console['log'], error: typeof console['error'] }) => {
//   _logger = logger
// }

export const Logger = {
  namespace: (name: string) => ({
    log: (message?: any, ...optionalParams: any[]) => _logger.log(name, message, ...optionalParams),
    error: (...optionalParams: any[]) => _logger.error(...optionalParams),
  }),
  log: (message?: any, ...optionalParams: any[]) => _logger.log(message, ...optionalParams),
  error: (e: any) => _logger.error(e),
}