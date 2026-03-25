import { test } from "@jest/globals";

import { DynamoDbDao } from "../dist/data-access/DynamoDB/DynamoDbDao.js";

class TestDynamoDao extends DynamoDbDao {
  getClient() {
    return this.client;
  }

  async callQueryPage(input, mapItem) {
    return this.queryPage(input, mapItem);
  }

  async callQueryAll(input, mapItem) {
    return this.queryAll(input, mapItem);
  }

  async callBatchWriteRequests(tableName, requests) {
    return this.batchWriteRequests(tableName, requests);
  }
}

test("DynamoDbDao.queryPage returns mapped items and hasMore", async () => {
  const dao = new TestDynamoDao();
  const sent = [];
  dao.getClient().send = async (command) => {
    sent.push(command.input);
    return {
      Items: [{ id: "a" }, { id: "b" }],
      LastEvaluatedKey: { id: "b" },
    };
  };

  const result = await dao.callQueryPage({ TableName: "tbl" }, (item) => ({
    id: item.id,
  }));

  expect(sent.length).toBe(1);
  expect(result.items).toEqual([{ id: "a" }, { id: "b" }]);
  expect(result.hasMore).toBe(true);
});

test("DynamoDbDao.queryAll drains all pages", async () => {
  const dao = new TestDynamoDao();
  let count = 0;
  dao.getClient().send = async () => {
    count += 1;
    if (count === 1) {
      return {
        Items: [{ id: "a" }],
        LastEvaluatedKey: { id: "a" },
      };
    }

    return {
      Items: [{ id: "b" }],
      LastEvaluatedKey: undefined,
    };
  };

  const result = await dao.callQueryAll({ TableName: "tbl" }, (item) => ({
    id: item.id,
  }));

  expect(result).toEqual([{ id: "a" }, { id: "b" }]);
  expect(count).toBe(2);
});

test("DynamoDbDao.batchWriteRequests chunks by 25", async () => {
  const dao = new TestDynamoDao();
  const batchSizes = [];

  dao.getClient().send = async (command) => {
    const tableRequests = Object.values(command.input.RequestItems)[0];
    batchSizes.push(tableRequests.length);
    return {};
  };

  const requests = Array.from({ length: 60 }, (_, index) => ({
    PutRequest: { Item: { id: `id-${index}` } },
  }));

  await dao.callBatchWriteRequests("tbl", requests);
  expect(batchSizes).toEqual([25, 25, 10]);
});
