import { Configuration } from 'webpack';
import { sharedConfig } from './shared.config'

const config: Configuration = {
  ...sharedConfig('syncDataSource'),
};

export default config;