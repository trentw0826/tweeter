import bcrypt from "bcryptjs";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { pathToFileURL } from "node:url";
import { TABLE_DEFAULT } from "../data-access/DynamoDB/TableNames.js";

const DEFAULT_FOLLOWER_COUNT = 10_000;
const DEFAULT_POPULAR_ALIAS = "@popular";
const DEFAULT_PASSWORD = "password";
const DEFAULT_FOLLOWER_ALIAS_PREFIX = "@popular-fan";
const DEFAULT_IMAGE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg";
const BATCH_WRITE_SIZE = 25;
const MAX_BATCH_RETRIES = 6;
const INITIAL_BACKOFF_MS = 200;

type SeedConfig = {
  followerCount: number;
  popularAlias: string;
  password: string;
  followerAliasPrefix: string;
};

type SeedUserRecord = {
  alias: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  passwordHash: string;
  followerCount: number;
  followeeCount: number;
};

type SeedFollowRecord = {
  followerAlias: string;
  followeeAlias: string;
};

function parseNumberOption(
  args: string[],
  flag: string,
  fallback: number,
): number {
  const index = args.indexOf(flag);
  if (index === -1 || index + 1 >= args.length) {
    return fallback;
  }

  const parsed = Number(args[index + 1]);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(
      `Invalid value for ${flag}. Expected a non-negative integer.`,
    );
  }

  return parsed;
}

function parseStringOption(
  args: string[],
  flag: string,
  fallback: string,
): string {
  const index = args.indexOf(flag);
  if (index === -1 || index + 1 >= args.length) {
    return fallback;
  }

  const rawValue = args[index + 1];
  if (rawValue === undefined) {
    return fallback;
  }

  const value = rawValue.trim();
  if (value.length === 0) {
    throw new Error(`Invalid value for ${flag}. Expected a non-empty string.`);
  }

  return value;
}

function parseConfigFromArgs(args: string[]): SeedConfig {
  return {
    followerCount: parseNumberOption(
      args,
      "--followers",
      DEFAULT_FOLLOWER_COUNT,
    ),
    popularAlias: parseStringOption(
      args,
      "--popular-alias",
      DEFAULT_POPULAR_ALIAS,
    ),
    password: parseStringOption(args, "--password", DEFAULT_PASSWORD),
    followerAliasPrefix: parseStringOption(
      args,
      "--follower-prefix",
      DEFAULT_FOLLOWER_ALIAS_PREFIX,
    ),
  };
}

function buildFollowerAlias(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(5, "0")}`;
}

function buildUsers(
  followerCount: number,
  popularAlias: string,
  followerAliasPrefix: string,
  sharedProfileImageUrl: string,
  passwordHash: string,
): SeedUserRecord[] {
  const users: SeedUserRecord[] = [
    {
      alias: popularAlias,
      firstName: "Popular",
      lastName: "User",
      imageUrl: sharedProfileImageUrl,
      passwordHash,
      followerCount,
      followeeCount: followerCount,
    },
  ];

  for (let index = 1; index <= followerCount; index += 1) {
    users.push({
      alias: buildFollowerAlias(followerAliasPrefix, index),
      firstName: `Fan${index}`,
      lastName: "User",
      imageUrl: sharedProfileImageUrl,
      passwordHash,
      followerCount: 1,
      followeeCount: 1,
    });
  }

  return users;
}

function buildBidirectionalFollows(
  followerCount: number,
  popularAlias: string,
  followerAliasPrefix: string,
): SeedFollowRecord[] {
  const follows: SeedFollowRecord[] = [];

  for (let index = 1; index <= followerCount; index += 1) {
    const followerAlias = buildFollowerAlias(followerAliasPrefix, index);
    follows.push({
      followerAlias,
      followeeAlias: popularAlias,
    });
    follows.push({
      followerAlias: popularAlias,
      followeeAlias: followerAlias,
    });
  }

  return follows;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function writeBatchWithRetry(
  client: DynamoDBDocumentClient,
  tableName: string,
  items: Record<string, unknown>[],
): Promise<void> {
  let pending = items.map((item) => ({
    PutRequest: {
      Item: item,
    },
  }));

  for (
    let attempt = 1;
    pending.length > 0 && attempt <= MAX_BATCH_RETRIES;
    attempt += 1
  ) {
    try {
      const response = await client.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: pending,
          },
        }),
      );

      pending =
        (response.UnprocessedItems?.[tableName] as
          | typeof pending
          | undefined) ?? [];
      if (pending.length === 0) {
        return;
      }
    } catch (error) {
      if (attempt === MAX_BATCH_RETRIES) {
        throw error;
      }
    }

    const jitter = Math.floor(Math.random() * 100);
    const backoffMs = INITIAL_BACKOFF_MS * 2 ** (attempt - 1) + jitter;
    await delay(backoffMs);
  }

  if (pending.length > 0) {
    throw new Error(
      `Unable to write ${pending.length} items to ${tableName} after ${MAX_BATCH_RETRIES} attempts.`,
    );
  }
}

async function writeItemsInBatches(
  client: DynamoDBDocumentClient,
  tableName: string,
  items: Record<string, unknown>[],
  label: string,
): Promise<void> {
  let processed = 0;
  for (let index = 0; index < items.length; index += BATCH_WRITE_SIZE) {
    const chunk = items.slice(index, index + BATCH_WRITE_SIZE);
    await writeBatchWithRetry(client, tableName, chunk);
    processed += chunk.length;

    if (processed % 1000 === 0 || processed === items.length) {
      console.log(`${label}: ${processed}/${items.length}`);
    }
  }
}

export async function seedPopularUserFollowers(
  config: SeedConfig,
): Promise<void> {
  const usersTable = process.env.USERS_TABLE ?? TABLE_DEFAULT.users;
  const followsTable = process.env.FOLLOWS_TABLE ?? TABLE_DEFAULT.follows;
  const nativeClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(nativeClient, {
    marshallOptions: { removeUndefinedValues: true },
  });

  try {
    const passwordHash = await bcrypt.hash(config.password, 10);
    const users = buildUsers(
      config.followerCount,
      config.popularAlias,
      config.followerAliasPrefix,
      DEFAULT_IMAGE_URL,
      passwordHash,
    );
    const follows = buildBidirectionalFollows(
      config.followerCount,
      config.popularAlias,
      config.followerAliasPrefix,
    );

    console.log(
      `Seeding ${users.length} users and ${follows.length} follow edges into DynamoDB...`,
    );
    await writeItemsInBatches(docClient, usersTable, users, "Users written");
    await writeItemsInBatches(
      docClient,
      followsTable,
      follows,
      "Follows written",
    );

    console.log("Seeding complete.");
    console.log(`Popular alias: ${config.popularAlias}`);
    console.log(`Followers created: ${config.followerCount}`);
  } finally {
    nativeClient.destroy();
  }
}

async function main(): Promise<void> {
  const config = parseConfigFromArgs(process.argv.slice(2));

  console.log("Starting popular-user follower seeding...");
  console.log(
    `popularAlias=${config.popularAlias}, followers=${config.followerCount}, followerPrefix=${config.followerAliasPrefix}`,
  );

  await seedPopularUserFollowers(config);
}

if (process.argv[1] !== undefined) {
  const scriptUrl = pathToFileURL(process.argv[1]).href;
  if (import.meta.url === scriptUrl) {
    main().catch((error) => {
      console.error("Failed to seed popular user followers", error);
      process.exitCode = 1;
    });
  }
}
