import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { StatusDto } from "tweeter-shared";
import type { StatusDao } from "../StatusDao.js";
import type { PagedResult } from "../Dao.js";
import { DynamoDbDao } from "./DynamoDbDao.js";
import {
  feedItemToStatus,
  storyItemToStatus,
  statusToFeedItem,
  statusToStoryItem,
  type FeedItem,
  type StoryItem,
} from "./StatusRecord.js";
import { TABLE_DEFAULT, TABLE_ENV } from "./TableNames.js";

export class DynamoDBStatusDao extends DynamoDbDao implements StatusDao {
  private get storyTableName(): string {
    return this.tableName(TABLE_ENV.story, TABLE_DEFAULT.story);
  }

  private get feedTableName(): string {
    return this.tableName(TABLE_ENV.feed, TABLE_DEFAULT.feed);
  }

  async getStatus(statusId: string): Promise<StatusDto | null> {
    const [alias, timestampString] = statusId.split("#");
    if (alias === undefined || timestampString === undefined) {
      return null;
    }

    const timestamp = Number(timestampString);
    if (Number.isNaN(timestamp)) {
      return null;
    }

    const storyItem = await this.getItem<StoryItem>(this.storyTableName, {
      userAlias: alias,
      timestamp,
    });

    if (storyItem === null) {
      return null;
    }

    return storyItemToStatus(storyItem);
  }

  async getStoryPage(
    userAlias: string,
    pageSize: number,
    lastTimestamp: number | null,
  ): Promise<PagedResult<StatusDto>> {
    const page = await this.queryPage<StoryItem>(
      {
        TableName: this.storyTableName,
        KeyConditionExpression: "userAlias = :userAlias",
        ExpressionAttributeValues: {
          ":userAlias": userAlias,
        },
        ExclusiveStartKey:
          lastTimestamp === null
            ? undefined
            : {
                userAlias,
                timestamp: lastTimestamp,
              },
        ScanIndexForward: false,
        Limit: pageSize,
      },
      (item) => item as StoryItem,
    );

    return {
      items: page.items.map(storyItemToStatus),
      hasMore: page.hasMore,
    };
  }

  async getFeedPage(
    userAlias: string,
    pageSize: number,
    lastTimestamp: number | null,
  ): Promise<PagedResult<StatusDto>> {
    const page = await this.queryPage<FeedItem>(
      {
        TableName: this.feedTableName,
        KeyConditionExpression: "ownerAlias = :ownerAlias",
        ExpressionAttributeValues: {
          ":ownerAlias": userAlias,
        },
        ExclusiveStartKey:
          lastTimestamp === null
            ? undefined
            : {
                ownerAlias: userAlias,
                timestamp: lastTimestamp,
              },
        ScanIndexForward: false,
        Limit: pageSize,
      },
      (item) => item as FeedItem,
    );

    return {
      items: page.items.map(feedItemToStatus),
      hasMore: page.hasMore,
    };
  }

  async saveStatus(status: StatusDto): Promise<void> {
    await this.putItem<StoryItem>(
      this.storyTableName,
      statusToStoryItem(status),
    );
  }

  async deleteStatus(statusId: string): Promise<void> {
    const [alias, timestampString] = statusId.split("#");
    if (alias === undefined || timestampString === undefined) {
      return;
    }

    const timestamp = Number(timestampString);
    if (Number.isNaN(timestamp)) {
      return;
    }

    await this.deleteItem(this.storyTableName, {
      userAlias: alias,
      timestamp,
    });
  }

  async addStatusToFeed(userAlias: string, status: StatusDto): Promise<void> {
    await this.putItem<FeedItem>(
      this.feedTableName,
      statusToFeedItem(userAlias, status),
    );
  }

  async addStatusToFeeds(
    userAliases: string[],
    status: StatusDto,
  ): Promise<void> {
    await this.batchWriteRequests(
      this.feedTableName,
      userAliases.map((ownerAlias) => ({
        PutRequest: {
          Item: statusToFeedItem(ownerAlias, status),
        },
      })),
    );
  }

  async backfillFeedFromStory(
    followerAlias: string,
    followeeAlias: string,
  ): Promise<void> {
    const recentStoryItems = await this.queryAll<StoryItem>(
      {
        TableName: this.storyTableName,
        KeyConditionExpression: "userAlias = :userAlias",
        ExpressionAttributeValues: {
          ":userAlias": followeeAlias,
        },
        ScanIndexForward: false,
        Limit: 100,
      },
      (item) => item as StoryItem,
    );

    await this.batchWriteRequests(
      this.feedTableName,
      recentStoryItems.map((item) => ({
        PutRequest: {
          Item: {
            ownerAlias: followerAlias,
            timestamp: item.timestamp,
            post: item.post,
            authorAlias: item.authorAlias,
            authorFirstName: item.authorFirstName,
            authorLastName: item.authorLastName,
            authorImageUrl: item.authorImageUrl,
          },
        },
      })),
    );
  }

  async removeFeedItemsByAuthor(
    ownerAlias: string,
    authorAlias: string,
  ): Promise<void> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.feedTableName,
        KeyConditionExpression: "ownerAlias = :ownerAlias",
        FilterExpression: "authorAlias = :authorAlias",
        ExpressionAttributeValues: {
          ":ownerAlias": ownerAlias,
          ":authorAlias": authorAlias,
        },
      }),
    );

    const items = (response.Items ?? []) as FeedItem[];
    await this.batchWriteRequests(
      this.feedTableName,
      items.map((item) => ({
        DeleteRequest: {
          Key: {
            ownerAlias: item.ownerAlias,
            timestamp: item.timestamp,
          },
        },
      })),
    );
  }
}
