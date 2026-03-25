import { test } from "@jest/globals";

import { DaoFactory } from "../dist/data-access/DaoFactory.js";

function buildDaoStub() {
  return {
    initialize: async () => {},
    close: async () => {},
  };
}

test("DaoFactory uses configured dependencies", async () => {
  const userDao = buildDaoStub();
  const statusDao = buildDaoStub();
  const followDao = buildDaoStub();
  const bucketDao = buildDaoStub();

  DaoFactory.configureInstance({
    userDao,
    statusDao,
    followDao,
    bucketDao,
  });

  const instance = DaoFactory.getInstance();
  expect(instance.getUserDao()).toBe(userDao);
  expect(instance.getStatusDao()).toBe(statusDao);
  expect(instance.getFollowDao()).toBe(followDao);
  expect(instance.getBucketDao()).toBe(bucketDao);
});

test("DaoFactory.initialize and close call each DAO exactly once", async () => {
  const calls = [];
  const track = (name) => ({
    initialize: async () => calls.push(`init:${name}`),
    close: async () => calls.push(`close:${name}`),
  });

  DaoFactory.configureInstance({
    userDao: track("user"),
    statusDao: track("status"),
    followDao: track("follow"),
    bucketDao: track("bucket"),
  });

  const factory = DaoFactory.getInstance();
  await factory.initialize();
  await factory.close();

  expect(calls).toEqual([
    "init:user",
    "init:status",
    "init:follow",
    "init:bucket",
    "close:user",
    "close:status",
    "close:follow",
    "close:bucket",
  ]);
});

test("DaoFactory.resetInstance recreates singleton", async () => {
  const first = DaoFactory.getInstance();
  DaoFactory.resetInstance();
  const second = DaoFactory.getInstance();

  expect(first).not.toBe(second);
});
