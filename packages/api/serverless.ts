import covers from "@functions/covers"
import signin from "@functions/signin"
import requestAccess from "@functions/requestAccess"
import refreshMetadata from "@functions/refreshMetadata"
import refreshMetadataLongProcess from "@functions/refreshMetadataLongProcess"
import refreshMetadataCollection from "@functions/refreshMetadataCollection"
import refreshMetadataCollectionLongProcess from "@functions/refreshMetadataCollectionLongProcess"
import syncDataSource from "@functions/syncDataSource"
import syncDataSourceLongProcess from "@functions/syncDataSourceLongProcess"
import corsProxy from "@functions/corsProxy"
import syncReports from "@functions/syncReports"

// npm install --arch=x64 --platform=darwin sharp -w @oboku/api

const ENVS_TO_MAP = [
  "COUCH_DB_URL",
  "CONTACT_TO_ADDRESS",
  "AWS_API_URI",
  "GOOGLE_BOOK_API_URL",
  "OFFLINE",
  "COVERS_PLACEHOLDER_BUCKET_KEY",
  "COVERS_BUCKET_NAME",
  "SUPABASE_PROJECT_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
]

const functions = {
  covers,
  signin,
  requestAccess,
  refreshMetadata,
  refreshMetadataLongProcess,
  syncDataSource,
  syncDataSourceLongProcess,
  cors: corsProxy,
  refreshMetadataCollection,
  refreshMetadataCollectionLongProcess,
  syncReports,
}

Object.keys(functions).forEach((key) => {
  const fn = functions[key as keyof typeof functions]

  if (!fn) return

  // dynamically add common layer to all functions
  // @ts-ignore
  fn.layers = [
    // @ts-ignore
    ...(fn.layers ?? []),
    // Ref name is generated by TitleCasing the layer name & appending LambdaLayer
    { Ref: "CommonLibsLambdaLayer" },
  ]
})

const serverlessConfiguration = {
  service: "oboku-api",
  frameworkVersion: "4",
  useDotenv: true,
  plugins: [
    "serverless-esbuild",
    "serverless-offline",
    /**
     * @see https://www.serverless.com/framework/docs/providers/aws/events/sqs
     * SQS
     */
    "serverless-lift",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs20.x",
    timeout: 30, //  30 seconds
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      binaryMediaTypes: [`*/*`],
    },
    logs: {
      restApi: true,
    },
    // Do this if you want to load env vars into the Serverless environment AND
    // automatically configure all your functions with them.
    // This is usually not recommended to avoid loading secrets by accident (e.g. AWS_SECRET_ACCESS_KEY)
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      STAGE: "${sls:stage}",
      ...ENVS_TO_MAP.reduce(
        (acc, key) => ({ ...acc, [key]: `$\{env:${key}}` }),
        {},
      ),
    },
  },
  layers: {
    // sharp: {
    //   name: "${sls:stage}-sharp",
    //   path: `layers/SharpLayer`, // required, path to layer contents on disk
    //   description: `sharp@0.30.3`,
    //   package: {
    //     include: [`node_modules/**`]
    //   },
    // }
    commonLibs: {
      path: "layers",
      name: "commonLibs",
      description: "Common big dependencies",
      // "compatibleRuntimes": [
      //   "python3.8"
      // ],
      // "compatibleArchitectures": [
      //   "x86_64",
      //   "arm64"
      // ],
      // "licenseInfo": "GPLv3",
      retain: false,
    },
  },
  // import the function via paths
  functions,
  resources: {
    Resources: {
      /**
       * library synchronization queue.
       * Enforce we don't have several sync in parallel and prevent
       * too many usages
       */
      SyncQueue: {
        Type: "AWS::SQS::Queue",
      },
      // @see https://www.serverless.com/framework/docs/providers/aws/guide/iam#custom-iam-roles
      lambdaDefault: {
        Type: `AWS::IAM::Role`,
        Properties: {
          RoleName: "${self:service}-${sls:stage}-${aws:region}-lambda-default",
          // required if you want to use 'serverless deploy --function' later on
          AssumeRolePolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: { Service: [`lambda.amazonaws.com`] },
                Action: "sts:AssumeRole",
              },
            ],
          },
          Policies: [
            {
              PolicyName:
                "${self:service}-${sls:stage}-${aws:region}-lambda-default-policy",
              PolicyDocument: {
                Statement: [
                  // note that these rights are given in the default policy and are required if you want logs out of your lambda(s)
                  {
                    Effect: `Allow`,
                    Action: [
                      `logs:CreateLogGroup`,
                      `logs:CreateLogStream`,
                      `logs:PutLogEvents`,
                    ],
                    Resource: [
                      {
                        "Fn::Join": [
                          ":",
                          [
                            "arn:aws:logs",
                            {
                              Ref: "AWS::Region",
                            },
                            {
                              Ref: "AWS::AccountId",
                            },
                            "log-group:/aws/lambda/${self:service}-${sls:stage}*:*:*",
                          ],
                        ],
                      },
                    ],
                  },
                  {
                    Effect: "Allow",
                    Action: [
                      "s3:GetObject",
                      "s3:ListBucket",
                      "s3:GetBucketLocation",
                      "s3:GetObjectVersion",
                      "s3:GetLifecycleConfiguration",
                      "s3:PutObject",
                      "s3:PutObjectAcl",
                    ],
                    Resource: [
                      "arn:aws:s3:::oboku-covers",
                      "arn:aws:s3:::oboku-covers/*",
                    ],
                  },
                  {
                    Effect: "Allow",
                    Action: ["lambda:InvokeFunction"],
                    Resource: [
                      "arn:aws:lambda:${aws:region}:*:function:${self:service}-${sls:stage}*",
                    ],
                  },
                  // this is needed to read from ssm and retrieve secrets
                  {
                    Effect: `Allow`,
                    Action: [`ssm:GetParameter`, `ssm:GetParameters`],
                    Resource: [
                      {
                        "Fn::Join": [
                          ":",
                          [
                            "arn:aws:ssm",
                            {
                              Ref: "AWS::Region",
                            },
                            {
                              Ref: "AWS::AccountId",
                            },
                            "parameter/*",
                          ],
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
    },
  },
  package: { individually: true },
  /**
   * @important
   * There are issue with v4 embedded esbuild and middy files
   * @see https://github.com/middyjs/middy/issues/1208
   * @see https://www.reddit.com/r/typescript/comments/1abj9k2/middy_with_ts_and_serverless_offline/
   *
   * for the moment the plugin works but not v4 esbuild.
   */
  build: {
    esbuild: false,
  },
  custom: {
    esbuild: {
      minify: false,
      /**
       * With esbuild it seems to be better to build with everything rather than use external.
       * It will have only one smaller file and prevent having node_modules with all the extra unnecessary
       * stuff. Unless needed (sharp) we should let esbuild output one js file.
       */
      external: [
        // https://github.com/3846masa/http-cookie-agent/issues/291
        `deasync`,
        /**
         * We add sharp as external because we want our specific build to be patched and included in node_modules
         * of the bundled function.
         */
        "sharp",
        // most likely not required
        `aws-lambda`,
        `node-unrar-js`,
      ],
      packagerOptions: {
        scripts: [
          // This will install node_modules for every functions again which adds extra time
          // This will only bundle required node_modules if the functions import something (optimization from esbuild)
          // @todo would be better to use an already made sharp image so we don't add this extra payload
          `rm -rf node_modules/sharp && SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --arch=x64 --platform=linux sharp`,
        ],
      },
    },
  },
}

module.exports = serverlessConfiguration
