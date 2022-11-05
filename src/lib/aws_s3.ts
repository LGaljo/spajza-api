import * as aws from 'aws-sdk';
import { env } from '../config/env';

export function createClient() {
  return new aws.S3({
    accessKeyId: env.AWS_KEY,
    secretAccessKey: env.AWS_SECRET,
    region: env.AWS_REG,
  });
}

export async function upload(
  key: string,
  contentType: string,
  file: Blob | Buffer | ReadableStream,
) {
  return new Promise((resolve, reject) => {
    createClient().upload(
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
