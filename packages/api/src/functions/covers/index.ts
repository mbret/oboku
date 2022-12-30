import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "lambdaDefault",
  // layers: ["arn:aws:lambda:us-east-1:555884724298:layer:${sls:stage}-sharp:1"],
  // architecture: `x86_64` as const,
  events: [
    {
      http: {
        method: 'get',
        path: 'covers/{id}',
        // handle preflight cors
        cors: true,
        request: {
          parameters:
          {
            paths:
            {
              id: true
            },
          }
        },
      },
    },
  ],
};
