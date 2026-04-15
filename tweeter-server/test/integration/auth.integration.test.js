import assert from "node:assert/strict";
import { test } from "@jest/globals";

import { handler as loginHandler } from "../../dist/auth/lambda/LoginLambda.js";
import { AuthService } from "../../dist/model/service/AuthService.js";

test("AuthService.register normalizes an alias without @", async () => {
  const authService = new AuthService();
  const alias = `alias_${Date.now().toString(36)}`;

  const [user, authToken] = await authService.register(
    "First",
    "Last",
    alias,
    "password",
    "abc123",
    "png",
  );

  assert.ok(user, "Expected a user back from register");
  assert.ok(authToken, "Expected an authToken back from register");
});

test("Login lambda still succeeds for a valid request", async () => {
  const authService = new AuthService();
  const alias = `login_${Date.now().toString(36)}`;

  const [registeredUser] = await authService.register(
    "Login",
    "Tester",
    alias,
    "password",
    "abc123",
    "png",
  );

  const response = await loginHandler({
    alias: registeredUser.alias,
    password: "password",
  });

  assert.equal(response.success, true);
  assert.equal(response.message, null);
  assert.equal(response.user?.alias, registeredUser.alias);
  assert.ok(response.authToken?.token);
});
