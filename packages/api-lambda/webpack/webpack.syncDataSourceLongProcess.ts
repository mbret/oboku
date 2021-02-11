import { Configuration } from 'webpack';
import { sharedConfig } from './shared.config'

const config: Configuration = {
  ...sharedConfig('syncDataSourceLongProcess'),
};

export default config;