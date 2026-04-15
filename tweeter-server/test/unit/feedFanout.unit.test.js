import { afterEach, beforeEach, expect, test, jest } from "@jest/globals";

import { DaoFactory } from "../../dist/data-access/DaoFactory.js";
import { AWSSqsPublisher } from "../../dist/data-access/AWSSqsPublisher.js";
import { FeedFanoutService } from "../../dist/model/service/FeedFanoutService.js";
import { handler as postStatusHandler } from "../../dist/status/lambda/PostStatusLambda.js";
import { handler as updateFeedsHandler } from "../../dist/status/lambda/UpdateFeedsLambda.js";

function buildDaoStub() {
  return {
    initialize: async () => {},
    close: async () => {},
  };
}

function configureStatusServiceDependencies({ alias = "@poster" } = {}) {
  const saveStatusCalls = [];
  const addStatusToFeedCalls = [];
  const addStatusToFeedsCalls = [];

  DaoFactory.configureInstance({
    userDao: {
      ...buildDaoStub(),
      getUser: async () => null,
      createUser: async () => {},
      deleteUser: async () => {},
      getPasswordHash: async () => null,
      createAuthToken: async () => "token",
      getAliasByAuthToken: async () => alias,
      deleteAuthToken: async () => {},
      getFollowerCount: async () => 0,
      getFolloweeCount: async () => 0,
      updateFollowerCount: async () => {},
      updateFolloweeCount: async () => {},
    },
    statusDao: {
      ...buildDaoStub(),
      getStatus: async () => null,
      saveStatus: async (status) => {
        saveStatusCalls.push(status);
      },
      deleteStatus: async () => {},
      getStoryPage: async () => ({ items: [], hasMore: false }),
      getFeedPage: async () => ({ items: [], hasMore: false }),
      addStatusToFeed: async (userAlias, status) => {
        addStatusToFeedCalls.push({ userAlias, status });
      },
      addStatusToFeeds: async (userAliases, status) => {
        addStatusToFeedsCalls.push({ userAliases, status });
      },
      backfillFeedFromStory: async () => {},
      removeFeedItemsByAuthor: async () => {},
    },
    followDao: {
      ...buildDaoStub(),
      addFollow: async () => {},
      removeFollow: async () => {},
      getFollowersPage: async () => ({ items: [], hasMore: false }),
      getFolloweesPage: async () => ({ items: [], hasMore: false }),
      getAllFollowers: async () => [],
      isFollowing: async () => false,
    },
    bucketDao: {
      ...buildDaoStub(),
      uploadFile: async () => "https://bucket.example/image.png",
      downloadFile: async () => Buffer.alloc(0),
      deleteFile: async () => {},
      getFileUrl: async () => "https://bucket.example/image.png",
      fileExists: async () => true,
    },
  });

  return { saveStatusCalls, addStatusToFeedCalls, addStatusToFeedsCalls };
}

beforeEach(() => {
  DaoFactory.resetInstance();
});

afterEach(() => {
  DaoFactory.resetInstance();
  delete process.env.POST_STATUS_QUEUE_URL;
  delete process.env.UPDATE_FEED_QUEUE_URL;
  jest.restoreAllMocks();
});

