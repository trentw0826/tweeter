import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  ScanCommand,
  type ScanCommandOutput,
} from "@aws-sdk/lib-dynamodb";

type WriteRequest = Record<string, any>;
import { TABLE_DEFAULT } from "../data-access/DynamoDB/TableNames.js";

const MAX_BATCH_WRITE = 25;
const MAX_RETRIES = 8;
const BASE_DELAY_MS = 100;

async function clearDatabase(): Promise<void> {
  const nativeClient = new DynamoDBClient({});
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
      const scanResponse: ScanCommandOutput = await withRetry(() =>
        client.send(
          new ScanCommand({
            TableName: tableName,
            ExclusiveStartKey: lastEvaluatedKey,
          }),
        ),
      );

      const items = scanResponse.Items ?? [];
      if (items.length === 0) break;

      const deleteRequests = items.map((item) => {
        const key: Record<string, string | number> = {};
        for (const keyAttr of keyAttributes) {
          key[keyAttr] = item[keyAttr];
        }
        return { DeleteRequest: { Key: key } };
      });

      for (let i = 0; i < deleteRequests.length; i += MAX_BATCH_WRITE) {
        const chunk = deleteRequests.slice(i, i + MAX_BATCH_WRITE);
        await batchWriteWithRetry(client, tableName, chunk);
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
  const exponential = BASE_DELAY_MS * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * BASE_DELAY_MS);
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
