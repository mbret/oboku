import aws from 'aws-sdk'
import { WASABI_AWS_ACCESS_KEY, WASABI_AWS_SECRET_KEY } from './constants'

const credentials = new aws.Credentials(WASABI_AWS_ACCESS_KEY, WASABI_AWS_SECRET_KEY)
aws.config.update({ region: 'us-east-1', credentials })

export const s3 = new aws.S3({ endpoint: 's3.us-west-1.wasabisys.com' })