import assert from "node:assert/strict";
import { test } from "@jest/globals";

import { UserService } from "../../dist/model/service/UserService.js";
import { StatusService } from "../../dist/model/service/StatusService.js";
import { FollowService } from "../../dist/model/service/FollowService.js";
import { DaoFactory } from "../../dist/data-access/DaoFactory.js";

function createDaoFactory(overrides = {}) {
  const userDao = {
    initialize: async () => {},
    close: async () => {},
    getUser: async () => null,
    createUser: async () => {},
    deleteUser: async () => {},
    getPasswordHash: async () => null,
    createAuthToken: async () => "token",
    getAliasByAuthToken: async () => null,
    deleteAuthToken: async () => {},
    getFollowerCount: async () => 0,
    getFolloweeCount: async () => 0,
    updateFollowerCount: async () => {},
    updateFolloweeCount: async () => {},
    ...(overrides.userDao ?? {}),
  };

  const statusDao = {
    initialize: async () => {},
    close: async () => {},
    getStoryPage: async () => ({ items: [], hasMore: false }),
    getFeedPage: async () => ({ items: [], hasMore: false }),
    saveStatus: async () => {},
    addStatusToFeed: async () => {},
    addStatusToFeeds: async () => {},
    removeFeedItemsByAuthor: async () => {},
    backfillFeedFromStory: async () => {},
    ...(overrides.statusDao ?? {}),
  };

  const followDao = {
    initialize: async () => {},
    close: async () => {},
    addFollow: async () => {},
    removeFollow: async () => {},
    isFollowing: async () => false,
    getFollowersPage: async () => ({ items: [], hasMore: false }),
    getFolloweesPage: async () => ({ items: [], hasMore: false }),
    getAllFollowers: async () => [],
    ...(overrides.followDao ?? {}),
  };

  const bucketDao = {
    initialize: async () => {},
    close: async () => {},
    uploadFile: async () => "https://example.com/image.png",
    ...(overrides.bucketDao ?? {}),
  };

  return new DaoFactory({ userDao, statusDao, followDao, bucketDao });
}

test("UserService.getUser rejects invalid auth tokens", async () => {
  const userService = new UserService(createDaoFactory());

  await assert.rejects(
    () => userService.getUser("token", "@target"),
    /\[unauthorized\] Invalid auth token/i,
  );
});

test("StatusService.retrievePageOfFeedItems rejects invalid auth tokens", async () => {
  const statusService = new StatusService(createDaoFactory());

  await assert.rejects(
    () => statusService.retrievePageOfFeedItems("token", "@target", 10, null),
    /\[unauthorized\] Invalid auth token/i,
  );
});

test("FollowService.retrievePageOfFollowers rejects invalid auth tokens", async () => {
  const followService = new FollowService(createDaoFactory());

  await assert.rejects(
    () => followService.retrievePageOfFollowers("token", "@target", 10, null),
    /\[unauthorized\] Invalid auth token/i,
  );
});

test("UserService.getUser proceeds when token is active", async () => {
  const expectedUser = {
    alias: "@target",
    firstName: "Target",
    lastName: "User",
    imageUrl: "https://example.com/u.png",
  };

  const userService = new UserService(
    createDaoFactory({
      userDao: {
        getAliasByAuthToken: async () => "@active",
        getUser: async () => expectedUser,
      },
    }),
  );

  await expect(userService.getUser("token", "@target")).resolves.toEqual(
    expectedUser,
  );
});
