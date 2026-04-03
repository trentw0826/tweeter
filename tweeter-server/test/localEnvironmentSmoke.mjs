import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";

import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";

const localApiBaseUrl =
  process.env.LOCAL_API_BASE_URL ?? "http://127.0.0.1:3000";
const localAwsEndpoint =
  process.env.LOCAL_AWS_ENDPOINT ?? "http://127.0.0.1:4566";
const region = process.env.AWS_REGION ?? "us-east-1";

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
};

const expectedTables = [
  "tweeter-auth-tokens-local",
  "tweeter-feed-local",
  "tweeter-follows-local",
  "tweeter-story-local",
  "tweeter-users-local",
];

const expectedBucket = "tweeter-media-local-000000000000";

const awsConfig = {
  endpoint: localAwsEndpoint,
  region,
  credentials,
};

const dynamoClient = new DynamoDBClient(awsConfig);
const s3Client = new S3Client({
  ...awsConfig,
  forcePathStyle: true,
});

async function waitForApiReady(timeoutMs = 120000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${localApiBaseUrl}/user/get`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alias: "@nobody", authToken: "" }),
      });

      if (response.status > 0) {
        return;
      }
    } catch {
      // keep waiting
    }

    await sleep(2000);
  }

  throw new Error(`Timed out waiting for API at ${localApiBaseUrl}`);
}

async function requestJson(path, payload) {
  const response = await fetch(`${localApiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const body = text.length > 0 ? JSON.parse(text) : null;
  return { response, body };
}

async function main() {
  console.log(`Validating LocalStack at ${localAwsEndpoint}`);

  const tablesResponse = await dynamoClient.send(new ListTablesCommand({}));
  for (const tableName of expectedTables) {
    assert.ok(
      tablesResponse.TableNames?.includes(tableName),
      `Expected DynamoDB table ${tableName}`,
    );
  }

  const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
  assert.ok(
    bucketsResponse.Buckets?.some((bucket) => bucket.Name === expectedBucket),
    `Expected S3 bucket ${expectedBucket}`,
  );

  console.log(`Waiting for API at ${localApiBaseUrl}`);
  await waitForApiReady();

  const userLookup = await requestJson("/user/get", {
    alias: "@nobody",
    authToken: "",
  });
  assert.equal(userLookup.response.status, 400);
  assert.equal(userLookup.body?.success, false);
  assert.match(userLookup.body?.message ?? "", /\[bad-request\]/i);

  const login = await requestJson("/auth/login", {
    alias: "",
    password: "password",
  });
  assert.equal(login.response.status, 400);
  assert.equal(login.body?.success, false);
  assert.match(login.body?.message ?? "", /\[bad-request\]/i);

  const register = await requestJson("/auth/register", {
    firstName: "",
    lastName: "",
    alias: "",
    password: "",
    userImageBytes: "",
    imageFileExtension: "",
  });
  assert.equal(register.response.status, 400);
  assert.equal(register.body?.success, false);
  assert.match(register.body?.message ?? "", /\[bad-request\]/i);

  console.log("Local environment smoke tests passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
