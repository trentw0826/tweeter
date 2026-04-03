import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import type { S3ClientConfig } from "@aws-sdk/client-s3";

const DEFAULT_REGION = "us-east-1";

const readEndpoint = (serviceEndpointVar: string): string | undefined => {
  const endpoint =
    process.env[serviceEndpointVar] ?? process.env.AWS_ENDPOINT_URL;

  if (!endpoint) {
    return undefined;
  }

  const trimmed = endpoint.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readRegion = (): string => {
  const region =
    process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? DEFAULT_REGION;

  return region.trim().length > 0 ? region : DEFAULT_REGION;
};

const readCredentials = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return undefined;
  }

  const sessionToken = process.env.AWS_SESSION_TOKEN;

  return {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {}),
  };
};

export const getDynamoDbClientConfig = (): DynamoDBClientConfig => {
  const config: DynamoDBClientConfig = {
    region: readRegion(),
  };

  const endpoint = readEndpoint("AWS_ENDPOINT_URL_DYNAMODB");
  if (endpoint) {
    config.endpoint = endpoint;
  }

  const credentials = readCredentials();
  if (credentials) {
    config.credentials = credentials;
  }

  return config;
};

export const getS3ClientConfig = (): S3ClientConfig => {
  const endpoint = readEndpoint("AWS_ENDPOINT_URL_S3");
  const forcePathStyle =
    process.env.AWS_S3_FORCE_PATH_STYLE === "true" || endpoint !== undefined;

  const config: S3ClientConfig = {
    region: readRegion(),
    forcePathStyle,
  };

  if (endpoint) {
    config.endpoint = endpoint;
  }

  const credentials = readCredentials();
  if (credentials) {
    config.credentials = credentials;
  }

  return config;
};

export const getS3PublicBaseUrl = (): string | undefined => {
  const configured = process.env.AWS_S3_PUBLIC_URL_BASE;
  if (configured && configured.trim().length > 0) {
    return configured.trim().replace(/\/$/, "");
  }

  const endpoint = readEndpoint("AWS_ENDPOINT_URL_S3");
  if (endpoint) {
    return endpoint.replace(/\/$/, "");
  }

  return undefined;
};
