import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  ScanCommand,
  type ScanCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { getDynamoDbClientConfig } from "../config/AwsClientConfig.js";

type WriteRequest = Record<string, any>;
import { TABLE_DEFAULT } from "../data-access/DynamoDB/TableNames.js";

const MAX_BATCH_WRITE = 25;
const MAX_RETRIES = 10;
const INITIAL_BACKOFF_MS = 1000;

// Helper function to check if an error is a throughput error
function isThroughputError(error: unknown): boolean {
  if (!error) return false;

  const errorObj = error as Record<string, unknown>;
  const errorMessage = errorObj.message?.toString() || "";
  const errorType = errorObj.__type?.toString() || "";
  const errorName = errorObj.name?.toString() || "";

  // Check for common throughput error indicators in multiple error properties
  const isThroughputErrorType =
    errorType.includes("ProvisionedThroughputExceededException") ||
    errorType.includes("ThrottlingException") ||
    errorType.includes("ReadLimitExceeded") ||
    errorType.includes("WriteLimitExceeded") ||
    errorName.includes("ProvisionedThroughputExceededException") ||
    errorName.includes("ThrottlingException") ||
    errorMessage.includes("ProvisionedThroughputExceededException") ||
    errorMessage.includes("ThrottlingException") ||
    errorMessage.includes("ReadLimitExceeded") ||
    errorMessage.includes("WriteLimitExceeded");

  return isThroughputErrorType;
}

// Helper function to calculate exponential backoff with jitter
function calculateBackoffMs(attempt: number): number {
  const exponentialBackoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
  const jitter = Math.random() * exponentialBackoff * 0.1; // 10% jitter
  return exponentialBackoff + jitter;
}

