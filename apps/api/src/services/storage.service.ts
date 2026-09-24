import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";

let s3Client: S3Client | null = null;

export function getStorageClient(): S3Client {
  if (!s3Client) {
    const config: { region: string; credentials?: { accessKeyId: string; secretAccessKey: string } } = {
      region: env.AWS_REGION,
    };

    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      };
    }

    // Default AWS SDK chain will automatically pick up AWS CLI credentials if env vars not provided
    s3Client = new S3Client(config);
  }
  return s3Client;
}

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const client = getStorageClient();

  const command = new PutObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  const publicUrl = `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl };
}

export async function deleteStorageObject(key: string): Promise<boolean> {
  const client = getStorageClient();
  try {
    const command = new DeleteObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (err) {
    console.error("[AWS S3] Failed to delete object:", err);
    return false;
  }
}
