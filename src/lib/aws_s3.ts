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
    const location =
      env.AWS_BUCKET && env.AWS_REG
        ? `https://${env.AWS_BUCKET}.s3.${env.AWS_REG}.amazonaws.com/${key}`
        : undefined;
    return {
      Bucket: env.AWS_BUCKET,
      Key: key,
      Location: location,
      ETag: data?.ETag,
      bucket: env.AWS_BUCKET,
      key,
      location,
      etag: data?.ETag,
    };
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
