import { lambda } from '../utils'
import { BadRequestError } from '../errors'
import nodeFetch from 'node-fetch'

export const fn = lambda(async (event) => {
  let params = event.queryStringParameters;
  let { Host, host, Origin, origin, ...headers } = event.headers;

  console.log(event);
  console.log(`Got request with params:`, params);

  if (!params || !params.url) {
    console.error("Unable get url from 'url' query parameter")
    throw new BadRequestError()
  }

  const requestParams = Object.entries(params)
    .reduce((acc: string[], param) => {
      if (param[0] !== 'url') {
        acc.push((param).join('='))
      }
      return acc;
    }, [])
    .join('&');

  const url = `${params.url}${requestParams}`;
  const hasBody = /(POST|PUT)/i.test(event.httpMethod);
  const res = await nodeFetch(url, {
    method: event.httpMethod,
    timeout: 20000,
    body: hasBody ? (event.body || ``) : undefined,
    headers: headers as any,
  });
  console.log(`Got response from ${url} ---> {statusCode: ${res.status}}`);

  const body = await res.text();

  return {
    statusCode: res.status,
    headers: {
      ...res.headers.raw(),
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body,
  };
})

