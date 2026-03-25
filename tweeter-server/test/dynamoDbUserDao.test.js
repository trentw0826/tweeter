import { test } from "@jest/globals";

import { DynamoDBUserDao } from "../dist/data-access/DynamoDB/DynamoDBUserDao.js";

function createDaoWithSend(sendImpl) {
  const dao = new DynamoDBUserDao();
  dao.client.send = sendImpl;
  return dao;
}

test("DynamoDBUserDao.getUser maps item to UserDto", async () => {
  const dao = createDaoWithSend(async () => ({
    Item: {
      alias: "@a",
      firstName: "A",
      lastName: "B",
      imageUrl: "url",
      passwordHash: "hash",
      followerCount: 1,
      followeeCount: 2,
    },
  }));

  const user = await dao.getUser("@a");
  expect(user).toEqual({
    alias: "@a",
    firstName: "A",
    lastName: "B",
    imageUrl: "url",
  });
});

test("DynamoDBUserDao.createAuthToken writes token and returns it", async () => {
  let writeInput = null;
  const dao = createDaoWithSend(async (command) => {
    writeInput = command.input;
    return {};
  });

  const token = await dao.createAuthToken("@a");
  expect(typeof token === "string" && token.length > 10).toBeTruthy();
  expect(writeInput.Item.alias).toBe("@a");
  expect(writeInput.Item.token).toBe(token);
});

test("DynamoDBUserDao.getAliasByAuthToken returns null when token missing", async () => {
  const dao = createDaoWithSend(async () => ({ Item: undefined }));
  const alias = await dao.getAliasByAuthToken("missing");
  expect(alias).toBe(null);
});
