import * as Minio from 'minio';

// MinIO client configuration
const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = parseInt(process.env.MINIO_PORT || '9000');
const minioAccessKey = process.env.MINIO_ACCESS_KEY || 'minio_admin';
const minioSecretKey = process.env.MINIO_SECRET_KEY || 'minio_secret_password';
const minioUseSSL = process.env.MINIO_USE_SSL === 'true';

export const minioClient = new Minio.Client({
  endPoint: minioEndpoint,
  port: minioPort,
  useSSL: minioUseSSL,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
});

export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'pro-casa-files';

// Get public URL for a file
export const getPublicUrl = (fileName: string): string => {
  // For development, use localhost. For production, use actual domain
  const baseUrl = process.env.NODE_ENV === 'production'
    ? `https://${minioEndpoint}:${minioPort}`
    : `http://localhost:9000`;
  
  return `${baseUrl}/${MINIO_BUCKET}/${fileName}`;
};

// Initialize bucket (ensure it exists)
export const initializeBucket = async (): Promise<void> => {
  try {
    const exists = await minioClient.bucketExists(MINIO_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(MINIO_BUCKET);
      console.log(`Bucket '${MINIO_BUCKET}' created successfully`);
      
      // Set bucket policy to public read
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(MINIO_BUCKET, JSON.stringify(policy));
    }
    console.log(`MinIO bucket '${MINIO_BUCKET}' is ready`);
  } catch (error) {
    console.error('Failed to initialize MinIO bucket:', error);
    // Don't throw - allow app to start even if MinIO is not available
  }
};
