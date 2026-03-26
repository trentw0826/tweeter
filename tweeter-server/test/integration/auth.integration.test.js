import assert from "node:assert/strict";
import test from "node:test";

import { FakeData } from "tweeter-shared";
import { handler as loginHandler } from "../../dist/auth/lambda/LoginLambda.js";
import { AuthService } from "../../dist/model/service/AuthService.js";

function getValidUser() {
  const user = FakeData.instance.firstUser?.dto;
  assert.ok(user, "Expected fake data to provide a seed user");
  return user;
}

test("AuthService.register normalizes an alias without @", async () => {
  const authService = new AuthService();

  const [user, authToken] = await authService.register(
    "First",
    "Last",
    "alias",
    "password",
    "abc123",
    "png",
  );

  assert.ok(user, "Expected a user back from register");
  assert.ok(authToken, "Expected an authToken back from register");
});

test("Login lambda still succeeds for a valid request", async () => {
  const response = await loginHandler({
    alias: getValidUser().alias,
    password: "password",
  });

  assert.equal(response.success, true);
  assert.equal(response.message, null);
  assert.equal(response.user?.alias, getValidUser().alias);
  assert.ok(response.authToken?.token);
});
