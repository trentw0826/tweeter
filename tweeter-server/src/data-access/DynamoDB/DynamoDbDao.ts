import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import type { Dao, PagedResult } from "../Dao.js";

export type DynamoItem = Record<string, unknown>;
type BatchWriteRequest = {
  PutRequest?: { Item: DynamoItem };
  DeleteRequest?: { Key: Record<string, string | number> };
};

const MAX_BATCH_WRITE = 25;
const MAX_BATCH_WRITE_RETRIES = 6;
const INITIAL_RETRY_BACKOFF_MS = 100;
const MAX_QUERY_RETRIES = 6;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableDynamoError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const name = error.name;
  return (
    name === "ProvisionedThroughputExceededException" ||
    name === "ThrottlingException" ||
    name === "RequestLimitExceeded"
  );
}

/**
 * Shared base class for all DynamoDB DAOs.
 * Encapsulates client creation and common read/write/query behavior.
 */
export abstract class DynamoDbDao implements Dao {
  private static documentClient: DynamoDBDocumentClient | null = null;

  protected get client(): DynamoDBDocumentClient {
    if (DynamoDbDao.documentClient === null) {
      const nativeClient = new DynamoDBClient({});
      DynamoDbDao.documentClient = DynamoDBDocumentClient.from(nativeClient, {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      });
    }

    return DynamoDbDao.documentClient;
  }

  public async initialize(): Promise<void> {
    this.client;
  }

  public async close(): Promise<void> {
    return Promise.resolve();
  }

  protected tableName(envVarName: string, fallbackName: string): string {
    return process.env[envVarName] ?? fallbackName;
  }

  protected async getItem<TItem extends DynamoItem>(
    tableName: string,
    key: Record<string, string | number>,
  ): Promise<TItem | null> {
    const response = await this.client.send(
      new GetCommand({
        TableName: tableName,
        Key: key,
      }),
    );

    return (response.Item as TItem | undefined) ?? null;
  }

  protected async putItem<TItem extends DynamoItem>(
    tableName: string,
    item: TItem,
  ): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      }),
    );
  }

  protected async deleteItem(
    tableName: string,
    key: Record<string, string | number>,
  ): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: tableName,
        Key: key,
      }),
    );
  }

  protected async queryPage<TItem extends DynamoItem>(
    input: QueryCommandInput,
    mapItem: (item: DynamoItem) => TItem,
  ): Promise<PagedResult<TItem>> {
    let result;
    for (let attempt = 1; attempt <= MAX_QUERY_RETRIES; attempt += 1) {
      try {
        result = await this.client.send(new QueryCommand(input));
        break;
      } catch (error) {
        if (!isRetryableDynamoError(error) || attempt === MAX_QUERY_RETRIES) {
          throw error;
        }

        const jitterMs = Math.floor(Math.random() * 50);
        const backoffMs =
          INITIAL_RETRY_BACKOFF_MS * 2 ** (attempt - 1) + jitterMs;
        await sleep(backoffMs);
      }
    }

    if (result === undefined) {
      throw new Error("Failed to query DynamoDB page");
    }

    const items = (result.Items ?? []).map(mapItem);

    return {
      items,
      hasMore: result.LastEvaluatedKey !== undefined,
    };
  }

  protected async queryAll<TItem extends DynamoItem>(
    input: QueryCommandInput,
    mapItem: (item: DynamoItem) => TItem,
  ): Promise<TItem[]> {
    const items: TItem[] = [];
    let exclusiveStartKey = input.ExclusiveStartKey;

    do {
      let page;
      for (let attempt = 1; attempt <= MAX_QUERY_RETRIES; attempt += 1) {
        try {
          page = await this.client.send(
            new QueryCommand({
              ...input,
              ExclusiveStartKey: exclusiveStartKey,
            }),
          );
          break;
        } catch (error) {
          if (!isRetryableDynamoError(error) || attempt === MAX_QUERY_RETRIES) {
            throw error;
          }

          const jitterMs = Math.floor(Math.random() * 50);
          const backoffMs =
            INITIAL_RETRY_BACKOFF_MS * 2 ** (attempt - 1) + jitterMs;
          await sleep(backoffMs);
        }
      }

      if (page === undefined) {
        throw new Error("Failed to query DynamoDB pages");
      }

      for (const item of page.Items ?? []) {
        items.push(mapItem(item));
      }

      exclusiveStartKey = page.LastEvaluatedKey;
    } while (exclusiveStartKey !== undefined);

    return items;
  }

  protected async batchWriteRequests(
    tableName: string,
    requests: BatchWriteRequest[],
  ): Promise<void> {
    if (requests.length === 0) {
      return;
    }

    for (let index = 0; index < requests.length; index += MAX_BATCH_WRITE) {
      let pendingRequests = requests.slice(index, index + MAX_BATCH_WRITE);

      for (
        let attempt = 1;
        pendingRequests.length > 0 && attempt <= MAX_BATCH_WRITE_RETRIES;
        attempt += 1
      ) {
        try {
          const response = await this.client.send(
            new BatchWriteCommand({
              RequestItems: {
                [tableName]: pendingRequests,
              },
            }),
          );

          pendingRequests =
            (response.UnprocessedItems?.[tableName] as BatchWriteRequest[]) ??
            [];
          if (pendingRequests.length === 0) {
            break;
          }
        } catch (error) {
          if (attempt === MAX_BATCH_WRITE_RETRIES) {
            throw error;
          }
        }

        const jitterMs = Math.floor(Math.random() * 50);
        const backoffMs =
          INITIAL_RETRY_BACKOFF_MS * 2 ** (attempt - 1) + jitterMs;
        await sleep(backoffMs);
      }

      if (pendingRequests.length > 0) {
        throw new Error(
          `Batch write failed for ${pendingRequests.length} unprocessed items in ${tableName}.`,
        );
      }
    }
  }
}
