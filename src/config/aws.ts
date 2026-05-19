import { S3Client } from '@aws-sdk/client-s3';

const endpoint = process.env['DO_SPACES_ENDPOINT'];
const region = process.env['DO_SPACES_REGION'] || 'us-east-1';
const accessKeyId = process.env['DO_SPACES_KEY'] || '';
const secretAccessKey = process.env['DO_SPACES_SECRET'] || '';

if (!accessKeyId || !secretAccessKey) {
  console.warn('[aws] Missing DO_SPACES_KEY/SECRET — S3 client will fail on requests.');
}

const s3Client = new S3Client({
  ...(endpoint && { endpoint }),
  forcePathStyle: false,
  region: region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

export default s3Client;
