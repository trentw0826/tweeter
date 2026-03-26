import { randomUUID } from "node:crypto";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { UserDto } from "tweeter-shared";
import { DynamoDbDao } from "./DynamoDbDao.js";
import { TABLE_DEFAULT, TABLE_ENV } from "./TableNames.js";
import type { UserDao } from "../UserDao.js";

type UserItem = {
  alias: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  passwordHash: string;
  followerCount: number;
  followeeCount: number;
};

type AuthTokenItem = {
  token: string;
  alias: string;
  timestamp: number;
};

const DEFAULT_AUTH_TOKEN_INACTIVITY_MINUTES = 30;
const AUTH_TOKEN_INACTIVITY_MINUTES_ENV = "AUTH_TOKEN_INACTIVITY_MINUTES";

/**
 * DynamoDB implementation of UserDao.
 * Handles all user-related database operations with DynamoDB.
 */
export class DynamoDBUserDao extends DynamoDbDao implements UserDao {
  private get authTokenInactivityTimeoutMs(): number {
    const configuredValue = Number.parseInt(
      process.env[AUTH_TOKEN_INACTIVITY_MINUTES_ENV] ?? "",
      10,
    );

    const minutes =
      Number.isFinite(configuredValue) && configuredValue > 0
        ? configuredValue
        : DEFAULT_AUTH_TOKEN_INACTIVITY_MINUTES;

    return minutes * 60 * 1000;
  }

  private get usersTableName(): string {
    return this.tableName(TABLE_ENV.users, TABLE_DEFAULT.users);
  }

  private get authTokensTableName(): string {
    return this.tableName(TABLE_ENV.authTokens, TABLE_DEFAULT.authTokens);
  }

  async getUser(alias: string): Promise<UserDto | null> {
    const userItem = await this.getItem<UserItem>(this.usersTableName, {
      alias,
    });

    if (userItem === null) {
      return null;
    }

    return {
      alias: userItem.alias,
      firstName: userItem.firstName,
      lastName: userItem.lastName,
      imageUrl: userItem.imageUrl,
    };
  }

  async createUser(user: UserDto, passwordHash: string): Promise<void> {
    await this.putItem<UserItem>(this.usersTableName, {
      alias: user.alias,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      passwordHash,
      followerCount: 0,
      followeeCount: 0,
    });
  }

  async deleteUser(alias: string): Promise<void> {
    await this.deleteItem(this.usersTableName, { alias });
  }

  async getPasswordHash(alias: string): Promise<string | null> {
    const userItem = await this.getItem<UserItem>(this.usersTableName, {
      alias,
    });

    return userItem?.passwordHash ?? null;
  }

  async createAuthToken(alias: string): Promise<string> {
    const token = randomUUID();
    const timestamp = Date.now();

    await this.putItem<AuthTokenItem>(this.authTokensTableName, {
      token,
      alias,
      timestamp,
    });

    return token;
  }

  async getAliasByAuthToken(token: string): Promise<string | null> {
    const tokenItem = await this.getItem<AuthTokenItem>(
      this.authTokensTableName,
      {
        token,
      },
    );

    if (!tokenItem) {
      return null;
    }

    const now = Date.now();
    const isExpired =
      now - tokenItem.timestamp > this.authTokenInactivityTimeoutMs;

    if (isExpired) {
      await this.deleteAuthToken(token);
      return null;
    }

    await this.putItem<AuthTokenItem>(this.authTokensTableName, {
      token: tokenItem.token,
      alias: tokenItem.alias,
      timestamp: now,
    });

    return tokenItem.alias;
  }

  async deleteAuthToken(token: string): Promise<void> {
    await this.deleteItem(this.authTokensTableName, { token });
  }

  async getFollowerCount(alias: string): Promise<number> {
    const userItem = await this.getItem<UserItem>(this.usersTableName, {
      alias,
    });

    return userItem?.followerCount ?? 0;
  }

  async getFolloweeCount(alias: string): Promise<number> {
    const userItem = await this.getItem<UserItem>(this.usersTableName, {
      alias,
    });

    return userItem?.followeeCount ?? 0;
  }

  async updateFollowerCount(alias: string, delta: number): Promise<void> {
    await this.updateCount(alias, "followerCount", delta);
  }

  async updateFolloweeCount(alias: string, delta: number): Promise<void> {
    await this.updateCount(alias, "followeeCount", delta);
  }

  private async updateCount(
    alias: string,
    attributeName: "followerCount" | "followeeCount",
    delta: number,
  ): Promise<void> {
    const currentCount =
      attributeName === "followerCount"
        ? await this.getFollowerCount(alias)
        : await this.getFolloweeCount(alias);

    const nextCount = Math.max(0, currentCount + delta);

    await this.client.send(
      new UpdateCommand({
        TableName: this.usersTableName,
        Key: { alias },
        UpdateExpression: `SET ${attributeName} = :nextCount`,
        ExpressionAttributeValues: {
          ":nextCount": nextCount,
        },
      }),
    );
  }
}
