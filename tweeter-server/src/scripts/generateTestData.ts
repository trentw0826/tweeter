import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { BucketDao } from "../data-access/BucketDao.js";
import { DaoFactory } from "../data-access/DaoFactory.js";
import { DynamoDbDao } from "../data-access/DynamoDB/DynamoDbDao.js";
import { TABLE_DEFAULT } from "../data-access/DynamoDB/TableNames.js";

const DEFAULT_FOLLOWER_COUNT = 10_000;
const DEFAULT_PASSWORD = "password";
const DEFAULT_TARGET_ALIAS = "@seed-target";
const DEFAULT_SHARED_PROFILE_IMAGE_KEY = "seed/shared-profile-photo.png";
const DEFAULT_SHARED_PROFILE_IMAGE_CONTENT_TYPE = "image/png";
const DEFAULT_SHARED_PROFILE_IMAGE_PATH = join(
  process.cwd(),
  "assets",
  "missing-profile-photo.png",
);

export type SeedUserItem = {
  alias: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  passwordHash: string;
  followerCount: number;
  followeeCount: number;
};

export type SeedFollowItem = {
  followerAlias: string;
  followeeAlias: string;
};

export type SeedSummary = {
  usersWritten: number;
  followsWritten: number;
  targetAlias: string;
  sharedProfileImageUrl: string;
};

export type SeedOptions = {
  followerCount?: number;
  password?: string;
  targetAlias?: string;
  sharedProfileImageKey?: string;
  sharedProfileImagePath?: string;
};

export type SeedDependencies = {
  daoFactory?: Pick<DaoFactory, "initialize" | "close" | "getBucketDao">;
  writer?: SeedDataWriterLike;
  readSharedProfileImage?: (path: string) => Buffer;
  hashPassword?: (password: string) => Promise<string>;
};

export interface SeedDataWriterLike {
  writeItems(
    tableName: string,
    items: Record<string, unknown>[],
  ): Promise<void>;
}

export class SeedDataWriter extends DynamoDbDao implements SeedDataWriterLike {
  public async writeItems(
    tableName: string,
    items: Record<string, unknown>[],
  ): Promise<void> {
    await this.batchWriteRequests(
      tableName,
      items.map((item) => ({
        PutRequest: {
          Item: item,
        },
      })),
    );
  }
}

function assertNonNegativeInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid ${fieldName}: expected a non-negative integer`);
  }
}

function buildFollowerAlias(index: number): string {
  return `@seed-user-${String(index).padStart(5, "0")}`;
}

export function buildSeedUsers(
  followerCount: number,
  targetAlias: string,
  sharedProfileImageUrl: string,
  passwordHash: string,
): SeedUserItem[] {
  assertNonNegativeInteger(followerCount, "followerCount");

  const users: SeedUserItem[] = [
    {
      alias: targetAlias,
      firstName: "Seed",
      lastName: "Target",
      imageUrl: sharedProfileImageUrl,
      passwordHash,
      followerCount,
      followeeCount: 0,
    },
  ];

  for (let index = 1; index <= followerCount; index += 1) {
    users.push({
      alias: buildFollowerAlias(index),
      firstName: `Seed${index}`,
      lastName: "Follower",
      imageUrl: sharedProfileImageUrl,
      passwordHash,
      followerCount: 0,
      followeeCount: 1,
    });
  }

  return users;
}

export function buildSeedFollows(
  followerCount: number,
  targetAlias: string,
): SeedFollowItem[] {
  assertNonNegativeInteger(followerCount, "followerCount");

  const follows: SeedFollowItem[] = [];
  for (let index = 1; index <= followerCount; index += 1) {
    follows.push({
      followerAlias: buildFollowerAlias(index),
      followeeAlias: targetAlias,
    });
  }

  return follows;
}

export async function generateTestData(
  options: SeedOptions = {},
  dependencies: SeedDependencies = {},
): Promise<SeedSummary> {
  const followerCount = options.followerCount ?? DEFAULT_FOLLOWER_COUNT;
  const password = options.password ?? DEFAULT_PASSWORD;
  const targetAlias = options.targetAlias ?? DEFAULT_TARGET_ALIAS;
  const sharedProfileImageKey =
    options.sharedProfileImageKey ?? DEFAULT_SHARED_PROFILE_IMAGE_KEY;
  const sharedProfileImagePath =
    options.sharedProfileImagePath ?? DEFAULT_SHARED_PROFILE_IMAGE_PATH;
  const daoFactory = dependencies.daoFactory ?? new DaoFactory();
  const writer = dependencies.writer ?? new SeedDataWriter();
  const readSharedProfileImage =
    dependencies.readSharedProfileImage ?? readFileSync;
  const hashPassword =
    dependencies.hashPassword ??
    (async (value: string) => bcrypt.hash(value, 10));

  await daoFactory.initialize();

  try {
    const bucketDao: BucketDao = daoFactory.getBucketDao();
    const sharedProfileImageBytes = readSharedProfileImage(
      sharedProfileImagePath,
    );
    const sharedProfileImageUrl = await bucketDao.uploadFile(
      sharedProfileImageKey,
      sharedProfileImageBytes,
      DEFAULT_SHARED_PROFILE_IMAGE_CONTENT_TYPE,
    );
    const passwordHash = await hashPassword(password);

    const users = buildSeedUsers(
      followerCount,
      targetAlias,
      sharedProfileImageUrl,
      passwordHash,
    );
    const follows = buildSeedFollows(followerCount, targetAlias);

    await writer.writeItems(
      process.env.USERS_TABLE ?? TABLE_DEFAULT.users,
      users,
    );
    await writer.writeItems(
      process.env.FOLLOWS_TABLE ?? TABLE_DEFAULT.follows,
      follows,
    );

    return {
      usersWritten: users.length,
      followsWritten: follows.length,
      targetAlias,
      sharedProfileImageUrl,
    };
  } finally {
    await daoFactory.close();
  }
}

async function main(): Promise<void> {
  console.log("Starting large Tweeter test-data generation...");

  const summary = await generateTestData();

  console.log(
    `Created ${summary.usersWritten} users and ${summary.followsWritten} follow relationships for ${summary.targetAlias}.`,
  );
  console.log(`Shared profile image: ${summary.sharedProfileImageUrl}`);
}

if (process.argv[1] !== undefined) {
  const scriptUrl = pathToFileURL(process.argv[1]).href;
  if (import.meta.url === scriptUrl) {
    main().catch((error) => {
      console.error("Unexpected error during test-data generation", error);
      process.exitCode = 1;
    });
  }
}
