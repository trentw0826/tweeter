import { jest, test } from "@jest/globals";

import { DynamoDBUserDao } from "../../dist/data-access/DynamoDB/DynamoDBUserDao.js";

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

test("DynamoDBUserDao.getAliasByAuthToken returns alias and refreshes timestamp when token active", async () => {
  const originalDateNow = Date.now;
  Date.now = jest.fn(() => 1000);

  const calls = [];
  const dao = createDaoWithSend(async (command) => {
    calls.push(command.input);

    if (calls.length === 1) {
      return {
        Item: {
          token: "t1",
          alias: "@a",
          timestamp: 0,
        },
      };
    }

    return {};
  });

  const alias = await dao.getAliasByAuthToken("t1");

  expect(alias).toBe("@a");
  expect(calls.length).toBe(2);
  expect(calls[1].Item).toEqual({
    token: "t1",
    alias: "@a",
    timestamp: 1000,
  });

  Date.now = originalDateNow;
});

test("DynamoDBUserDao.getAliasByAuthToken returns null and deletes token when inactive too long", async () => {
  const originalDateNow = Date.now;
  const originalEnv = process.env.AUTH_TOKEN_INACTIVITY_MINUTES;

  process.env.AUTH_TOKEN_INACTIVITY_MINUTES = "1";
  Date.now = jest.fn(() => 120001);

  const calls = [];
  const dao = createDaoWithSend(async (command) => {
    calls.push(command.input);

    if (calls.length === 1) {
      return {
        Item: {
          token: "t2",
          alias: "@b",
          timestamp: 0,
        },
      };
    }

    return {};
  });

  const alias = await dao.getAliasByAuthToken("t2");

  expect(alias).toBe(null);
  expect(calls.length).toBe(2);
  expect(calls[1].Key).toEqual({ token: "t2" });

  if (originalEnv === undefined) {
    delete process.env.AUTH_TOKEN_INACTIVITY_MINUTES;
  } else {
    process.env.AUTH_TOKEN_INACTIVITY_MINUTES = originalEnv;
  }
  Date.now = originalDateNow;
});
