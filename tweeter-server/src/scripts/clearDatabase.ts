import {
  DynamoDBClient,
  DeleteTableCommand,
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  ScanCommand,
  type ScanCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { TABLE_DEFAULT } from "../data-access/DynamoDB/TableNames.js";

const MAX_BATCH_WRITE = 25;

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
  await nativeClient.destroy();
}

async function clearTable(
  client: DynamoDBDocumentClient,
  nativeClient: DynamoDBClient,
  tableName: string,
): Promise<void> {
  console.log(`Clearing table: ${tableName}`);

  try {
    // Scan the table to get all items
    let lastEvaluatedKey = undefined;
    let totalDeleted = 0;

    do {
      const scanResponse: ScanCommandOutput = await client.send(
        new ScanCommand({
          TableName: tableName,
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );

      const items = scanResponse.Items ?? [];

      if (items.length === 0) {
        break;
      }

      // Get the key attributes for this table
      const keyAttributes = await getTableKeyAttributes(
        nativeClient,
        tableName,
      );

      // Prepare batch delete requests
      const deleteRequests = items.map((item) => {
        const key: Record<string, string | number> = {};
        for (const keyAttr of keyAttributes) {
          key[keyAttr] = item[keyAttr];
        }
        return {
          DeleteRequest: {
            Key: key,
          },
        };
      });

      // Execute batch writes in chunks of MAX_BATCH_WRITE
      for (let i = 0; i < deleteRequests.length; i += MAX_BATCH_WRITE) {
        const chunk = deleteRequests.slice(
          i,
          Math.min(i + MAX_BATCH_WRITE, deleteRequests.length),
        );
        await client.send(
          new BatchWriteCommand({
            RequestItems: {
              [tableName]: chunk,
            },
          }),
        );
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
    if (key.AttributeName) {
      keyAttributes.push(key.AttributeName);
    }
  }

  return keyAttributes;
}

clearDatabase().catch((error) => {
  console.error("Failed to clear database:", error);
  process.exit(1);
});
