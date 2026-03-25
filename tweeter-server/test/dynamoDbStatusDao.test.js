import { test } from "@jest/globals";

import { DynamoDBStatusDao } from "../dist/data-access/DynamoDB/DynamoDBStatusDao.js";

function createDaoWithSend(sendImpl) {
  const dao = new DynamoDBStatusDao();
  dao.client.send = sendImpl;
  return dao;
}

const status = {
  post: "hello",
  timestamp: 100,
  user: {
    alias: "@author",
    firstName: "A",
    lastName: "B",
    imageUrl: "u",
  },
};

test("DynamoDBStatusDao.getFeedPage maps FeedItems to StatusDto", async () => {
  const dao = createDaoWithSend(async () => ({
    Items: [
      {
        ownerAlias: "@owner",
        timestamp: 100,
        post: "hello",
        authorAlias: "@author",
        authorFirstName: "A",
        authorLastName: "B",
        authorImageUrl: "u",
      },
    ],
    LastEvaluatedKey: undefined,
  }));

  const page = await dao.getFeedPage("@owner", 10, null);
  expect(page.items).toEqual([status]);
  expect(page.hasMore).toBe(false);
});

test("DynamoDBStatusDao.addStatusToFeeds performs batch writes", async () => {
  let captured = null;
  const dao = createDaoWithSend(async (command) => {
    captured = command.input;
    return {};
  });

  await dao.addStatusToFeeds(["@a", "@b"], status);

  const requests = captured.RequestItems[Object.keys(captured.RequestItems)[0]];
  expect(requests.length).toBe(2);
});

test("DynamoDBStatusDao.getStatus returns null for malformed id", async () => {
  const dao = createDaoWithSend(async () => ({ Item: undefined }));
  const result = await dao.getStatus("bad-id");
  expect(result).toBe(null);
});
