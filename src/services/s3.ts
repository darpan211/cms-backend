import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/aws.js';
import { S3_BUCKET, UPLOAD_URL_EXPIRY, STREAM_URL_EXPIRY } from '../constants/index.js';

export class S3Service {
  /**
   * Generate presigned POST URL for direct S3 upload from client
   * @param fileName - Name of the file to upload
   * @param fileType - MIME type of the file
   * @returns Presigned PUT URL and metadata
   */
  static async generateUploadUrl(fileName: string, fileType: string): Promise<any> {
    const key = `uploads/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: UPLOAD_URL_EXPIRY,
    });

    return {
      url: signedUrl,
      s3Key: key,
      expiresIn: UPLOAD_URL_EXPIRY,
    };
  }

  /**
   * Generate presigned GET URL for streaming from S3
   * @param s3Key - S3 object key
   * @returns Presigned GET URL
   */
  static async generateStreamUrl(s3Key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: STREAM_URL_EXPIRY,
    });

    return signedUrl;
  }

  /**
   * Delete multiple objects from S3 in a single batch request.
   * @param keys - Array of S3 object keys to delete
   */
  static async deleteObjects(keys: string[]): Promise<void> {
    const filtered = keys.filter((k): k is string => Boolean(k));
    if (filtered.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: S3_BUCKET,
      Delete: {
        Objects: filtered.map((Key) => ({ Key })),
        Quiet: true,
      },
    });

    await s3Client.send(command);
  }

  /**
   * Verify object exists in S3
   * @param s3Key - S3 object key
   * @returns Boolean indicating existence
   */
  static async verifyObjectExists(s3Key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
      });
      await s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
