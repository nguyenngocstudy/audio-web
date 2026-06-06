import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const CDN    = process.env.R2_PUBLIC_URL!;

export async function createUploadUrl(key: string, contentType: string) {
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 3600 }
  );
}

export async function deleteObject(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export const cdnUrl   = (key: string) => `${CDN}/${key}`;
export const audioKey = (storyId: string, chapterId: string) => `audio/${storyId}/${chapterId}/index.m3u8`;
export const coverKey = (storyId: string) => `covers/${storyId}.jpg`;
