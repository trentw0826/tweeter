import { expect, test } from "@jest/globals";

import {
  buildSeedFollows,
  buildSeedUsers,
  generateTestData,
  SeedDataWriter,
} from "../../dist/scripts/generateTestData.js";

function createWriterWithSend(sendImpl) {
  const writer = new SeedDataWriter();
  writer.client.send = sendImpl;
  return writer;
}

test("buildSeedUsers creates one shared-image target account plus followers", () => {
  const users = buildSeedUsers(
    3,
    "@target",
    "https://image.example/photo.png",
    "hash-value",
  );

  expect(users).toHaveLength(4);
  expect(users[0]).toEqual({
    alias: "@target",
    firstName: "Seed",
    lastName: "Target",
    imageUrl: "https://image.example/photo.png",
    passwordHash: "hash-value",
    followerCount: 3,
    followeeCount: 0,
  });
  expect(
    users.slice(1).every((user) => user.imageUrl === users[0].imageUrl),
  ).toBe(true);
  expect(users.slice(1).every((user) => user.followeeCount === 1)).toBe(true);
  expect(users.slice(1).every((user) => user.followerCount === 0)).toBe(true);
});

test("buildSeedFollows makes every follower point at the target account", () => {
  const follows = buildSeedFollows(3, "@target");

  expect(follows).toEqual([
    { followerAlias: "@seed-user-00001", followeeAlias: "@target" },
    { followerAlias: "@seed-user-00002", followeeAlias: "@target" },
    { followerAlias: "@seed-user-00003", followeeAlias: "@target" },
  ]);
});

test("SeedDataWriter batches writes in chunks of 25", async () => {
  const calls = [];
  const writer = createWriterWithSend(async (command) => {
    calls.push(command.input);
    return {};
  });

  const items = Array.from({ length: 52 }, (_, index) => ({
    id: index + 1,
  }));

  await writer.writeItems("seed-table", items);

  expect(calls).toHaveLength(3);
  expect(calls[0].RequestItems["seed-table"]).toHaveLength(25);
  expect(calls[1].RequestItems["seed-table"]).toHaveLength(25);
  expect(calls[2].RequestItems["seed-table"]).toHaveLength(2);
});

test("generateTestData uploads the shared image once and writes users and follows", async () => {
  const uploadCalls = [];
  const writerCalls = [];

  const daoFactory = {
    initialize: async () => {},
    close: async () => {},
    getBucketDao: () => ({
      uploadFile: async (key, fileData, contentType) => {
        uploadCalls.push({ key, fileData, contentType });
        return "https://bucket.example/shared-photo.png";
      },
    }),
  };

  const writer = {
    writeItems: async (tableName, items) => {
      writerCalls.push({ tableName, items });
    },
  };

  const summary = await generateTestData(
    {
      followerCount: 3,
      password: "abc123",
      targetAlias: "@celebrity",
      sharedProfileImageKey: "seed/shared.png",
      sharedProfileImagePath: "/tmp/shared.png",
    },
    {
      daoFactory,
      writer,
      readSharedProfileImage: () => Buffer.from("image-bytes"),
      hashPassword: async (password) => `hash:${password}`,
    },
  );

  expect(uploadCalls).toHaveLength(1);
  expect(uploadCalls[0]).toEqual({
    key: "seed/shared.png",
    fileData: Buffer.from("image-bytes"),
    contentType: "image/png",
  });
  expect(writerCalls).toHaveLength(2);
  expect(writerCalls[0].tableName).toBe("tweeter-users");
  expect(writerCalls[0].items).toHaveLength(4);
  expect(writerCalls[0].items[0].passwordHash).toBe("hash:abc123");
  expect(writerCalls[1].tableName).toBe("tweeter-follows");
  expect(writerCalls[1].items).toHaveLength(3);
  expect(summary).toEqual({
    usersWritten: 4,
    followsWritten: 3,
    targetAlias: "@celebrity",
    sharedProfileImageUrl: "https://bucket.example/shared-photo.png",
  });
});
