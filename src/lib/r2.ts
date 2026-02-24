import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_BUCKET = 'phaethon-r2';

/**
 * Helper to get S3 client for R2.
 */
function getS3Client() {
    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ENDPOINT) {
        throw new Error('R2 S3 Credentials (Access Key, Secret, Endpoint) are not configured.');
    }

    return new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        forcePathStyle: true,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });
}

/**
 * Service to handle interactions with Cloudflare R2 bucket via S3 API.
 */
export const R2Service = {
    /**
     * Upload an object to R2.
     * @param key Identifier for the object (UUID).
     * @param data The file data.
     * @param options Optional R2 metadata.
     */
    async put(key: string, data: any, options?: any) {
        const client = getS3Client();
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: data,
            ContentType: options?.httpMetadata?.contentType,
        });
        return await client.send(command);
    },

    /**
     * Retrieve an object from R2.
     * @param key Identifier for the object.
     * @param range Optional HTTP Range string.
     */
    async get(key: string, range?: string) {
        const client = getS3Client();
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Range: range,
        });
        const response = await client.send(command);
        return {
            body: response.Body,
            contentType: response.ContentType,
            size: response.ContentLength,
            contentRange: response.ContentRange,
        };
    },

    /**
     * Delete an object from R2.
     * @param key Identifier for the object.
     */
    async delete(key: string) {
        const client = getS3Client();
        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
        });
        return await client.send(command);
    },

    /**
     * Get object metadata (head) from R2.
     * @param key Identifier for the object.
     */
    async head(key: string) {
        const client = getS3Client();
        const command = new HeadObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
        });
        const response = await client.send(command);
        return {
            size: response.ContentLength,
            contentType: response.ContentType,
        };
    },

    /**
     * Generate a signed URL for direct client-side upload (PUT).
     */
    async getPresignedUploadUrl(key: string, contentType: string) {
        const client = getS3Client();
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            ContentType: contentType,
        });
        return await getSignedUrl(client, command, { expiresIn: 3600 });
    },

    /**
     * Generate a signed URL for direct client-side download/stream (GET).
     */
    async getPresignedDownloadUrl(key: string, fileName?: string) {
        const client = getS3Client();
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            ResponseContentDisposition: fileName ? `attachment; filename="${encodeURIComponent(fileName)}"` : undefined,
        });
        return await getSignedUrl(client, command, { expiresIn: 3600 });
    }
};
