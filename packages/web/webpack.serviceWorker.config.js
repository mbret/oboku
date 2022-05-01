/**
 * This file is being used only during development.
 * This is because during development the service worker file is not being updated.
 * It only is updated when building with CRA.
 */
const path = require("path")
const { DefinePlugin } = require("webpack")

module.exports = {
  entry: {
    "service-worker": "./src/service-worker.ts"
  },
  mode: "development",
  devtool: "source-map",
  optimization: {
    minimize: false
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                noEmit: false,
                files: [`src/service-worker.ts`]
              }
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "public")
  },
  plugins: [
    new DefinePlugin({
      "process.env.REACT_APP_API_URL": JSON.stringify(""),
      "process.env.REACT_APP_API_COUCH_URI": JSON.stringify("")
    })
  ]
}
