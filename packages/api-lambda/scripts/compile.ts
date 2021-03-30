import concurrently from 'concurrently'
import { functions } from '../functions';

concurrently(functions.map(fn => ({
  command: `webpack --config webpack/webpack.${fn}.ts`,
  name: fn
})), {
  prefix: 'name',
}).then(() => {
  
}, console.error);