async function clearDatabase(): Promise<void> {
  const nativeClient = new DynamoDBClient(getDynamoDbClientConfig());
  const documentClient = DynamoDBDocumentClient.from(nativeClient, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

  const tablesToClear = [
    TABLE_DEFAULT.users,
    TABLE_DEFAULT.authTokens,
    TABLE_DEFAULT.follows,
    TABLE_DEFAULT.story,
    TABLE_DEFAULT.feed,
  ];

  console.log("Starting database clear operation...\n");

  for (const tableName of tablesToClear) {
    await clearTable(documentClient, nativeClient, tableName);
  }

  console.log("\n✓ Database cleared successfully!");
  nativeClient.destroy();
}

async function clearTable(
  client: DynamoDBDocumentClient,
  nativeClient: DynamoDBClient,
  tableName: string,
): Promise<void> {
  console.log(`Clearing table: ${tableName}`);

  try {
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;
    let totalDeleted = 0;

    const keyAttributes = await getTableKeyAttributes(nativeClient, tableName);

    do {
      let scanSuccess = false;
      let scanError: Error | null = null;
      let retries = 0;
      let scanResponse: ScanCommandOutput | null = null;

      while (retries <= MAX_RETRIES && !scanSuccess) {
        try {
          scanResponse = await client.send(
            new ScanCommand({
              TableName: tableName,
              ExclusiveStartKey: lastEvaluatedKey,
            }),
          );
          scanSuccess = true;
        } catch (error) {
          scanError = error instanceof Error ? error : new Error(String(error));

          if (isThroughputError(error)) {
            if (retries < MAX_RETRIES) {
              const backoffMs = calculateBackoffMs(retries);
              console.log(
                `  ⚠ Throughput limit exceeded while scanning ${tableName}, retrying in ${Math.round(backoffMs)}ms (attempt ${retries + 1}/${MAX_RETRIES})`,
              );
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
              retries++;
            } else {
              throw new Error(
                `Failed to scan ${tableName} after ${MAX_RETRIES} retries: ${scanError.message}`,
              );
            }
          } else {
            throw error;
          }
        }
      }

      if (!scanResponse) {
        throw scanError || new Error(`Failed to scan ${tableName}`);
      }

      const items = scanResponse.Items ?? [];
      if (items.length === 0) break;

      const deleteRequests = items.map((item) => {
        const key: Record<string, string | number> = {};
        for (const keyAttr of keyAttributes) {
          key[keyAttr] = item[keyAttr];
        }
        return { DeleteRequest: { Key: key } };
      });

      // Execute batch writes in chunks of MAX_BATCH_WRITE with retry logic
      for (let i = 0; i < deleteRequests.length; i += MAX_BATCH_WRITE) {
        const chunk = deleteRequests.slice(
          i,
          Math.min(i + MAX_BATCH_WRITE, deleteRequests.length),
        );

        let retries = 0;
        let success = false;
        let lastError: Error | null = null;

        while (retries <= MAX_RETRIES && !success) {
          try {
            await client.send(
              new BatchWriteCommand({
                RequestItems: {
                  [tableName]: chunk,
                },
              }),
            );
            success = true;
          } catch (error) {
            lastError =
              error instanceof Error ? error : new Error(String(error));

            if (isThroughputError(error)) {
              if (retries < MAX_RETRIES) {
                const backoffMs = calculateBackoffMs(retries);
                console.log(
                  `  ⚠ Throughput limit exceeded for ${tableName}, retrying in ${Math.round(backoffMs)}ms (attempt ${retries + 1}/${MAX_RETRIES})`,
                );
                await new Promise((resolve) => setTimeout(resolve, backoffMs));
                retries++;
              } else {
                throw new Error(
                  `Failed to write batch to ${tableName} after ${MAX_RETRIES} retries: ${lastError.message}`,
                );
              }
            } else {
              // Not a throughput error, throw immediately
              throw error;
            }
          }
        }
      }

      totalDeleted += items.length;
      lastEvaluatedKey = scanResponse.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log(`  ✓ Deleted ${totalDeleted} items from ${tableName}`);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("ResourceNotFoundException")
    ) {
      console.log(`  ⚠ Table ${tableName} does not exist (skipping)`);
    } else {
      console.error(`  ✗ Error clearing table ${tableName}:`, error);
      throw error;
    }
  }
}

async function batchWriteWithRetry(
  client: DynamoDBDocumentClient,
  tableName: string,
  requests: WriteRequest[],
): Promise<void> {
  let unprocessed: WriteRequest[] = requests;
  let attempt = 0;

  while (unprocessed.length > 0) {
    const response = await withRetry(() =>
      client.send(
        new BatchWriteCommand({
          RequestItems: { [tableName]: unprocessed },
        }),
      ),
    );

    const next = response.UnprocessedItems?.[tableName] ?? [];
    if (next.length === 0) return;

    unprocessed = next.filter(
      (request): request is WriteRequest =>
        request.DeleteRequest?.Key !== undefined,
    );
    attempt++;

    if (attempt > MAX_RETRIES) {
      throw new Error(
        `Exceeded retries for unprocessed items in ${tableName} (${next.length} remaining)`,
      );
    }

    await sleep(backoffWithJitter(attempt));
  }
}

async function withRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isThrottleError(error) || attempt >= MAX_RETRIES) throw error;
    await sleep(backoffWithJitter(attempt + 1));
    return withRetry(fn, attempt + 1);
  }
}

function isThrottleError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; message?: string };
  const msg = e.message ?? "";
  return (
    e.name === "ProvisionedThroughputExceededException" ||
    e.name === "ThrottlingException" ||
    msg.includes("Rate exceeded") ||
    msg.includes("throttl")
  );
}

function backoffWithJitter(attempt: number): number {
  const exponential = INITIAL_BACKOFF_MS * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * INITIAL_BACKOFF_MS);
  return exponential + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getTableKeyAttributes(
  nativeClient: DynamoDBClient,
  tableName: string,
): Promise<string[]> {
  const describeResponse = await nativeClient.send(
    new DescribeTableCommand({
      TableName: tableName,
    }),
  );

  const keyAttributes: string[] = [];
  const keySchema = describeResponse.Table?.KeySchema ?? [];

  for (const key of keySchema) {
    if (key.AttributeName) keyAttributes.push(key.AttributeName);
  }

  return keyAttributes;
}

clearDatabase().catch((error) => {
  console.error("Failed to clear database:", error);
  process.exit(1);
});
