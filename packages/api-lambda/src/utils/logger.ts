import util from 'util'

export const Logger = {
  log: (message?: any, ...optionalParams: any[]) => {
    console.log('oboku:log', JSON.stringify(message || ''), ...optionalParams.map(v => JSON.stringify(v)))
  },
  error: (a: any, b?: any, c?: any) => {
    console.error(typeof a !== 'string' ? util.inspect(a) : a, typeof b !== 'string' ? util.inspect(b) : b, util.inspect(c))
  }
}