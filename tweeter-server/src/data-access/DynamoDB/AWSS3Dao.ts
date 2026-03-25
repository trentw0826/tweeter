import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { BucketDao } from "../BucketDao.js";

/**
 * AWS S3 implementation of BucketDao.
 * Handles all file storage operations with AWS S3.
 */
export class AWSS3Dao implements BucketDao {
  private static client: S3Client | null = null;

  private get client(): S3Client {
    if (AWSS3Dao.client === null) {
      AWSS3Dao.client = new S3Client({});
    }

    return AWSS3Dao.client;
  }

  private get bucketName(): string {
    return process.env.BUCKET_NAME ?? "tweeter-media-local";
  }

  async initialize(): Promise<void> {
    this.client;
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }

  async uploadFile(
    key: string,
    fileData: Buffer | string,
    contentType: string,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileData,
        ContentType: contentType,
      }),
    );

    return this.getFileUrl(key);
  }

  async downloadFile(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    const body = response.Body;
    if (!body || typeof body.transformToByteArray !== "function") {
      return Buffer.alloc(0);
    }

    const data = await body.transformToByteArray();
    return Buffer.from(data);
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  async getFileUrl(key: string): Promise<string> {
    return `s3://${this.bucketName}/${key}`;
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
