import { test } from "@jest/globals";

import { DynamoDBFollowDao } from "../dist/data-access/DynamoDB/DynamoDBFollowDao.js";

function createDaoWithSend(sendImpl) {
  const dao = new DynamoDBFollowDao();
  dao.client.send = sendImpl;
  return dao;
}

test("DynamoDBFollowDao.getFollowersPage maps aliases and hasMore", async () => {
  const dao = createDaoWithSend(async () => ({
    Items: [
      { followerAlias: "@a", followeeAlias: "@target" },
      { followerAlias: "@b", followeeAlias: "@target" },
    ],
    LastEvaluatedKey: { followerAlias: "@b", followeeAlias: "@target" },
  }));

  const page = await dao.getFollowersPage("@target", 2, null);
  expect(page.items).toEqual(["@a", "@b"]);
  expect(page.hasMore).toBe(true);
});

test("DynamoDBFollowDao.getFolloweesPage maps aliases", async () => {
  const dao = createDaoWithSend(async () => ({
    Items: [
      { followerAlias: "@me", followeeAlias: "@a" },
      { followerAlias: "@me", followeeAlias: "@b" },
    ],
    LastEvaluatedKey: undefined,
  }));

  const page = await dao.getFolloweesPage("@me", 2, null);
  expect(page.items).toEqual(["@a", "@b"]);
  expect(page.hasMore).toBe(false);
});

test("DynamoDBFollowDao.isFollowing returns true when record exists", async () => {
  const dao = createDaoWithSend(async () => ({
    Item: { followerAlias: "@me", followeeAlias: "@you" },
  }));

  const result = await dao.isFollowing("@me", "@you");
  expect(result).toBe(true);
});
