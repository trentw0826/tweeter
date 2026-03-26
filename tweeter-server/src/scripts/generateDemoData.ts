import type { StatusDto, UserDto } from "tweeter-shared";
import {
  DaoFactory,
  DynamoDBUserDao,
  DynamoDBStatusDao,
  DynamoDBFollowDao,
} from "../data-access/index.js";
import type { BucketDao, DaoDependencies } from "../data-access/index.js";
import { AuthService } from "../model/service/AuthService.js";
import { StatusService } from "../model/service/StatusService.js";
import { FollowService } from "../model/service/FollowService.js";

const USER_COUNT = 100;
const STATUSES_PER_USER = 5;
const PASSWORD = "password";

class LocalBucketDao implements BucketDao {
  async initialize(): Promise<void> {
    // No-op for local demo data generation.
  }

  async close(): Promise<void> {
    // No-op for local demo data generation.
  }

  async uploadFile(
    key: string,
    _fileData: Buffer | string,
    _contentType: string,
  ): Promise<string> {
    return this.getFileUrl(key);
  }

  async downloadFile(_key: string): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  async deleteFile(_key: string): Promise<void> {
    // No-op
  }

  async getFileUrl(key: string): Promise<string> {
    return `s3://local-demo-bucket/${key}`;
  }

  async fileExists(_key: string): Promise<boolean> {
    return true;
  }
}

function createLocalDependencies(): DaoDependencies {
  return {
    userDao: new DynamoDBUserDao(),
    statusDao: new DynamoDBStatusDao(),
    followDao: new DynamoDBFollowDao(),
    bucketDao: new LocalBucketDao(),
  };
}

async function generateUsers(
  authService: AuthService,
  daoFactory: DaoFactory,
): Promise<{ users: UserDto[]; tokens: string[] }> {
  const users: UserDto[] = [];
  const tokens: string[] = [];

  // Simple guard to avoid obviously duplicating the demo set.
  const existingFirst = await daoFactory.getUserDao().getUser("@user1");
  if (existingFirst) {
    console.log(
      "Demo data appears to already exist (found @user1). Aborting generation.",
    );
    return { users, tokens };
  }

  const placeholderImageBase64 =
    Buffer.from("demo-image-bytes").toString("base64");
  const imageExtension = "png";

  for (let i = 1; i <= USER_COUNT; i += 1) {
    const alias = `@user${i}`;
    const firstName = `User${i}`;
    const lastName = "Demo";

    try {
      const [user, authToken] = await authService.register(
        firstName,
        lastName,
        alias,
        PASSWORD,
        placeholderImageBase64,
        imageExtension,
      );

      users.push(user);
      tokens.push(authToken.token);
      console.log(`Registered ${alias}`);
    } catch (error) {
      console.error(`Failed to register ${alias}:`, error);
    }
  }

  return { users, tokens };
}

async function generateStatuses(
  statusService: StatusService,
  users: UserDto[],
  tokens: string[],
): Promise<void> {
  const now = Date.now();

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const token = tokens[i];
    if (!token) {
      console.warn(`Skipping statuses for ${user.alias}: missing auth token`);
      continue;
    }

    for (let j = 0; j < STATUSES_PER_USER; j += 1) {
      const status: StatusDto = {
        post: `Demo status ${j + 1} from ${user.alias}`,
        user,
        // Stagger timestamps to get a realistic-looking feed.
        timestamp: now - (i * 10 + j) * 60 * 1000,
      };

      try {
        await statusService.postStatus(token, status);
        console.log(`Posted status ${j + 1} for ${user.alias}`);
      } catch (error) {
        console.error(`Failed to post status for ${user.alias}:`, error);
      }
    }
  }
}

async function generateFollows(
  followService: FollowService,
  users: UserDto[],
  tokens: string[],
): Promise<void> {
  if (users.length === 0) {
    return;
  }

  // Each user follows the next few users in a ring.
  const followSpan = 5;

  for (let i = 0; i < users.length; i += 1) {
    const follower = users[i];
    const followerToken = tokens[i];
    if (!followerToken) {
      console.warn(
        `Skipping follows for ${follower.alias}: missing auth token`,
      );
      continue;
    }

    for (let offset = 1; offset <= followSpan; offset += 1) {
      const followeeIndex = (i + offset) % users.length;
      const userToFollow = users[followeeIndex];

      try {
        await followService.follow(followerToken, userToFollow);
        console.log(`${follower.alias} now follows ${userToFollow.alias}`);
      } catch (error) {
        console.error(
          `Failed follow from ${follower.alias} to ${userToFollow.alias}:`,
          error,
        );
      }
    }
  }
}

async function main(): Promise<void> {
  console.log("Starting Tweeter demo data generation...");

  const daoFactory = new DaoFactory(createLocalDependencies());
  await daoFactory.initialize();

  try {
    const authService = new AuthService(daoFactory);
    const statusService = new StatusService(daoFactory);
    const followService = new FollowService(daoFactory);

    const { users, tokens } = await generateUsers(authService, daoFactory);
    if (users.length === 0) {
      console.log("No users created; skipping statuses and follows.");
      return;
    }

    await generateStatuses(statusService, users, tokens);
    await generateFollows(followService, users, tokens);

    console.log("Demo data generation complete.");
  } finally {
    await daoFactory.close();
  }
}

main().catch((error) => {
  console.error("Unexpected error during demo data generation", error);
  process.exitCode = 1;
});
