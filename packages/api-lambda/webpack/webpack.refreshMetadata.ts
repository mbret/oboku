import { Configuration } from 'webpack';
import { sharedConfig } from './shared.config'

const config: Configuration = {
  ...sharedConfig('refreshMetadata'),
};

export default config;