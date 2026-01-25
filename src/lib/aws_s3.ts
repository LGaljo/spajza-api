import { S3 } from '@aws-sdk/client-s3';
import { env } from '../config/env';

const client = new S3({
  region: env.AWS_REG,
  credentials: {
    accessKeyId: env.AWS_KEY,
    secretAccessKey: env.AWS_SECRET,
  },
});

export function createClient() {
  return client;
}

export async function upload(
  key: string,
  contentType: string,
  file: Blob | Buffer | ReadableStream,
) {
  try {
    const data = await client.putObject({
      Bucket: env.AWS_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    });
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function remove(key: string) {
  try {
    const data = await client.deleteObject({
      Bucket: env.AWS_BUCKET,
      Key: key,
    });
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
