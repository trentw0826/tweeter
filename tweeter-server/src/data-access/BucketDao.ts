import type { Dao } from "./Dao.js";

/**
 * BucketDao handles data access for bucket storage services like AWS S3.
 * Defines operations for file storage and retrieval from a bucket.
 */
export interface BucketDao extends Dao {
  /**
   * Uploads a file to the bucket.
   * @param key - The unique identifier/path for the file in the bucket
   * @param fileData - The file content as a buffer or string
   * @param contentType - The MIME type of the file
   * @returns The URL of the uploaded file
   */
  uploadFile(
    key: string,
    fileData: Buffer | string,
    contentType: string,
  ): Promise<string>;

  /**
   * Downloads a file from the bucket.
   * @param key - The unique identifier/path for the file in the bucket
   * @returns The file content as a buffer
   */
  downloadFile(key: string): Promise<Buffer>;

  /**
   * Deletes a file from the bucket.
   * @param key - The unique identifier/path for the file in the bucket
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Gets the URL for accessing a file in the bucket.
   * @param key - The unique identifier/path for the file in the bucket
   * @returns The URL to access the file
   */
  getFileUrl(key: string): Promise<string>;

  /**
   * Checks if a file exists in the bucket.
   * @param key - The unique identifier/path for the file in the bucket
   * @returns True if the file exists, false otherwise
   */
  fileExists(key: string): Promise<boolean>;
}
