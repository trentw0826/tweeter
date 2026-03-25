import type { FollowDao } from "../FollowDao.js";
import type { PagedResult } from "../Dao.js";
import { DynamoDbDao } from "./DynamoDbDao.js";
import { INDEX_NAMES, TABLE_DEFAULT, TABLE_ENV } from "./TableNames.js";

type FollowItem = {
  followerAlias: string;
  followeeAlias: string;
};

/**
 * DynamoDB implementation of FollowDao.
 * Handles all follow relationship operations with DynamoDB.
 */
export class DynamoDBFollowDao extends DynamoDbDao implements FollowDao {
  private get followsTableName(): string {
    return this.tableName(TABLE_ENV.follows, TABLE_DEFAULT.follows);
  }

  async addFollow(followerAlias: string, followeeAlias: string): Promise<void> {
    await this.putItem<FollowItem>(this.followsTableName, {
      followerAlias,
      followeeAlias,
    });
  }

  async removeFollow(
    followerAlias: string,
    followeeAlias: string,
  ): Promise<void> {
    await this.deleteItem(this.followsTableName, {
      followerAlias,
      followeeAlias,
    });
  }

  async getFollowersPage(
    userAlias: string,
    pageSize: number,
    lastFollowerAlias: string | null,
  ): Promise<PagedResult<string>> {
    const page = await this.queryPage<FollowItem>(
      {
        TableName: this.followsTableName,
        IndexName: INDEX_NAMES.followeeIndex,
        KeyConditionExpression: "followeeAlias = :followeeAlias",
        ExpressionAttributeValues: {
          ":followeeAlias": userAlias,
        },
        ExclusiveStartKey:
          lastFollowerAlias === null
            ? undefined
            : {
                followeeAlias: userAlias,
                followerAlias: lastFollowerAlias,
              },
        Limit: pageSize,
      },
      (item) => item as FollowItem,
    );

    return {
      items: page.items.map((item) => item.followerAlias),
      hasMore: page.hasMore,
    };
  }

  async getFolloweesPage(
    userAlias: string,
    pageSize: number,
    lastFolloweeAlias: string | null,
  ): Promise<PagedResult<string>> {
    const page = await this.queryPage<FollowItem>(
      {
        TableName: this.followsTableName,
        KeyConditionExpression: "followerAlias = :followerAlias",
        ExpressionAttributeValues: {
          ":followerAlias": userAlias,
        },
        ExclusiveStartKey:
          lastFolloweeAlias === null
            ? undefined
            : {
                followerAlias: userAlias,
                followeeAlias: lastFolloweeAlias,
              },
        Limit: pageSize,
      },
      (item) => item as FollowItem,
    );

    return {
      items: page.items.map((item) => item.followeeAlias),
      hasMore: page.hasMore,
    };
  }

  async getAllFollowers(userAlias: string): Promise<string[]> {
    const followers = await this.queryAll<FollowItem>(
      {
        TableName: this.followsTableName,
        IndexName: INDEX_NAMES.followeeIndex,
        KeyConditionExpression: "followeeAlias = :followeeAlias",
        ExpressionAttributeValues: {
          ":followeeAlias": userAlias,
        },
      },
      (item) => item as FollowItem,
    );

    return followers.map((item) => item.followerAlias);
  }

  async isFollowing(
    followerAlias: string,
    followeeAlias: string,
  ): Promise<boolean> {
    const relationship = await this.getItem<FollowItem>(this.followsTableName, {
      followerAlias,
      followeeAlias,
    });

    return relationship !== null;
  }
}
