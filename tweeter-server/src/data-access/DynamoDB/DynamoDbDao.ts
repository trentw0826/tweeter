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
    const result = await this.client.send(new QueryCommand(input));
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
      const page = await this.client.send(
        new QueryCommand({
          ...input,
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );

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
      const chunk = requests.slice(index, index + MAX_BATCH_WRITE);
      await this.client.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: chunk,
          },
        }),
      );
    }
  }
}
