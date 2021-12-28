const path = require(`path`)

const IS_PROD = process.env.NODE_ENV !== `development`

module.exports = {
  entry: {
    index: `./src/index.ts`
  },
  mode: IS_PROD ? `production` : `development`,
  ...!IS_PROD && {
    devtool: `source-map`
  },
  externals: [
    `request`,
    `node-fetch`,
    `cheerio`,
    `nano`,
    /^@oboku\/.+$/
  ],
  ...IS_PROD && {
    optimization: {
      minimize: true
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{
          loader: `ts-loader`
        }]
      }
    ]
  },
  resolve: {
    extensions: [`.tsx`, `.ts`, `.js`]
  },
  output: {
    filename: `[name].js`,
    path: path.resolve(__dirname, `dist`),
    libraryTarget: `commonjs`
  }
}
