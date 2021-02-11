import * as express from 'express'
import { createProxyServer } from 'http-proxy'
import { AWS_API_URI } from '../constants';

const proxy = createProxyServer()
const awsProxyRouter = express.Router();

const proxyMiddleware: express.RequestHandler = async (req, res, next) => {
  proxy.web(req, res, {
    changeOrigin: true,
    target: AWS_API_URI
  }, err => next(err))
}

awsProxyRouter.all('/signin', proxyMiddleware)
awsProxyRouter.all('/signup', proxyMiddleware)
awsProxyRouter.all('/refresh-metadata', proxyMiddleware)
awsProxyRouter.all('/sync-datasource', proxyMiddleware)
awsProxyRouter.get('/cover/:id', proxyMiddleware)

export { awsProxyRouter }

