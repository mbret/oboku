const path = require(`path`)

const IS_PROD = process.env.NODE_ENV !== `development`

module.exports = {
  entry: {
    index: `./src/front/index.ts`
  },
  mode: IS_PROD ? `production` : `development`,
  ...!IS_PROD && {
    devtool: `source-map`
  },
  externals: [
    `react`,
    `react-dom`,
    /^@material-ui\/.+$/,
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
          loader: `ts-loader`,
          options: {
            compilerOptions: {
              noEmit: false
            },
            configFile: require.resolve(`./tsconfig.front.json`)
          }
        }]
      }
    ]
  },
  resolve: {
    extensions: [`.tsx`, `.ts`, `.js`]
  },
  output: {
    filename: `[name].js`,
    path: path.resolve(__dirname, `dist/front`),
    libraryTarget: `commonjs`
  }
}
