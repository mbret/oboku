import { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { getAwsLambda, middyfy } from '@libs/lambda';
import { getNormalizedHeader } from '@libs/utils';
import { STAGE } from '../../constants';
import schema from './schema';

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  await getAwsLambda().invoke({
    InvocationType: 'Event',
    FunctionName: `oboku-api-${STAGE}-syncDataSourceLongProcess`,
    Payload: JSON.stringify({
      body: {
        dataSourceId: event.body.dataSourceId,
        credentials: getNormalizedHeader(event, `oboku-credentials`),
        authorization: getNormalizedHeader(event, `authorization`),
      },
    }),
  }).promise()

  return {
    statusCode: 202,
    body: JSON.stringify({}),
  }
};

export const main = middyfy(lambda);
