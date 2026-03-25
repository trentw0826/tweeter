import type { Dao } from "./Dao.js";

/**
 * BucketDao handles data access for S3 (Simple Storage Service).
 * Defines operations for file storage and retrieval from AWS S3.
 */
export interface BucketDao extends Dao {
  /**
   * Uploads a file to S3.
   * @param key - The unique identifier/path for the file in S3
   * @param fileData - The file content as a buffer or string
   * @param contentType - The MIME type of the file
   * @returns The URL of the uploaded file
   */
  uploadFile(
    key: string,
    fileData: Buffer | string,
    contentType: string
  ): Promise<string>;

  /**
   * Downloads a file from S3.
   * @param key - The unique identifier/path for the file in S3
   * @returns The file content as a buffer
   */
  downloadFile(key: string): Promise<Buffer>;

  /**
   * Deletes a file from S3.
   * @param key - The unique identifier/path for the file in S3
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Gets the URL for accessing a file in S3.
   * @param key - The unique identifier/path for the file in S3
   * @returns The URL to access the file
   */
  getFileUrl(key: string): Promise<string>;

  /**
   * Checks if a file exists in S3.
   * @param key - The unique identifier/path for the file in S3
   * @returns True if the file exists, false otherwise
   */
  fileExists(key: string): Promise<boolean>;
}
