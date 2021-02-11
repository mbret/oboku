import { Configuration } from 'webpack';
import { sharedConfig } from './shared.config'

const CopyPlugin = require("copy-webpack-plugin");

const baseConfig = sharedConfig('cover')

const config: Configuration = {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins || [],
    new CopyPlugin({
      patterns: [
        { from: __dirname + "/../src/assets", to: "assets" },
        { from: __dirname + "/../../../node_modules/sharp/vendor/8.10.5/lib", to: "lib" },
        // { from: __dirname + "/../node_modules/sharp/vendor/8.10.5/lib", to: "lib" },
      ],
    }),
  ]
};

export default config;