import * as express from 'express'
import { router as mixedRouter } from './routes'

const router = express.Router();

router.use(mixedRouter)

export { router }