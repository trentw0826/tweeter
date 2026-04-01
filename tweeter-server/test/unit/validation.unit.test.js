import assert from "node:assert/strict";
import { test } from "@jest/globals";

import { FakeData } from "tweeter-shared";
import { handler as loginHandler } from "../../dist/auth/lambda/LoginLambda.js";
import { handler as getFolloweesHandler } from "../../dist/follow/lambda/GetFolloweesLambda.js";
import { handler as postStatusHandler } from "../../dist/status/lambda/PostStatusLambda.js";
import { AuthService } from "../../dist/model/service/AuthService.js";
import { FollowService } from "../../dist/model/service/FollowService.js";
import { StatusService } from "../../dist/model/service/StatusService.js";
import { UserService } from "../../dist/model/service/UserService.js";

function getValidUser() {
  const user = FakeData.instance.firstUser?.dto;
  assert.ok(user, "Expected fake data to provide a seed user");
  return user;
}

function getValidToken() {
  const token = FakeData.instance.authToken.dto.token;
  assert.ok(token, "Expected fake data to provide a seed auth token");
  return token;
}

function getValidStatus() {
  return {
    post: "Hello, Tweeter!",
    user: getValidUser(),
    timestamp: Date.now(),
  };
}

async function assertRejectsBadRequest(action, messageFragment) {
  await assert.rejects(action, (error) => {
    assert.match(error.message, /\[bad-request\]/i);
    if (messageFragment) {
      assert.match(error.message, messageFragment);
    }
    return true;
  });
}

async function assertLambdaBadRequest(
  lambdaHandler,
  requestBody,
  messageFragment,
) {
  const response = await lambdaHandler({ body: JSON.stringify(requestBody) });

  assert.equal(response.statusCode, 400);
  const payload = JSON.parse(response.body);
  assert.match(payload.message ?? "", /\[bad-request\]/i);

  if (messageFragment) {
    assert.match(payload.message ?? "", messageFragment);
  }
}

test("AuthService.login rejects a blank alias", async () => {
  const authService = new AuthService();

  await assertRejectsBadRequest(
    () => authService.login("   ", "password"),
    /Invalid alias/i,
  );
});

test("AuthService.logout rejects a blank token", async () => {
  const authService = new AuthService();

  await assertRejectsBadRequest(
    () => authService.logout("   "),
    /Invalid token/i,
  );
});

test("FollowService.retrievePageOfFollowees rejects non-positive page sizes", async () => {
  const followService = new FollowService();

  await assertRejectsBadRequest(
    () =>
      followService.retrievePageOfFollowees(
        getValidToken(),
        getValidUser().alias,
        0,
        null,
      ),
    /Invalid pageSize/i,
  );
});

test("FollowService.follow rejects malformed user DTOs", async () => {
  const followService = new FollowService();
  const invalidUser = {
    ...getValidUser(),
    alias: "not-an-alias",
  };

  await assertRejectsBadRequest(
    () => followService.follow(getValidToken(), invalidUser),
    /Invalid userToFollow\.alias/i,
  );
});

test("UserService.getUser rejects blank tokens", async () => {
  const userService = new UserService();

  await assertRejectsBadRequest(
    () => userService.getUser("", getValidUser().alias),
    /Invalid token/i,
  );
});

test("StatusService.postStatus rejects blank post text", async () => {
  const statusService = new StatusService();
  const invalidStatus = {
    ...getValidStatus(),
    post: "   ",
  };

  await assertRejectsBadRequest(
    () => statusService.postStatus(getValidToken(), invalidStatus),
    /Invalid newStatus\.post/i,
  );
});

test("Login lambda rejects invalid requests with a bad-request error", async () => {
  await assertLambdaBadRequest(
    loginHandler,
    { alias: "", password: "password" },
    /Invalid alias/i,
  );
});

test("GetFollowees lambda rejects invalid page sizes", async () => {
  await assertLambdaBadRequest(
    getFolloweesHandler,
    {
      token: getValidToken(),
      userAlias: getValidUser().alias,
      pageSize: 0,
      lastItem: null,
    },
    /Invalid pageSize/i,
  );
});

test("PostStatus lambda rejects blank status posts", async () => {
  await assertLambdaBadRequest(
    postStatusHandler,
    {
      token: getValidToken(),
      newStatus: {
        ...getValidStatus(),
        post: "   ",
      },
    },
    /Invalid newStatus\.post/i,
  );
});
