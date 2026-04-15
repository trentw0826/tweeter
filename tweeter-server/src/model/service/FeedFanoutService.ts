import type { StatusDto } from "tweeter-shared";
import { DaoFactory } from "../../data-access/index.js";
import type {
  FollowDao,
  QueueMessage,
  SqsPublisher,
} from "../../data-access/index.js";
import { AWSSqsPublisher } from "../../data-access/index.js";
import { assertStatusDto } from "./Validation.js";

const DEFAULT_FOLLOWERS_PAGE_SIZE = 100;
const DEFAULT_FEED_BATCH_SIZE = 25;
const DEFAULT_SQS_BATCH_SIZE = 10;

export type FeedFanoutDependencies = {
  daoFactory?: DaoFactory;
  sqsPublisher?: SqsPublisher;
  followersPageSize?: number;
  feedBatchSize?: number;
  sqsBatchSize?: number;
};

type FeedUpdateMessage = {
  status: StatusDto;
  followerAliases: string[];
};

const SQS_BATCH_ID_MAX_LENGTH = 80;

function chunkArray<T>(items: T[], batchSize: number): T[][] {
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error("Invalid batchSize: expected a positive integer");
  }

  if (items.length === 0) {
    return [];
  }

  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }

  return batches;
}

function buildQueueMessageId(status: StatusDto, startIndex: number): string {
  const safeAlias = status.user.alias
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/^_+/, "")
    .slice(0, 40);
  const aliasPart = safeAlias.length > 0 ? safeAlias : "user";
  const id = `${aliasPart}-${status.timestamp}-${startIndex}`;

  if (id.length <= SQS_BATCH_ID_MAX_LENGTH) {
    return id;
  }

  return id.slice(0, SQS_BATCH_ID_MAX_LENGTH);
}

export class FeedFanoutService {
  private readonly followDao: FollowDao;
  private readonly sqsPublisher: SqsPublisher;
  private readonly followersPageSize: number;
  private readonly feedBatchSize: number;
  private readonly sqsBatchSize: number;

  public constructor({
    daoFactory = DaoFactory.getInstance(),
    sqsPublisher = new AWSSqsPublisher(),
    followersPageSize = DEFAULT_FOLLOWERS_PAGE_SIZE,
    feedBatchSize = DEFAULT_FEED_BATCH_SIZE,
    sqsBatchSize = DEFAULT_SQS_BATCH_SIZE,
  }: FeedFanoutDependencies = {}) {
    this.followDao = daoFactory.getFollowDao();
    this.sqsPublisher = sqsPublisher;
    this.followersPageSize = followersPageSize;
    this.feedBatchSize = feedBatchSize;
    this.sqsBatchSize = sqsBatchSize;
  }

  public async enqueueFeedUpdatesForStatus(
    status: StatusDto,
    queueUrl: string,
  ): Promise<number> {
    assertStatusDto(status, "status");
    if (queueUrl.trim().length === 0) {
      throw new Error("Invalid queueUrl: expected a non-empty string");
    }

    let lastFollowerAlias: string | null = null;
    let messagesWritten = 0;
    let hasMoreFollowers = true;

    while (hasMoreFollowers) {
      const page = await this.followDao.getFollowersPage(
        status.user.alias,
        this.followersPageSize,
        lastFollowerAlias,
      );

      if (page.items.length === 0) {
        return messagesWritten;
      }

      const feedBatches = chunkArray(page.items, this.feedBatchSize);
      const queueMessages: QueueMessage[] = feedBatches.map(
        (followerAliases, index) => {
          const payload: FeedUpdateMessage = {
            status,
            followerAliases,
          };

          return {
            id: buildQueueMessageId(status, messagesWritten + index),
            body: JSON.stringify(payload),
          };
        },
      );

      for (
        let index = 0;
        index < queueMessages.length;
        index += this.sqsBatchSize
      ) {
        const queueBatch = queueMessages.slice(
          index,
          index + this.sqsBatchSize,
        );
        await this.sqsPublisher.sendMessageBatch(queueUrl, queueBatch);
      }

      messagesWritten += queueMessages.length;
      lastFollowerAlias = page.items[page.items.length - 1] ?? null;
      hasMoreFollowers = page.hasMore;
    }

    return messagesWritten;
  }
}

export type { FeedUpdateMessage };
export { chunkArray };
