import { S3 } from '@aws-sdk/client-s3';
import { env } from '../config/env';

export function createClient() {
  return new S3({
    region: env.AWS_REG,
    credentials: {
      accessKeyId: env.AWS_KEY,
      secretAccessKey: env.AWS_SECRET,
    },
  });
}

export async function upload(
  key: string,
  contentType: string,
  file: Blob | Buffer | ReadableStream,
) {
  return new Promise((resolve, reject) => {
    createClient().putObject(
      {
        Bucket: env.AWS_BUCKET,
        Key: key,
        Body: file,
        ContentType: contentType,
      },
      (err, data) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log(data);
          resolve(data);
        }
      },
    );
  });
}

export async function remove(key: string) {
  return new Promise((resolve, reject) => {
    createClient().deleteObject(
      {
        Bucket: env.AWS_BUCKET,
        Key: key,
      },
      (err, data) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log(data);
          resolve(data);
        }
      },
    );
  });
}
