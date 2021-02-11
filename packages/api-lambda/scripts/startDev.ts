import concurrently from 'concurrently'
import { functions } from '../functions';

concurrently(functions.map(fn => ({
  command: `webpack --config webpack/webpack.${fn}.ts --watch`,
  name: fn
})), {
  prefix: 'name',
  // killOthers: ['failure', 'success'],
  // restartTries: 3,
}).then(() => {

}, console.error);