test("FeedFanoutService pages followers and batches queue writes", async () => {
  const followerPageCalls = [];
  const queueBatchCalls = [];

  const followDao = {
    initialize: async () => {},
    close: async () => {},
    addFollow: async () => {},
    removeFollow: async () => {},
    getFollowersPage: async (userAlias, pageSize, lastFollowerAlias) => {
      followerPageCalls.push({ userAlias, pageSize, lastFollowerAlias });

      if (lastFollowerAlias === null) {
        return {
          items: ["@f1", "@f2", "@f3"],
          hasMore: true,
        };
      }

      return {
        items: ["@f4", "@f5"],
        hasMore: false,
      };
    },
    getFolloweesPage: async () => ({ items: [], hasMore: false }),
    getAllFollowers: async () => [],
    isFollowing: async () => false,
  };

  const queuePublisher = {
    initialize: async () => {},
    close: async () => {},
    sendMessage: async () => {},
    sendMessageBatch: async (queueUrl, messages) => {
      queueBatchCalls.push({ queueUrl, messages });
    },
  };

  const service = new FeedFanoutService({
    daoFactory: {
      getFollowDao: () => followDao,
    },
    sqsPublisher: queuePublisher,
    followersPageSize: 3,
    feedBatchSize: 2,
    sqsBatchSize: 10,
  });

  const status = {
    post: "Hello world",
    timestamp: 123,
    user: {
      alias: "@poster",
      firstName: "Post",
      lastName: "Er",
      imageUrl: "https://image.example/photo.png",
    },
  };

  const messagesWritten = await service.enqueueFeedUpdatesForStatus(
    status,
    "https://queue.example/update-feed",
  );

  expect(messagesWritten).toBe(3);
  expect(followerPageCalls).toEqual([
    {
      userAlias: "@poster",
      pageSize: 3,
      lastFollowerAlias: null,
    },
    {
      userAlias: "@poster",
      pageSize: 3,
      lastFollowerAlias: "@f3",
    },
  ]);
  expect(queueBatchCalls).toHaveLength(2);
  expect(queueBatchCalls[0].queueUrl).toBe("https://queue.example/update-feed");
  expect(queueBatchCalls[0].messages).toHaveLength(2);
  expect(
    JSON.parse(queueBatchCalls[0].messages[0].body).followerAliases,
  ).toEqual(["@f1", "@f2"]);
  expect(
    JSON.parse(queueBatchCalls[0].messages[1].body).followerAliases,
  ).toEqual(["@f3"]);
  expect(
    JSON.parse(queueBatchCalls[1].messages[0].body).followerAliases,
  ).toEqual(["@f4", "@f5"]);
});

test("PostStatusLambda saves the status and enqueues a post-status message", async () => {
  const { saveStatusCalls, addStatusToFeedCalls } =
    configureStatusServiceDependencies();
  process.env.POST_STATUS_QUEUE_URL = "https://queue.example/post-status";

  const sendMessageCalls = [];
  jest
    .spyOn(AWSSqsPublisher.prototype, "sendMessage")
    .mockImplementation(async (queueUrl, body) => {
      sendMessageCalls.push({ queueUrl, body });
    });

  await postStatusHandler({
    token: "token",
    newStatus: {
      post: "Queued post",
      timestamp: 111,
      user: {
        alias: "@poster",
        firstName: "Post",
        lastName: "Er",
        imageUrl: "https://image.example/photo.png",
      },
    },
  });

  expect(saveStatusCalls).toHaveLength(1);
  expect(addStatusToFeedCalls).toHaveLength(1);
  expect(addStatusToFeedCalls[0].userAlias).toBe("@poster");
  expect(sendMessageCalls).toEqual([
    {
      queueUrl: "https://queue.example/post-status",
      body: JSON.stringify({
        status: {
          post: "Queued post",
          timestamp: 111,
          user: {
            alias: "@poster",
            firstName: "Post",
            lastName: "Er",
            imageUrl: "https://image.example/photo.png",
          },
        },
      }),
    },
  ]);
});

test("UpdateFeedsLambda writes queued feed batches to DynamoDB", async () => {
  const { addStatusToFeedsCalls } = configureStatusServiceDependencies();

  await updateFeedsHandler({
    Records: [
      {
        body: JSON.stringify({
          status: {
            post: "Queued post",
            timestamp: 111,
            user: {
              alias: "@poster",
              firstName: "Post",
              lastName: "Er",
              imageUrl: "https://image.example/photo.png",
            },
          },
          followerAliases: ["@f1", "@f2"],
        }),
      },
      {
        body: JSON.stringify({
          status: {
            post: "Queued post",
            timestamp: 111,
            user: {
              alias: "@poster",
              firstName: "Post",
              lastName: "Er",
              imageUrl: "https://image.example/photo.png",
            },
          },
          followerAliases: ["@f3"],
        }),
      },
    ],
  });

  expect(addStatusToFeedsCalls).toEqual([
    {
      userAliases: ["@f1", "@f2"],
      status: {
        post: "Queued post",
        timestamp: 111,
        user: {
          alias: "@poster",
          firstName: "Post",
          lastName: "Er",
          imageUrl: "https://image.example/photo.png",
        },
      },
    },
    {
      userAliases: ["@f3"],
      status: {
        post: "Queued post",
        timestamp: 111,
        user: {
          alias: "@poster",
          firstName: "Post",
          lastName: "Er",
          imageUrl: "https://image.example/photo.png",
        },
      },
    },
  ]);
});
